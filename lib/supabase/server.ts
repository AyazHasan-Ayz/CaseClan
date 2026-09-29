import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv } from './env';
import type { Database } from './types';

let adminClient: SupabaseClient<Database> | undefined;

/** Server-only client. This key bypasses RLS and must never be imported by client components. */
export function createSupabaseAdminClient() {
  if (adminClient) return adminClient;
  const { url } = getSupabasePublicEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error('Missing required environment variable: SUPABASE_SECRET_KEY');

  adminClient = createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return adminClient;
}
