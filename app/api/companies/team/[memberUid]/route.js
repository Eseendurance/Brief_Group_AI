import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import {
  canChangeMemberRole,
  canRemoveMember,
  getCompanyContext,
} from '@/lib/company-access';

export const runtime = 'nodejs';

async function getTarget(request, params) {
  const auth = await verifyRequestUser(request);
  if (auth.error) return { response: NextResponse.json({ error: auth.error }, { status: auth.status }) };
  const { memberUid } = await params;
  const adminDb = getAdminDb();
  const context = await getCompanyContext(adminDb, auth.uid);
  if (context.error) return { response: NextResponse.json({ error: context.error }, { status: context.status }) };
  if (!context.company) return { response: NextResponse.json({ error: 'Complete company onboarding first.' }, { status: 409 }) };
  return { auth, adminDb, context, memberUid };
}

export async function PATCH(request, { params }) {
  const target = await getTarget(request, params);
  if (target.response) return target.response;
  const { auth, adminDb, context, memberUid } = target;
  const body = await request.json().catch(() => null);
  const nextRole = typeof body?.role === 'string' ? body.role : '';
  const companyRef = adminDb.collection('companies').doc(context.company.id);
  const actorRef = companyRef.collection('members').doc(auth.uid);
  const memberRef = companyRef.collection('members').doc(memberUid);
  const userRef = adminDb.collection('users').doc(memberUid);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const [actorSnap, memberSnap, userSnap] = await Promise.all([
        transaction.get(actorRef),
        transaction.get(memberRef),
        transaction.get(userRef),
      ]);
      if (!actorSnap.exists) throw new Error('ROLE_CHANGE_FORBIDDEN');
      if (!memberSnap.exists || !userSnap.exists ||
          userSnap.data().companyId !== context.company.id ||
          userSnap.data().companyRole !== memberSnap.data().role) {
        throw new Error('MEMBER_NOT_FOUND');
      }
      if (!canChangeMemberRole(actorSnap.data().role, memberSnap.data().role, nextRole)) {
        throw new Error('ROLE_CHANGE_FORBIDDEN');
      }
      transaction.update(memberRef, { role: nextRole, updatedAt: FieldValue.serverTimestamp() });
      transaction.update(userRef, { companyRole: nextRole, updatedAt: FieldValue.serverTimestamp() });
    });
  } catch (error) {
    if (error.message === 'MEMBER_NOT_FOUND') {
      return NextResponse.json({ error: 'That team member no longer exists.' }, { status: 404 });
    }
    if (error.message === 'ROLE_CHANGE_FORBIDDEN') {
      return NextResponse.json({ error: 'You do not have permission to assign this role or change this member.' }, { status: 403 });
    }
    throw error;
  }
  return NextResponse.json({ updated: true });
}

export async function DELETE(request, { params }) {
  const target = await getTarget(request, params);
  if (target.response) return target.response;
  const { auth, adminDb, context, memberUid } = target;
  const companyRef = adminDb.collection('companies').doc(context.company.id);
  const actorRef = companyRef.collection('members').doc(auth.uid);
  const memberRef = companyRef.collection('members').doc(memberUid);
  const userRef = adminDb.collection('users').doc(memberUid);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const [actorSnap, memberSnap, userSnap] = await Promise.all([
        transaction.get(actorRef),
        transaction.get(memberRef),
        transaction.get(userRef),
      ]);
      if (!actorSnap.exists) throw new Error('MEMBER_REMOVAL_FORBIDDEN');
      if (!memberSnap.exists || !userSnap.exists ||
          userSnap.data().companyId !== context.company.id ||
          userSnap.data().companyRole !== memberSnap.data().role) {
        throw new Error('MEMBER_NOT_FOUND');
      }
      if (!canRemoveMember(actorSnap.data().role, memberSnap.data().role, memberUid, auth.uid)) {
        throw new Error('MEMBER_REMOVAL_FORBIDDEN');
      }
      transaction.delete(memberRef);
      transaction.update(companyRef, {
        memberCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(userRef, {
        companyId: FieldValue.delete(),
        companyRole: FieldValue.delete(),
        onboardingComplete: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (error) {
    if (error.message === 'MEMBER_NOT_FOUND') {
      return NextResponse.json({ error: 'That team member no longer exists.' }, { status: 404 });
    }
    if (error.message === 'MEMBER_REMOVAL_FORBIDDEN') {
      return NextResponse.json({ error: 'You do not have permission to remove this team member.' }, { status: 403 });
    }
    throw error;
  }
  return NextResponse.json({ removed: true });
}
