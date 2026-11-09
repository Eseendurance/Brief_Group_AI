import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    {
      service: 'brief-group-platform',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'local',
      commit: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
