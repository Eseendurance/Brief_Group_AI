export function getSiteBaseUrl(request) {
  const configuredUrl = process.env.SITE_BASE
    || (process.env.NODE_ENV === 'production' ? null : new URL(request.url).origin);
  if (!configuredUrl) {
    throw new Error('SITE_BASE must be configured with the canonical production origin.');
  }
  const parsedUrl = new URL(configuredUrl);
  if (!['https:', 'http:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
    throw new Error('SITE_BASE must be a valid HTTP or HTTPS origin.');
  }
  if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
    throw new Error('SITE_BASE must use HTTPS in production.');
  }
  return parsedUrl.origin;
}
