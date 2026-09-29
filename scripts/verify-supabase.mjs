import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

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
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(url && key, 'Supabase public environment variables are required.');

async function rest(pathname) {
  const response = await fetch(`${url}/rest/v1/${pathname}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: response.status, body };
}

const products = await rest('products?select=slug,name,status&order=slug');
assert.equal(products.status, 200, 'Public products read must succeed.');
assert.ok(Array.isArray(products.body) && products.body.length >= 7, 'Expected the bootstrapped remote products.');
assert.ok(products.body.every(row => row.status === 'active'), 'Public products must expose active rows only.');

const models = await rest('phone_models?select=slug,name,status&order=display_order');
assert.equal(models.status, 200, 'Public phone model read must succeed.');
assert.ok(Array.isArray(models.body) && models.body.length >= 11, 'Expected the bootstrapped remote phone models.');

const publicSetting = await rest('store_settings?select=key,value&key=eq.catalog_source');
assert.equal(publicSetting.status, 200);
assert.equal(publicSetting.body?.[0]?.value?.provider, 'supabase');

const privateSetting = await rest('store_settings?select=key&key=eq.supabase_connectivity_check');
assert.equal(privateSetting.status, 200);
assert.deepEqual(privateSetting.body, [], 'Private settings must be filtered by RLS.');

const privateOrders = await rest('orders?select=id&limit=1');
assert.ok([401, 403].includes(privateOrders.status), `Anonymous orders read should be denied, received ${privateOrders.status}.`);

console.log(`Remote public products: ${products.body.length}`);
console.log(`Remote public phone models: ${models.body.length}`);
console.log('Public catalog reads: passed');
console.log('Private row filtering: passed');
console.log(`Anonymous orders read: blocked (HTTP ${privateOrders.status})`);
