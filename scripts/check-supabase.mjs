import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvFile(filename) {
  if (!fs.existsSync(filename)) return;
  for (const line of fs.readFileSync(filename, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadEnvFile(path.resolve('.env.local'));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

async function main() {
  if (!url || !publishableKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
    process.exitCode = 1;
    return;
  }

  const response = await fetch(`${url}/rest/v1/products?select=id&limit=0`, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` },
  });

  if (response.status === 401 || response.status === 403 || response.status >= 500) {
    console.error(`Supabase public connection failed with HTTP ${response.status}.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Supabase public endpoint reachable (HTTP ${response.status}).`);
  if (response.status === 404) console.log('Commerce schema is not applied yet, as expected.');

  if (!secretKey) {
    console.error('SUPABASE_SECRET_KEY is missing; secure admin connectivity was not verified.');
    process.exitCode = 2;
    return;
  }

  const admin = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) {
    console.error(`Supabase admin connection failed: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  console.log('Supabase admin connection verified.');
}

await main();
