import test from 'node:test';
import assert from 'node:assert/strict';
import sitemap from '../app/sitemap.ts';
import robots from '../app/robots.ts';
import {devices,products} from '../lib/catalog.ts';
import {productSchema} from '../lib/seo/schemas.ts';

test('XML sitemap includes dynamic products and model pages but excludes transactional routes',()=>{
  const urls=sitemap().map(entry=>entry.url);
  for(const product of products.filter(item=>item.kind==='ready'))assert.ok(urls.some(url=>url.endsWith(`/product/${product.id}/`)));
  for(const device of devices)assert.ok(urls.some(url=>url.endsWith(`/${device.slug}-cases/`)));
  for(const route of ['/cart/','/checkout/','/account/','/login/','/wishlist/','/search/','/track-order/'])assert.ok(!urls.some(url=>url.endsWith(route)));
});

test('robots blocks private commerce paths and references the production sitemap',()=>{
  const data=robots();
  const rules=Array.isArray(data.rules)?data.rules[0]:data.rules;
  assert.ok(rules&&Array.isArray(rules.disallow));
  assert.ok((rules?.disallow as string[]).includes('/checkout/'));
  assert.match(String(data.sitemap),/\/sitemap\.xml$/);
});

test('product schema uses catalog facts and never invents ratings',()=>{
  const product=products.find(item=>item.kind==='ready')!;
  const schema=productSchema(product) as Record<string,unknown>;
  assert.equal(schema.name,`CASECLAN ${product.name}`);
  assert.equal(schema.sku,product.id);
  assert.ok(schema.offers);
  assert.equal('aggregateRating' in schema,false);
});
