import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getFirebaseAdminConfiguration() {
  const required = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
  ];
  const missing = required.filter((name) => !process.env[name]);
  return {
    configured: missing.length === 0,
    missing,
  };
}

export async function GET() {
  return NextResponse.json(
    {
      service: 'brief-group-platform',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'local',
      commit: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
      nodeVersion: process.version,
      firebaseAdmin: getFirebaseAdminConfiguration(),
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
