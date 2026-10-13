export const defaultAllowedOrigins = 'https://caseclan.in,https://www.caseclan.in,http://localhost:3000';

export function normalizeOrigin(value: string | null): string | null {
  if (!value || value.includes('*')) return null;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || !/^\/*$/.test(url.pathname)) return null;
    return url.origin;
  } catch { return null; }
}

export function isAllowedRequestOrigin(request: Request, configured = defaultAllowedOrigins, requireOrigin = false): boolean {
  const raw = request.headers.get('origin');
  // Non-browser callers still need a valid bearer token downstream. Browser
  // cross-site requests without an Origin never bypass this check.
  if (!raw) return !requireOrigin && request.headers.get('sec-fetch-site') !== 'cross-site';
  const origin = normalizeOrigin(raw);
  if (!origin) return false;
  const allowed = configured.split(',').map(normalizeOrigin).filter((item): item is string => item !== null);
  // Do not trust Host/X-Forwarded-Host to expand this explicit allowlist.
  return allowed.includes(origin);
}
