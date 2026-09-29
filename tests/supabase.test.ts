import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Supabase packages are exactly pinned', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies['@supabase/supabase-js'], '2.117.2');
  assert.equal(pkg.dependencies['@supabase/ssr'], '0.12.7');
  assert.equal(pkg.dependencies['server-only'], '0.0.1');
});

test('secret-key client is isolated from the browser module', () => {
  const browser = read('lib/supabase/client.ts');
  const server = read('lib/supabase/server.ts');
  const index = read('lib/supabase/index.ts');
  assert.match(browser, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY|getSupabasePublicEnv/);
  assert.doesNotMatch(browser, /SUPABASE_SECRET_KEY/);
  assert.match(server, /import 'server-only'/);
  assert.match(server, /SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(index, /server|AdminClient|SECRET/);
});

test('commerce migration is non-destructive and protects every table with RLS', () => {
  const migration = read('supabase/migrations/20260929000100_caseclan_commerce.sql');
  const tables = ['products','product_images','phone_models','product_phone_models','customers','addresses','orders','order_items','customizations','coupons','reviews','store_settings'];
  for (const table of tables) {
    assert.match(migration, new RegExp(`create table public\\.${table}\\b`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  for (const bucket of ['product-images','phone-mockups','customer-uploads','custom-previews','print-ready']) assert.match(migration, new RegExp(bucket));
  assert.doesNotMatch(migration, /\b(drop|truncate)\s+(table|schema)\b/i);
  assert.match(migration, /No client write policies exist for public catalog assets or print-ready files/);
});

test('storefront reads Supabase first and retains the existing catalog as a safe fallback', () => {
  const provider = read('components/StoreProvider.tsx');
  const catalog = read('lib/supabase/catalog.ts');
  assert.match(provider, /from '@\/lib\/catalog'/);
  assert.match(provider, /fetchRemoteCatalog/);
  assert.match(catalog, /createSupabaseBrowserClient/);
  assert.match(catalog, /from\('products'\)/);
  assert.match(catalog, /if \(!productsResult\.data\?\.length \|\| !modelsResult\.data\?\.length\) return null/);
  const seed = read('supabase/migrations/20260929000200_seed_caseclan_catalog.sql');
  assert.match(seed, /on conflict \(slug\) do nothing/);
  assert.doesNotMatch(seed, /\b(delete|truncate|drop)\b/i);
});
