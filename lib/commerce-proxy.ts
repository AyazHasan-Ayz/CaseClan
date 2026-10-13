import {isAllowedRequestOrigin, normalizeOrigin} from './request-origins.ts';
export const commerceActions = ['razorpay-checkout', 'razorpay-verify', 'razorpay-status', 'admin-catalog'] as const;
export type CommerceAction = typeof commerceActions[number];

// Forward the customer's JWT, never an admin key. Each Edge Function still
// validates the user, order ownership and/or fresh admin role itself.
export async function proxyCommerce(request: Request, action: string, config: {url?: string; publishableKey?: string; allowedOrigins?: string}, transport: typeof fetch = fetch) {
  const json = (error: string, status: number) => Response.json({error}, {status, headers: {'Cache-Control': 'no-store'}});
  if (!commerceActions.includes(action as CommerceAction)) return json('Unknown commerce action.', 404);
  if (!isAllowedRequestOrigin(request, config.allowedOrigins)) return json('Invalid origin.', 403);
  const origin = normalizeOrigin(request.headers.get('origin'));
  const runtimeOrigin = new URL(request.url).origin;
  if (origin && origin !== runtimeOrigin) console.info('[commerce origin] configured origin accepted despite runtime URL mismatch', {origin, runtimeOrigin, forwardedHost: request.headers.get('x-forwarded-host')?.slice(0, 255), forwardedProto: request.headers.get('x-forwarded-proto')?.slice(0, 20)});
  const authorization = request.headers.get('authorization');
  if (!authorization || !/^Bearer \S+$/i.test(authorization)) return json('Authentication required.', 401);
  if (!config.url || !config.publishableKey) return json('Commerce service is not configured.', 503);
  if (!request.headers.get('content-type')?.includes('application/json')) return json('JSON body required.', 415);
  const limit = 2 * 1024 * 1024;
  if (Number(request.headers.get('content-length')) > limit) return json('Request too large.', 413);
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).length > limit) return json('Request too large.', 413);
    try { JSON.parse(body); } catch { return json('Invalid JSON.', 400); }
    const upstream = await transport(`${config.url.replace(/\/$/, '')}/functions/v1/${action}`, {
      method: 'POST', headers: {authorization, apikey: config.publishableKey, 'Content-Type': 'application/json'},
      body, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(45000),
    });
    const payload = await upstream.json();
    return Response.json(payload, {status: upstream.status, headers: {'Cache-Control': 'no-store'}});
  } catch { return json('Commerce service unavailable. Please retry.', 502); }
}
