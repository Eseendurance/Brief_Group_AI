import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import { getCompanyContext } from '@/lib/company-access';

export const runtime = 'nodejs';

const MAX_COMPANY_NAME = 160;
const MAX_TEXT = 160;

export async function GET(request) {
  const auth = await verifyRequestUser(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const context = await getCompanyContext(getAdminDb(), auth.uid);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });
  if (!context.company) {
    return NextResponse.json({
      company: null,
      membership: null,
      suggestedCompanyName: context.user?.company || '',
    });
  }

  const { company, membership } = context;
  return NextResponse.json({
    company: {
      id: company.id,
      name: company.name,
      legalName: company.legalName || '',
      country: company.country,
      region: company.region || '',
      industry: company.industry,
      companySize: company.companySize,
      website: company.website || '',
      phone: company.phone || '',
      address: company.address || '',
      memberCount: company.memberCount || 1,
      siteCount: company.siteCount || 0,
      createdAt: company.createdAt?.toDate?.().toISOString() || null,
    },
    membership: {
      uid: membership.uid,
      role: membership.role,
      email: membership.email || auth.email || '',
      name: membership.name || '',
    },
  });
}

export async function POST(request) {
  const auth = await verifyRequestUser(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const adminDb = getAdminDb();
  const context = await getCompanyContext(adminDb, auth.uid);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });
  if (context.company) {
    return NextResponse.json({ error: 'You already belong to a company.' }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A valid company profile is required.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const legalName = typeof body.legalName === 'string' ? body.legalName.trim() : '';
  const country = typeof body.country === 'string' ? body.country.trim() : '';
  const region = typeof body.region === 'string' ? body.region.trim() : '';
  const industry = typeof body.industry === 'string' ? body.industry.trim() : '';
  const companySize = typeof body.companySize === 'string' ? body.companySize : '';
  const website = typeof body.website === 'string' ? body.website.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const address = typeof body.address === 'string' ? body.address.trim() : '';

  if (!name || name.length > MAX_COMPANY_NAME || !country || country.length > MAX_TEXT ||
      !industry || industry.length > MAX_TEXT || !companySize ||
      legalName.length > MAX_COMPANY_NAME || region.length > MAX_TEXT ||
      website.length > 2048 || phone.length > 40 || address.length > 500) {
    return NextResponse.json({ error: 'Complete the required company details and keep each value within its limit.' }, { status: 400 });
  }
  if (!['1-10', '11-50', '51-200', '201-1000', '1000+'].includes(companySize)) {
    return NextResponse.json({ error: 'Choose a valid company size.' }, { status: 400 });
  }
  if (website) {
    try {
      const parsed = new URL(website);
      if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
    } catch {
      return NextResponse.json({ error: 'Enter a valid company website URL.' }, { status: 400 });
    }
  }

  const companyRef = adminDb.collection('companies').doc();
  const memberRef = companyRef.collection('members').doc(auth.uid);
  const userRef = adminDb.collection('users').doc(auth.uid);
  const now = FieldValue.serverTimestamp();

  try {
    await adminDb.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) throw new Error('PROFILE_NOT_FOUND');
      if (userSnap.data().companyId) throw new Error('ALREADY_IN_COMPANY');
      transaction.create(companyRef, {
        name,
        legalName,
        country,
        region,
        industry,
        companySize,
        website,
        phone,
        address,
        createdBy: auth.uid,
        memberCount: 1,
        siteCount: 0,
        createdAt: now,
        updatedAt: now,
      });
      transaction.create(memberRef, {
        uid: auth.uid,
        email: auth.email?.toLowerCase() || '',
        name: context.user?.name || '',
        role: 'owner',
        joinedAt: now,
      });
      transaction.update(userRef, {
        companyId: companyRef.id,
        companyRole: 'owner',
        company: name,
        onboardingComplete: true,
        updatedAt: now,
      });
    });
  } catch (error) {
    if (error.message === 'PROFILE_NOT_FOUND') {
      return NextResponse.json({ error: 'Your account profile could not be found. Sign out and sign in again.' }, { status: 403 });
    }
    if (error.message === 'ALREADY_IN_COMPANY') {
      return NextResponse.json({ error: 'You already belong to a company.' }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ companyId: companyRef.id, role: 'owner' }, { status: 201 });
}

export async function PATCH(request) {
  const auth = await verifyRequestUser(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const adminDb = getAdminDb();
  const context = await getCompanyContext(adminDb, auth.uid);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });
  if (!context.company) return NextResponse.json({ error: 'Complete company onboarding first.' }, { status: 409 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A valid company profile is required.' }, { status: 400 });
  }
  const allowedFields = ['name', 'legalName', 'country', 'region', 'industry', 'companySize', 'website', 'phone', 'address'];
  const updates = {};
  for (const field of allowedFields) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== 'string') {
      return NextResponse.json({ error: `Company field "${field}" must be text.` }, { status: 400 });
    }
    updates[field] = body[field].trim();
  }
  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'Include at least one company field to update.' }, { status: 400 });
  }
  if (updates.name !== undefined && (!updates.name || updates.name.length > MAX_COMPANY_NAME)) {
    return NextResponse.json({ error: 'Company name is required and must be 160 characters or fewer.' }, { status: 400 });
  }
  for (const field of ['country', 'industry']) {
    if (updates[field] !== undefined && (!updates[field] || updates[field].length > MAX_COMPANY_NAME)) {
      return NextResponse.json({ error: `Company ${field} is required and must be 160 characters or fewer.` }, { status: 400 });
    }
  }
  if (updates.legalName !== undefined && updates.legalName.length > MAX_COMPANY_NAME) {
    return NextResponse.json({ error: 'Company legal name must be 160 characters or fewer.' }, { status: 400 });
  }
  if (updates.companySize !== undefined &&
      !['1-10', '11-50', '51-200', '201-1000', '1000+'].includes(updates.companySize)) {
    return NextResponse.json({ error: 'Choose a valid company size.' }, { status: 400 });
  }
  const fieldLimits = { region: 160, phone: 40, address: 500, website: 2048 };
  for (const [field, limit] of Object.entries(fieldLimits)) {
    if (updates[field] !== undefined && updates[field].length > limit) {
      return NextResponse.json({ error: `Company ${field} must be ${limit} characters or fewer.` }, { status: 400 });
    }
  }
  if (updates.website) {
    try {
      const parsed = new URL(updates.website);
      if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Unsupported protocol');
    } catch {
      return NextResponse.json({ error: 'Enter a valid company website URL.' }, { status: 400 });
    }
  }

  const companyRef = adminDb.collection('companies').doc(context.company.id);
  const actorRef = companyRef.collection('members').doc(auth.uid);
  const userRef = adminDb.collection('users').doc(auth.uid);
  const forbidden = await adminDb.runTransaction(async (transaction) => {
    const actorSnap = await transaction.get(actorRef);
    if (!actorSnap.exists || !['owner', 'admin'].includes(actorSnap.data().role)) return true;
    updates.updatedAt = FieldValue.serverTimestamp();
    transaction.update(companyRef, updates);
    if (updates.name) transaction.update(userRef, { company: updates.name });
    return false;
  });
  if (forbidden) {
    return NextResponse.json({ error: 'Only company owners and admins can update company details.' }, { status: 403 });
  }
  return NextResponse.json({ updated: true });
}
