export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
}

export function isGeminiConfigured() {
  return Boolean(getGeminiApiKey());
}

export async function generateGeminiText({ systemPrompt, userPrompt, imageData, mimeType }) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      ok: false,
      error: 'AI features are temporarily unavailable. Please try again later.',
    };
  }

  const parts = [];
  if (imageData && mimeType) {
    parts.push({ inline_data: { mime_type: mimeType, data: imageData } });
  }
  parts.push({ text: userPrompt || 'Please provide a useful answer.' });

  const body = {
    contents: [{ role: 'user', parts }],
  };

  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  let response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
  } catch (error) {
    console.error('[AI_PROVIDER_REQUEST_ERROR]', error?.message || error);
    return { ok: false, error: 'AI features are temporarily unavailable. Please try again later.' };
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('[AI_PROVIDER_RESPONSE_ERROR]', response.status, payload?.error?.message || 'Unknown provider error');
    return { ok: false, error: 'AI features are temporarily unavailable. Please try again later.' };
  }

  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('\n')
    .trim();

  return {
    ok: true,
    text: text || 'No response was returned.',
  };
}
