import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit, rateLimitFailure } from '@/lib/rate-limit';
import { requireActiveAccess } from '@/lib/subscription';

export const runtime = 'nodejs';

// Real computer-vision inspection using Claude's vision capability.
// The user uploads a photo of equipment (panel, transformer, wiring); Claude
// analyzes the actual image for visible fault indicators (rust, scorch marks,
// exposed wiring, cracking, corrosion) and returns a structured finding.
// This calls the real model on the real uploaded image — it is not a mock classifier.

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Vision inspection is not configured yet. Add ANTHROPIC_API_KEY in your environment variables.' },
      { status: 503 }
    );
  }

  const authResult = await verifyRequestUser(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const access = await requireActiveAccess(getAdminDb(), authResult.uid);
  if (!access.allowed) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const rate = await checkRateLimit('vision', authResult.uid, 20, '1 d');
  const rateFailure = rateLimitFailure(rate, `Daily inspection limit reached. Try again after ${rate.resetAt}.`);
  if (rateFailure) {
    return NextResponse.json({ error: rateFailure.error }, { status: rateFailure.status });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A valid inspection request is required.' }, { status: 400 });
    }

    const { imageBase64, mediaType = 'image/jpeg', assetLabel = '', imageUrl } = body;
    if (typeof imageBase64 !== 'string' || !imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }
    if (imageBase64.length > 4000000) {
      return NextResponse.json({ error: 'The image is too large. Upload an image under 3 MB.' }, { status: 413 });
    }
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)) {
      return NextResponse.json({ error: 'The image data is invalid.' }, { status: 400 });
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mediaType)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are supported.' }, { status: 400 });
    }
    if (typeof assetLabel !== 'string' || assetLabel.length > 120) {
      return NextResponse.json({ error: 'Asset labels must be 120 characters or fewer.' }, { status: 400 });
    }
    if (imageUrl !== undefined) {
      let parsedImageUrl;
      try {
        parsedImageUrl = new URL(imageUrl);
      } catch {
        return NextResponse.json({ error: 'Image URL is invalid.' }, { status: 400 });
      }
      if (typeof imageUrl !== 'string' || imageUrl.length > 2048 || parsedImageUrl.protocol !== 'https:') {
        return NextResponse.json({ error: 'Image URL must be a valid HTTPS URL.' }, { status: 400 });
      }
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `You are inspecting a photo of electrical/industrial equipment (${assetLabel || 'unspecified asset'})
for a remote AI inspection platform. Examine the image carefully for visible fault indicators: corrosion,
rust, scorch/burn marks, exposed or frayed wiring, cracking, overheating discoloration, loose connections,
water ingress, or physical damage.

Respond ONLY as strict JSON, no markdown fences, in this exact shape:
{"riskLevel":"Low|Watch|Elevated|Critical","findings":["short finding 1","short finding 2"],"recommendation":"one sentence next action","confidence":"Low|Medium|High"}

If the image is unclear, too dark, or you cannot make a confident assessment, say so honestly in "findings"
and set confidence to "Low" rather than guessing.`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    let parsed;
    try {
      parsed = JSON.parse((textBlock?.text || '{}').trim());
    } catch {
      parsed = { riskLevel: 'Watch', findings: [textBlock?.text || 'Unable to parse analysis'], recommendation: 'Review manually.', confidence: 'Low' };
    }

    const adminDb = getAdminDb();
    let inspectionId = null;
    if (adminDb) {
      const docRef = await adminDb.collection('inspections').add({
        uid: authResult.uid,
        assetLabel: assetLabel || '',
        imageUrl: imageUrl || null,
        analysis: parsed,
        createdAt: FieldValue.serverTimestamp(),
      });
      inspectionId = docRef.id;
    }

    return NextResponse.json({ analysis: parsed, inspectionId });
  } catch (err) {
    console.error('vision analyze error', err);
    return NextResponse.json({ error: err.message || 'Vision analysis failed' }, { status: 500 });
  }
}
