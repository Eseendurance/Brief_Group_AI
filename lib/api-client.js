// Server APIs authenticate with the HttpOnly Firebase session cookie. The
// Firebase SDK ID token is exchanged for that cookie during sign-in and is
// never copied into application-managed storage or request headers.
export async function authedFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const response = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}
