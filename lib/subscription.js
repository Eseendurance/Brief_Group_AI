// Real trial logic: every new account gets 14 days with full access to the
// paid-tier AI features (reports, vision inspection, unlimited chat) before
// being asked to subscribe. This file is the single source of truth for
// "is this user still inside their trial" so the banner shown in the UI and
// the actual server-side gate in the API routes never disagree.

export const TRIAL_DAYS = 14;

/**
 * @param {{plan?: string, trialEndsAt?: string|Date|{toDate:Function}}} userDoc
 */
export function getTrialStatus(userDoc) {
  if (!userDoc) return { onTrial: false, expired: true, daysLeft: 0 };

  // Only plans written by a verified payment webhook bypass trial gating.
  if (userDoc.plan && userDoc.plan !== 'trial') {
    const activePlans = ['pilot', 'starter', 'growth'];
    const hasBillingRecord =
      (userDoc.planProvider === 'stripe' &&
        typeof userDoc.stripeSubscriptionId === 'string' &&
        userDoc.stripeSubscriptionId.length > 0) ||
      (userDoc.planProvider === 'paystack' &&
        typeof userDoc.paystackCustomerCode === 'string' &&
        userDoc.paystackCustomerCode.length > 0);
    const active = activePlans.includes(userDoc.plan) && hasBillingRecord;
    return { onTrial: false, expired: !active, daysLeft: 0, plan: userDoc.plan };
  }

  const rawEnd = userDoc.trialEndsAt;
  if (!rawEnd) return { onTrial: false, expired: true, daysLeft: 0, plan: 'trial' };

  const endDate = typeof rawEnd?.toDate === 'function' ? rawEnd.toDate() : new Date(rawEnd);
  const msLeft = endDate.getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

  return { onTrial: msLeft > 0, expired: msLeft <= 0, daysLeft, plan: 'trial' };
}

export function trialEndDateFromNow() {
  return new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Server-side gate for the paid AI features (reports, vision, unlimited chat).
 * Called from the API routes with an Admin Firestore instance — this is what
 * makes the trial a real restriction rather than a UI-only banner.
 */
export async function requireActiveAccess(adminDb, uid) {
  if (!adminDb) {
    return { allowed: false, error: 'Account access could not be verified.', status: 503 };
  }
  const snap = await adminDb.collection('users').doc(uid).get();
  if (!snap.exists) {
    return { allowed: false, error: 'Your account profile could not be found. Please sign in again.', status: 403 };
  }

  const status = getTrialStatus(snap.data());
  if (status.expired) {
    return {
      allowed: false,
      error: status.plan === 'trial'
        ? 'Your 14-day trial has ended. Upgrade your plan to keep using AI features.'
        : 'Your account does not have an active plan. Please contact support.',
      status: status.plan === 'trial' ? 402 : 403,
    };
  }
  return { allowed: true };
}
