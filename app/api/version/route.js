import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getFirebaseAdminConfiguration() {
  const projectIdSource = process.env.FIREBASE_ADMIN_PROJECT_ID
    ? 'FIREBASE_ADMIN_PROJECT_ID'
    : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      ? 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
      : null;
  const missing = [
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
  ].filter((name) => !process.env[name]);
  if (!projectIdSource) missing.unshift('FIREBASE_ADMIN_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID)');
  return {
    configured: missing.length === 0,
    missing,
    projectIdSource,
  };
}

async function getFirebaseAdminRuntime(configured) {
  try {
    const { getAdminAuth, getAdminDb } = await import('@/lib/firebaseAdmin');
    if (!configured) return { moduleLoaded: true, initialized: false };
    return {
      moduleLoaded: true,
      initialized: Boolean(getAdminAuth() && getAdminDb()),
    };
  } catch (error) {
    console.error('[FIREBASE_ADMIN_DIAGNOSTIC_ERROR]', error?.code || error?.name || 'unknown');
    return {
      moduleLoaded: false,
      initialized: false,
      errorCode: error?.code || error?.name || 'unknown',
    };
  }
}

export async function GET() {
  const firebaseAdmin = getFirebaseAdminConfiguration();
  return NextResponse.json(
    {
      service: 'brief-group-platform',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'local',
      commit: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
      nodeVersion: process.version,
      firebaseAdmin: {
        ...firebaseAdmin,
        runtime: await getFirebaseAdminRuntime(firebaseAdmin.configured),
      },
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
