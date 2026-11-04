import { NextResponse } from 'next/server';
import { verifyRequestUser, getAdminDb } from '@/lib/firebaseAdmin';
import {
  canManageTeam,
  getCompanyContext,
  serializeTimestamp,
} from '@/lib/company-access';

export const runtime = 'nodejs';

export async function GET(request) {
  const auth = await verifyRequestUser(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const adminDb = getAdminDb();
  const context = await getCompanyContext(adminDb, auth.uid);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.status });
  if (!context.company) return NextResponse.json({ error: 'Complete company onboarding first.' }, { status: 409 });
  if (!canManageTeam(context.membership.role)) {
    return NextResponse.json({ error: 'Your role does not have permission to manage the team.' }, { status: 403 });
  }

  const [membersSnapshot, invitationsSnapshot] = await Promise.all([
    adminDb.collection('companies').doc(context.company.id).collection('members').limit(200).get(),
    adminDb.collection('company_invitations')
      .where('companyId', '==', context.company.id)
      .limit(200)
      .get(),
  ]);

  const now = Date.now();
  const members = membersSnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      email: data.email || '',
      name: data.name || '',
      role: data.role || 'member',
      joinedAt: serializeTimestamp(data.joinedAt),
    };
  });
  const invitations = invitationsSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        status: data.status,
        email: data.email,
        role: data.role,
        createdAt: serializeTimestamp(data.createdAt),
        expiresAt: serializeTimestamp(data.expiresAt),
      };
    })
    .filter((invite) => invite.status === 'pending' && invite.expiresAt && new Date(invite.expiresAt).getTime() > now);

  return NextResponse.json({ members, invitations, totalMembers: context.company.memberCount || members.length });
}
