'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv } from './env';
import type { Database } from './types';

let browserClient: SupabaseClient<Database> | undefined;

export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const { url, publishableKey } = getSupabasePublicEnv();
  browserClient = createBrowserClient<Database>(url, publishableKey);
  return browserClient;
}
