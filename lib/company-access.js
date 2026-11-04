export const COMPANY_ROLES = ['owner', 'admin', 'manager', 'member', 'viewer'];

const ROLE_LEVEL = {
  owner: 5,
  admin: 4,
  manager: 3,
  member: 2,
  viewer: 1,
};

export async function getCompanyContext(adminDb, uid) {
  if (!adminDb) {
    return { error: 'Company services are not configured.', status: 503 };
  }

  const userSnap = await adminDb.collection('users').doc(uid).get();
  const user = userSnap.data();
  if (!userSnap.exists || typeof user?.companyId !== 'string' || !user.companyId) {
    return { company: null, membership: null, user: user || null };
  }

  const companyRef = adminDb.collection('companies').doc(user.companyId);
  const [companySnap, memberSnap] = await Promise.all([
    companyRef.get(),
    companyRef.collection('members').doc(uid).get(),
  ]);
  if (!companySnap.exists || !memberSnap.exists) {
    return { error: 'Your company membership could not be verified.', status: 403 };
  }

  return {
    company: { id: companySnap.id, ...companySnap.data() },
    membership: { uid, ...memberSnap.data() },
    user,
  };
}

export function canManageRole(actorRole, targetRole) {
  if (!COMPANY_ROLES.includes(actorRole) || !COMPANY_ROLES.includes(targetRole)) return false;
  if (targetRole === 'owner') return false;
  if (actorRole === 'owner') return true;
  if (actorRole === 'admin') return ['manager', 'member', 'viewer'].includes(targetRole);
  if (actorRole === 'manager') return ['member', 'viewer'].includes(targetRole);
  return false;
}

export function canManageTeam(role) {
  return ['owner', 'admin', 'manager'].includes(role);
}

export function canManageCompany(role) {
  return ['owner', 'admin'].includes(role);
}

export function canWriteOperationalData(role) {
  return role !== 'viewer';
}

export function canChangeMemberRole(actorRole, currentRole, nextRole) {
  if (actorRole === 'owner') return currentRole !== 'owner' && nextRole !== 'owner';
  if (actorRole === 'admin') {
    return ['manager', 'member', 'viewer'].includes(currentRole) &&
      ['manager', 'member', 'viewer'].includes(nextRole);
  }
  return false;
}

export function canRemoveMember(actorRole, currentRole, targetUid, actorUid) {
  if (targetUid === actorUid || currentRole === 'owner') return false;
  if (actorRole === 'owner') return true;
  return actorRole === 'admin' && ['manager', 'member', 'viewer'].includes(currentRole);
}

export function roleLevel(role) {
  return ROLE_LEVEL[role] || 0;
}

export function serializeTimestamp(value) {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value || null;
}
