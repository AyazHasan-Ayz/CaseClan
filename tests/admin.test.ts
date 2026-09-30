import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {applyAdminCatalog,defaultAdminData,normalizeAdminData,productPrice} from '../lib/admin.ts';
import {devices,products} from '../lib/catalog.ts';

test('admin data begins with the existing CASECLAN catalog and model mockup configuration',()=>{
 const data=defaultAdminData();
 assert.ok(data.products.length>=7);
 assert.ok(data.products.some(product=>product.kind==='custom'));
 assert.equal(data.devices.length,11);
 assert.ok(data.devices.every(device=>device.mockup?.assets.base.includes(device.slug)));
});

test('saved admin catalog is authoritative and updates the shared storefront source',()=>{
 const originalProducts=[...products],originalDevices=[...devices];
 try{
  const data=defaultAdminData(),kept=data.products.slice(0,2).map((product,index)=>({...product,price:1200+index,status:'active' as const}));
  const normalized=normalizeAdminData({...data,products:kept});
  assert.equal(normalized.products.length,2);
  applyAdminCatalog(normalized);
  assert.equal(products.length,2);
  assert.equal(products[0].price,1200);
 }finally{products.splice(0,products.length,...originalProducts);devices.splice(0,devices.length,...originalDevices)}
});

test('model-specific price overrides the default product price',()=>{
 const product={...defaultAdminData().products[0],price:1299,modelPrices:{'iphone-17-pro-max':1599}};
 assert.equal(productPrice(product,'iphone-17-pro-max'),1599);
 assert.equal(productPrice(product,'iphone-15'),1299);
});

test('admin routes are excluded from robots and require a Supabase staff role',()=>{
 const robots=readFileSync(join(process.cwd(),'app','robots.ts'),'utf8'),admin=readFileSync(join(process.cwd(),'components','AdminApp.tsx'),'utf8');
 assert.match(robots,/['\"]\/admin\/['\"]/);
 assert.match(admin,/isAdminRole\(auth\.customer\?\.role\)/);
 assert.match(admin,/\/admin\/login/);
 assert.doesNotMatch(admin,/caseclan-admin-session|caseclan-admin-pin|crypto\.subtle\.digest/);
 assert.doesNotMatch(admin,/defaultPassword|admin123|password\s*=/i);
});

test('customizer exposes direct purchase actions and no longer contains view switching',()=>{
 const source=readFileSync(join(process.cwd(),'components','Customizer.tsx'),'utf8'),scene=readFileSync(join(process.cwd(),'components','CaseScene.tsx'),'utf8');
 assert.match(source,/ADD TO CART/);
 assert.match(source,/BUY NOW/);
 assert.doesNotMatch(source,/Product View|Preview Final Case|view-controls|view="Front"/);
 assert.doesNotMatch(scene,/const VIEW|props\.view|Angle:|Left:|Right:/);
});
