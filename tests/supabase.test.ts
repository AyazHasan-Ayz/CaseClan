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
  const catalog = read('lib/supabase/catalog-runtime.ts');
  assert.match(provider, /from '@\/lib\/catalog'/);
  assert.match(provider, /fetchRemoteCatalog/);
  assert.match(provider, /catalogSource='supabase'/);
  assert.match(catalog, /createSupabaseBrowserClient/);
  assert.match(catalog, /from\('products'\)/);
  assert.match(catalog, /from\('product_images'\)/);
  assert.match(catalog, /product_phone_models/);
  const seed = read('supabase/migrations/20260929000200_seed_caseclan_catalog.sql');
  assert.match(seed, /on conflict \(slug\) do nothing/);
  assert.doesNotMatch(seed, /\b(delete|truncate|drop)\b/i);
});

test('catalog writes are server-authorized and storefront sections use the remote snapshot', () => {
  const edge = read('supabase/functions/admin-catalog/index.ts');
  const client = read('lib/supabase/admin-catalog.ts');
  const home = read('components/Home.tsx');
  const shop = read('components/Shop.tsx');
  const search = read('components/Shell.tsx');
  assert.match(edge, /authenticatedUser\(req\)/);
  assert.match(edge, /customers.*select\('role'\)/s);
  assert.match(edge, /staffRoles/);
  assert.match(edge, /adminClient\(\)/);
  assert.doesNotMatch(client, /SUPABASE_SECRET_KEY|service_role/);
  assert.match(client, /functions\.invoke\('admin-catalog'/);
  for (const source of [home, shop, search]) assert.match(source, /adminData/);
});

test('admin media is persistent and catalog removal is non-destructive', () => {
  const admin = read('components/AdminApp.tsx');
  const edge = read('supabase/functions/admin-catalog/index.ts');
  assert.match(admin, /uploadAdminCatalogImage/);
  assert.doesNotMatch(admin, /readAsDataURL/);
  assert.match(admin, /Archive/);
  assert.doesNotMatch(admin, /products:data\.products\.filter/);
  assert.match(edge, /media_library/);
  assert.doesNotMatch(edge, /from\('products'\)\.delete/);
});

test('checkout validates settings, prices and coupons inside Postgres', () => {
  const migration = read('supabase/migrations/20261006090000_checkout_settings_coupons.sql');
  const checkout = read('lib/supabase/account.ts');
  assert.match(migration, /security definer/);
  assert.match(migration, /status = 'active'/);
  assert.match(migration, /price_override/);
  assert.match(migration, /coupon_row/);
  assert.match(migration, /usage_count = usage_count \+ 1/);
  assert.match(migration, /store_settings/);
  assert.match(checkout, /coupon_code/);
});

test('manual fulfilment migration is staff-only and stores private custom production assets', () => {
  const migration = read('supabase/migrations/20261002000100_manual_fulfilment.sql');
  assert.match(migration, /grant update \(status, tracking_id, courier, admin_note, metadata\) on public\.orders to authenticated/);
  assert.match(migration, /create policy orders_admin_update_fulfilment/);
  assert.match(migration, /private\.current_user_role\(\).*'owner', 'admin', 'staff'/s);
  for (const operation of ['select', 'insert', 'update']) {
    assert.match(migration, new RegExp(`print_ready_.+ on storage\\.objects for ${operation}`, 's'));
  }
  assert.match(migration, /split_part\(print_value, '\/', 1\) <> account_id::text/);
  assert.match(migration, /customer_upload_paths, preview_path, print_ready_path/);
  assert.match(migration, /'fulfilment_provider', 'Qikink'/);
});

test('authenticated RLS policies can resolve the current database role', () => {
  const migration = read('supabase/migrations/20261005093454_grant_current_user_role_execute.sql');
  assert.match(migration, /grant usage on schema private to authenticated/);
  assert.match(migration, /grant execute on function private\.current_user_role\(\) to authenticated/);
  assert.match(migration, /revoke execute on function private\.current_user_role\(\) from public, anon/);
});

test('admin and customer surfaces expose the manual fulfilment workflow', () => {
  const admin = read('components/AdminApp.tsx');
  const tracking = read('components/OrderTrackingSummary.tsx');
  const remote = read('lib/supabase/admin-orders.ts');
  assert.match(admin, /SAVE FULFILMENT DETAILS/);
  assert.match(admin, /Qikink Order ID/);
  assert.match(admin, /DOWNLOAD PRINT FILE/);
  assert.match(remote, /from\('orders'\).*\.update/s);
  assert.match(remote, /createSupabaseBrowserClient/);
  assert.doesNotMatch(remote, /SUPABASE_SECRET_KEY|createSupabaseAdminClient/);
  assert.match(tracking, /AWB \/ Tracking ID/);
  assert.match(tracking, /TRACK SHIPMENT/);
});
