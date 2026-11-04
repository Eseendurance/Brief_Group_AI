import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import {
  canManageRole,
  canManageTeam,
  getCompanyContext,
} from '@/lib/company-access';
import { getSiteBaseUrl } from '@/lib/site-url';
import { checkRateLimit, rateLimitFailure } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function tokenDigest(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(request) {
  const auth = await verifyRequestUser(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const adminDb = getAdminDb();
  const context = await getCompanyContext(adminDb, auth.uid);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });
  if (!context.company) return NextResponse.json({ error: 'Complete company onboarding first.' }, { status: 409 });
  if (!canManageTeam(context.membership.role)) {
    return NextResponse.json({ error: 'Your role does not have permission to invite teammates.' }, { status: 403 });
  }
  const rate = await checkRateLimit('company-invitations', auth.uid, 10, '1 h');
  const rateFailure = rateLimitFailure(rate, `Invitation limit reached. Try again after ${rate.resetAt}.`);
  if (rateFailure) return NextResponse.json({ error: rateFailure.error }, { status: rateFailure.status });

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = typeof body?.role === 'string' ? body.role : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Enter a valid work email address.' }, { status: 400 });
  }
  if (!canManageRole(context.membership.role, role)) {
    return NextResponse.json({ error: 'You cannot assign that team role.' }, { status: 403 });
  }
  if (email === (auth.email || '').toLowerCase()) {
    return NextResponse.json({ error: 'You cannot invite your own account.' }, { status: 400 });
  }

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = tokenDigest(rawToken);
  const invitationRef = adminDb.collection('company_invitations').doc(tokenHash);
  const invitationIndexRef = adminDb.collection('company_invitation_index')
    .doc(tokenDigest(`${context.company.id}:${email}`));
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const invitationUrl = new URL('/onboarding', getSiteBaseUrl(request));
  invitationUrl.hash = new URLSearchParams({ invite: rawToken }).toString();
  try {
    await adminDb.runTransaction(async (transaction) => {
      const actorRef = adminDb.collection('companies').doc(context.company.id).collection('members').doc(auth.uid);
      const memberQuery = adminDb.collection('companies').doc(context.company.id)
        .collection('members').where('email', '==', email).limit(1);
      const [actorSnap, indexSnap, membersSnap] = await Promise.all([
        transaction.get(actorRef),
        transaction.get(invitationIndexRef),
        transaction.get(memberQuery),
      ]);
      if (!actorSnap.exists || !canManageRole(actorSnap.data().role, role)) {
        throw new Error('INVITE_FORBIDDEN');
      }
      if (!membersSnap.empty) throw new Error('ALREADY_MEMBER');
      const index = indexSnap.data();
      if (index?.status === 'pending' && index.expiresAt?.toDate?.().getTime() > Date.now()) {
        throw new Error('DUPLICATE_INVITE');
      }
      transaction.create(invitationRef, {
        companyId: context.company.id,
        email,
        role,
        tokenHash,
        status: 'pending',
        invitedBy: auth.uid,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt,
      });
      transaction.set(invitationIndexRef, {
        companyId: context.company.id,
        email,
        tokenHash,
        status: 'pending',
        expiresAt,
      });
    });
  } catch (error) {
    if (error.message === 'INVITE_FORBIDDEN') {
      return NextResponse.json({ error: 'Your current role cannot invite a teammate with that role.' }, { status: 403 });
    }
    if (error.message === 'DUPLICATE_INVITE') {
      return NextResponse.json({ error: 'A valid invitation has already been sent to this email.' }, { status: 409 });
    }
    if (error.message === 'ALREADY_MEMBER') {
      return NextResponse.json({ error: 'This person is already a member of your company.' }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({
    invitation: { email, role, expiresAt: expiresAt.toDate().toISOString() },
    invitationUrl: invitationUrl.toString(),
  }, { status: 201 });
}
