import 'server-only';
import type { QikinkApiResponse, QikinkOrderPayload } from './types';
import type { QikinkSubmissionStore } from './idempotency';
import { withQikinkIdempotency } from './idempotency';

type Fetcher = typeof fetch;
export class QikinkApiError extends Error { constructor(public readonly status: number, public readonly body: unknown) { super(`Qikink API request failed with HTTP ${status}.`); this.name = 'QikinkApiError'; } }

export function getQikinkSandboxEnv() {
  const environment = process.env.QIKINK_ENVIRONMENT, baseUrl = process.env.QIKINK_SANDBOX_BASE_URL, clientId = process.env.QIKINK_SANDBOX_CLIENT_ID, clientSecret = process.env.QIKINK_SANDBOX_CLIENT_SECRET;
  if (environment !== 'sandbox') throw new Error('Qikink integration is locked to sandbox.');
  if (baseUrl !== 'https://sandbox.qikink.com') throw new Error('Qikink sandbox base URL is invalid.');
  if (!clientId || !clientSecret) throw new Error('Qikink sandbox credentials are missing.');
  return { baseUrl, clientId, clientSecret };
}

export class QikinkSandboxClient {
  private token?: { value: string; expiresAt: number };
  constructor(private readonly fetcher: Fetcher = fetch) {}
  private async accessToken() {
    if (this.token && Date.now() < this.token.expiresAt - 30_000) return this.token.value;
    const env = getQikinkSandboxEnv();
    const response = await this.fetcher(`${env.baseUrl}/api/token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ ClientId: env.clientId, client_secret: env.clientSecret }), cache: 'no-store' });
    const body = await response.json() as { Accesstoken?: string; expires_in?: number };
    if (!response.ok || !body.Accesstoken) throw new QikinkApiError(response.status, body);
    this.token = { value: body.Accesstoken, expiresAt: Date.now() + Number(body.expires_in || 3600) * 1000 };
    return this.token.value;
  }
  private async request(path: string, init: RequestInit = {}) {
    const env = getQikinkSandboxEnv();
    const response = await this.fetcher(`${env.baseUrl}${path}`, { ...init, headers: { ClientId: env.clientId, Accesstoken: await this.accessToken(), ...init.headers }, cache: 'no-store' });
    const text = await response.text(); let body: unknown; try { body = JSON.parse(text); } catch { body = { message: text.slice(0, 500) }; }
    if (!response.ok) throw new QikinkApiError(response.status, body);
    return body as QikinkApiResponse;
  }
  async createOrder(payload: QikinkOrderPayload, store: QikinkSubmissionStore<QikinkApiResponse>) {
    if (process.env.QIKINK_AUTOMATIC_FULFILMENT !== 'true') throw new Error('Automatic Qikink fulfilment is disabled. Use the manual fulfilment workflow.');
    return withQikinkIdempotency(`qikink:sandbox:${payload.order_number}`, store, () =>
      this.request('/api/order/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }));
  }
  getOrderStatus(id: string | number) { return this.request(`/api/order?id=${encodeURIComponent(String(id))}`); }
}
