import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import {
  canManageRole,
  canManageTeam,
  getCompanyContext,
} from '@/lib/company-access';

export const runtime = 'nodejs';

export async function DELETE(request, { params }) {
  const auth = await verifyRequestUser(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { invitationId } = await params;
  if (!/^[a-f0-9]{64}$/.test(invitationId)) {
    return NextResponse.json({ error: 'This invitation could not be found.' }, { status: 404 });
  }

  const adminDb = getAdminDb();
  const context = await getCompanyContext(adminDb, auth.uid);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });
  if (!context.company) return NextResponse.json({ error: 'Complete company onboarding first.' }, { status: 409 });
  if (!canManageTeam(context.membership.role)) {
    return NextResponse.json({ error: 'Your role does not have permission to manage invitations.' }, { status: 403 });
  }

  const invitationRef = adminDb.collection('company_invitations').doc(invitationId);
  try {
    await adminDb.runTransaction(async (transaction) => {
      const actorRef = adminDb.collection('companies').doc(context.company.id)
        .collection('members').doc(auth.uid);
      const [actorSnap, invitationSnap] = await Promise.all([
        transaction.get(actorRef),
        transaction.get(invitationRef),
      ]);
      if (!actorSnap.exists || !invitationSnap.exists) throw new Error('INVITATION_NOT_FOUND');

      const invitation = invitationSnap.data();
      if (invitation.companyId !== context.company.id) throw new Error('INVITATION_NOT_FOUND');
      if (!canManageRole(actorSnap.data().role, invitation.role)) throw new Error('INVITATION_FORBIDDEN');
      if (invitation.status !== 'pending') throw new Error('INVITATION_NOT_PENDING');

      const indexId = createHash('sha256')
        .update(`${context.company.id}:${invitation.email}`)
        .digest('hex');
      const indexRef = adminDb.collection('company_invitation_index').doc(indexId);
      const indexSnap = await transaction.get(indexRef);
      transaction.update(invitationRef, {
        status: 'revoked',
        revokedBy: auth.uid,
        revokedAt: FieldValue.serverTimestamp(),
      });
      if (indexSnap.exists && indexSnap.data().tokenHash === invitationId) {
        transaction.update(indexRef, {
          status: 'revoked',
          revokedBy: auth.uid,
          revokedAt: FieldValue.serverTimestamp(),
        });
      }
    });
  } catch (error) {
    if (error.message === 'INVITATION_NOT_FOUND') {
      return NextResponse.json({ error: 'This invitation could not be found.' }, { status: 404 });
    }
    if (error.message === 'INVITATION_FORBIDDEN') {
      return NextResponse.json({ error: 'Your role cannot revoke this invitation.' }, { status: 403 });
    }
    if (error.message === 'INVITATION_NOT_PENDING') {
      return NextResponse.json({ error: 'This invitation is no longer pending.' }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ revoked: true });
}
