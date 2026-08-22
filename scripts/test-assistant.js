(async () => {
  try {
    // Dynamic import to load ES module helpers from the project
    const { getAdminAuth, getAdminDb } = await import('../lib/firebaseAdmin.js');

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    if (!adminAuth || !adminDb) {
      console.error('Firebase Admin SDK not configured in this environment. Aborting.');
      process.exit(1);
    }

    // Create or reuse a test user
    const testEmail = `test+ci-${Date.now()}@example.com`;
    const testPassword = 'Test1234!';
    let userRecord = null;

    try {
      userRecord = await adminAuth.createUser({ email: testEmail, password: testPassword, displayName: 'CI Test User' });
      console.log('created-user-uid:' + userRecord.uid);
    } catch (err) {
      // If email already exists, try to lookup by email
      if (err.code === 'auth/email-already-exists' || (err.message && err.message.includes('email'))) {
        try {
          userRecord = await adminAuth.getUserByEmail(testEmail);
          console.log('reused-existing-user-uid:' + userRecord.uid);
        } catch (gErr) {
          console.error('Failed to create or fetch test user:', gErr.message || gErr);
          process.exit(1);
        }
      } else {
        console.error('createUser failed:', err.message || err);
        process.exit(1);
      }
    }

    const uid = userRecord.uid;

    // Insert small sample documents for faults and inspections
    const now = new Date();
    try {
      await adminDb.collection('fault_readings').add({ uid, createdAt: now, severity: 'low', message: 'Automated test fault reading', value: 42 });
      await adminDb.collection('inspections').add({ uid, createdAt: now, assetLabel: 'Test Asset', imageUrl: '', analysis: { status: 'ok' } });
      console.log('Inserted sample documents for fault_readings and inspections (no sensitive data printed).');
    } catch (err) {
      console.error('Failed to insert sample documents:', err.message || err);
      process.exit(1);
    }

    // Create a custom token for the test user (safe to log the UID but not the token)
    let customToken;
    try {
      customToken = await adminAuth.createCustomToken(uid);
      console.log('custom-token-created-for-uid');
    } catch (err) {
      console.error('Failed to create custom token:', err.message || err);
      process.exit(1);
    }

    // If a client API key is available, exchange the custom token for an ID token and attempt a chat call
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      console.log('NEXT_PUBLIC_FIREBASE_API_KEY is not set in this environment — skipping automated sign-in and /api/chat call.');
      console.log('Finished: created test user and sample data.');
      process.exit(0);
    }

    // Exchange custom token for an ID token via Firebase REST API
    try {
      const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
      });
      const body = await resp.json();
      if (!body.idToken) {
        console.error('Failed to exchange custom token for idToken. Response:', JSON.stringify(body).slice(0, 400));
        process.exit(1);
      }

      // Use the idToken to call the deployed chat endpoint if VERCEL_URL is set, otherwise try localhost
      const idToken = body.idToken;
      const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
      const chatResp = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'What is the current energy trend for my site?' }], context: { energySummary: { totalKwh: 123.4, anomalyCount: 1, trend: 'rising' } } }),
      });

      const chatBody = await chatResp.json();
      // Only log a short result summary — do not print any tokens or sensitive data
      if (chatBody.reply) {
        console.log('Received assistant reply (truncated):', String(chatBody.reply).slice(0, 300));
      } else if (chatBody.error) {
        console.log('Assistant /api/chat returned error:', chatBody.error);
      } else {
        console.log('Unexpected /api/chat response:', JSON.stringify(chatBody).slice(0, 400));
      }

      // Send two lightweight tracking events to /api/track to validate analytics
      try {
        await fetch(`${base}/api/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'hero_exposed', variant: 'A', ts: Date.now() }) });
        await fetch(`${base}/api/track`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'cta_click', variant: 'A', ts: Date.now() }) });
        console.log('Posted two /api/track events to the site (server logs should show them).');
      } catch (tErr) {
        console.error('Failed to post /api/track events:', tErr.message || tErr);
      }

      console.log('Finished: created test user, wrote sample data, exchanged token, and exercised /api/chat and /api/track (if reachable).');
      // Do not print tokens, keys, or private data.
      process.exit(0);
    } catch (err) {
      console.error('Sign-in / chat attempt failed:', err.message || err);
      process.exit(1);
    }
  } catch (err) {
    console.error('Script unexpected error:', err.message || err);
    process.exit(1);
  }
})();
