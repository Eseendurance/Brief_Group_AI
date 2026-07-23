import { NextResponse } from 'next/server';
import { verifyRequestUser } from '@/lib/firebaseAdmin';
import { sendWelcomeEmail } from '@/lib/email';

// Called once from the client right after a successful Firebase signUp().
// Requires a valid token so this can't be used to spam arbitrary addresses.
export async function POST(request) {
  const authResult = await verifyRequestUser(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { name } = await request.json().catch(() => ({}));
    const result = await sendWelcomeEmail({ to: authResult.email, name });
    return NextResponse.json({ sent: !result.skipped });
  } catch (err) {
    // Non-fatal — don't let an email hiccup block the signup flow.
    console.error('welcome email failed', err);
    return NextResponse.json({ sent: false });
  }
}
