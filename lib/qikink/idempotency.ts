export type SubmissionState = 'pending' | 'succeeded';
export interface QikinkSubmissionStore<T> { claim(key: string): Promise<boolean>; succeed(key: string, response: T): Promise<void>; release(key: string): Promise<void>; get(key: string): Promise<{ state: SubmissionState; response?: T } | undefined> }

/** Useful for a single worker/test process. Production callers should use a durable DB-backed store. */
export class MemoryQikinkSubmissionStore<T> implements QikinkSubmissionStore<T> {
  private readonly records = new Map<string, { state: SubmissionState; response?: T }>();
  async claim(key: string) { if (this.records.has(key)) return false; this.records.set(key, { state: 'pending' }); return true; }
  async succeed(key: string, response: T) { this.records.set(key, { state: 'succeeded', response }); }
  async release(key: string) { this.records.delete(key); }
  async get(key: string) { return this.records.get(key); }
}

export async function withQikinkIdempotency<T>(key: string, store: QikinkSubmissionStore<T>, submit: () => Promise<T>) {
  const existing = await store.get(key);
  if (existing?.state === 'succeeded') return { duplicate: true, response: existing.response! };
  if (!(await store.claim(key))) throw new Error('Qikink order submission is already in progress.');
  try {
    const response = await submit();
    await store.succeed(key, response);
    return { duplicate: false, response };
  } catch (error) {
    await store.release(key);
    throw error;
  }
}
