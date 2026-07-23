import { Resend } from 'resend';

// Optional, like every other integration here: if RESEND_API_KEY isn't set,
// these functions no-op instead of throwing, so nothing breaks before you
// add the key.

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL || 'Brief Group <onboarding@resend.dev>';

export async function sendWelcomeEmail({ to, name }) {
  const resend = getResend();
  if (!resend) return { skipped: true, reason: 'RESEND_API_KEY not configured' };

  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to the Brief Group pilot',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0A0E1A">Welcome${name ? `, ${name}` : ''}.</h2>
        <p>Your Brief Group pilot account is live. Log in and start with the Energy
        Monitoring or AI Fault Detection module — every reading you log feeds real
        anomaly and risk scoring immediately.</p>
        <p style="margin-top:24px">
          <a href="https://briefgroup.net/dashboard" style="background:#FFB020;color:#0A0E1A;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Open dashboard</a>
        </p>
        <p style="margin-top:32px;font-size:13px;color:#7C879E">— Brief Group</p>
      </div>
    `,
  });
}

export async function sendWaitlistConfirmation({ to }) {
  const resend = getResend();
  if (!resend) return { skipped: true, reason: 'RESEND_API_KEY not configured' };

  return resend.emails.send({
    from: FROM,
    to,
    subject: "You're on the Brief Group Marketplace waitlist",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#0A0E1A">You're on the list.</h2>
        <p>We'll reach out as soon as the Digital Marketplace opens, after Phase 1 and 2
        pilot validation. In the meantime, your pilot dashboard is already live.</p>
        <p style="margin-top:32px;font-size:13px;color:#7C879E">— Brief Group</p>
      </div>
    `,
  });
}

export async function sendContactNotification({ name, email, message }) {
  const resend = getResend();
  if (!resend) return { skipped: true, reason: 'RESEND_API_KEY not configured' };

  // Notifies the team inbox — sent to your own contact email, not the visitor.
  return resend.emails.send({
    from: FROM,
    to: 'briefgroup1@gmail.com',
    replyTo: email,
    subject: `New contact form message from ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#0A0E1A">New message from the contact page</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p style="margin-top:16px;white-space:pre-wrap">${message}</p>
      </div>
    `,
  });
}
