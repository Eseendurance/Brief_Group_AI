(async () => {
  try {
    const fbKey = process.env.FB_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const siteBase = process.env.SITE_BASE || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.SITE_BASE;

    if (!fbKey) {
      console.error('FB API key not found in environment (FB_API_KEY or NEXT_PUBLIC_FIREBASE_API_KEY). Aborting.');
      process.exit(1);
    }
    if (!process.env.SITE_BASE) {
      console.error('SITE_BASE not set in environment. Set SITE_BASE=https://briefgroup.net and retry.');
      process.exit(1);
    }

    const base = process.env.SITE_BASE.replace(/\/$/, '');
    const timestamp = Math.floor(Date.now() / 1000);
    const testEmail = `test+ci${timestamp}@example.com`;
    const testPassword = 'Test1234!';

    console.log('Signing up test user (will not print tokens)...');

    // Sign up
    const signupResp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${fbKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword, returnSecureToken: true }),
    });
    let signupBody = await signupResp.json();

    if (!signupResp.ok) {
      // Try signInWithPassword
      console.log('Sign-up failed (maybe account exists). Trying signInWithPassword...');
      const signinResp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${fbKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword, returnSecureToken: true }),
      });
      signupBody = await signinResp.json();
      if (!signinResp.ok) {
        console.error('Failed to sign up or sign in test user:', JSON.stringify(signupBody).slice(0, 500));
        process.exit(1);
      }
    }

    const idToken = signupBody.idToken;
    const localId = signupBody.localId;
    console.log('localId:', localId);

    // Call /api/chat
    try {
      const chatResp = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'What is the current energy trend for my site?' }], context: { energySummary: { totalKwh: 123.4, anomalyCount: 1, trend: 'rising' } } }),
      });
      const chatBody = await chatResp.json();
      if (chatBody.reply) {
        console.log('Assistant reply (truncated):', String(chatBody.reply).slice(0, 300));
      } else if (chatBody.error) {
        console.log('Assistant returned error:', chatBody.error);
      } else {
        console.log('Unexpected /api/chat response:', JSON.stringify(chatBody).slice(0, 500));
      }
    } catch (err) {
      console.error('Failed to call /api/chat:', err.message || err);
    }

    // Post tracking events
    try {
      await fetch(`${base}/api/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'hero_exposed', variant: 'A', ts: Date.now() }) });
      await fetch(`${base}/api/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'cta_click', variant: 'A', ts: Date.now() }) });
      console.log('Posted two /api/track events to the site (server logs should show them).');
    } catch (err) {
      console.error('Failed to post /api/track events:', err.message || err);
    }

    console.log('Finished.');
    process.exit(0);
  } catch (err) {
    console.error('Script unexpected error:', err.message || err);
    process.exit(1);
  }
})();
