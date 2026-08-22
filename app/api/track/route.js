import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    // Minimal tracking: write to server log. Vercel collects these logs for analytics.
    console.log('TRACK_EVENT', JSON.stringify(body));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('track error', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
