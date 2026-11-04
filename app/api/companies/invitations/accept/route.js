import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await verifyRequestUser(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token : '';
  if (token.length < 32 || token.length > 256) {
    return NextResponse.json({ error: 'This invitation link is invalid or incomplete.' }, { status: 400 });
  }

  const adminDb = getAdminDb();
  if (!adminDb) return NextResponse.json({ error: 'Company services are not configured.' }, { status: 503 });
  const digest = createHash('sha256').update(token).digest('hex');
  const invitationRef = adminDb.collection('company_invitations').doc(digest);
  const userRef = adminDb.collection('users').doc(auth.uid);

  try {
    const companyId = await adminDb.runTransaction(async (transaction) => {
      const [invitationSnap, userSnap] = await Promise.all([
        transaction.get(invitationRef),
        transaction.get(userRef),
      ]);
      if (!invitationSnap.exists || !userSnap.exists) throw new Error('INVITATION_NOT_FOUND');

      const invitation = invitationSnap.data();
      const user = userSnap.data();
      if (invitation.status !== 'pending') throw new Error('INVITATION_USED');
      if (!['admin', 'manager', 'member', 'viewer'].includes(invitation.role)) {
        throw new Error('INVITATION_INVALID_ROLE');
      }
      if (!invitation.expiresAt || invitation.expiresAt.toDate().getTime() <= Date.now()) {
        throw new Error('INVITATION_EXPIRED');
      }
      if (!auth.email || auth.email.toLowerCase() !== invitation.email) throw new Error('EMAIL_MISMATCH');
      if (user.companyId && user.companyId !== invitation.companyId) throw new Error('ALREADY_IN_COMPANY');

      const companyRef = adminDb.collection('companies').doc(invitation.companyId);
      const memberRef = companyRef.collection('members').doc(auth.uid);
      const invitationIndexRef = adminDb.collection('company_invitation_index')
        .doc(createHash('sha256').update(`${invitation.companyId}:${invitation.email}`).digest('hex'));
      const [companySnap, memberSnap, invitationIndexSnap] = await Promise.all([
        transaction.get(companyRef),
        transaction.get(memberRef),
        transaction.get(invitationIndexRef),
      ]);
      if (!companySnap.exists) throw new Error('COMPANY_NOT_FOUND');
      if (!invitationIndexSnap.exists || invitationIndexSnap.data().tokenHash !== digest) {
        throw new Error('INVITATION_REPLACED');
      }
      if (memberSnap.exists) throw new Error('ALREADY_MEMBER');
      transaction.create(memberRef, {
        uid: auth.uid,
        email: auth.email.toLowerCase(),
        name: user.name || '',
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        joinedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(companyRef, {
        memberCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(userRef, {
        companyId: invitation.companyId,
        companyRole: invitation.role,
        company: companySnap.data().name,
        onboardingComplete: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(invitationRef, {
        status: 'accepted',
        acceptedBy: auth.uid,
        acceptedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(invitationIndexRef, {
        status: 'accepted',
        acceptedBy: auth.uid,
        acceptedAt: FieldValue.serverTimestamp(),
      });
      return invitation.companyId;
    });
    return NextResponse.json({ companyId });
  } catch (error) {
    const messages = {
      INVITATION_NOT_FOUND: 'This invitation link is invalid or has already been removed.',
      INVITATION_USED: 'This invitation has already been used.',
      INVITATION_EXPIRED: 'This invitation has expired. Ask your company admin for a new one.',
      EMAIL_MISMATCH: 'Sign in with the email address this invitation was sent to.',
      ALREADY_IN_COMPANY: 'Your account is already assigned to another company.',
      COMPANY_NOT_FOUND: 'The company for this invitation no longer exists.',
      ALREADY_MEMBER: 'Your account is already a member of this company.',
      INVITATION_INVALID_ROLE: 'This invitation has an invalid access role. Ask your company admin for a new one.',
      INVITATION_REPLACED: 'This invitation has been replaced by a newer invitation. Ask your company admin for the current link.',
    };
    const message = messages[error.message];
    if (message) {
      const status = error.message === 'EMAIL_MISMATCH' ? 403 :
        ['ALREADY_IN_COMPANY', 'ALREADY_MEMBER'].includes(error.message) ? 409 : 400;
      return NextResponse.json({ error: message }, { status });
    }
    throw error;
  }
}
