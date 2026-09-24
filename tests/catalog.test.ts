import test from 'node:test';
import assert from 'node:assert/strict';
import {products,productImage} from '../lib/catalog.ts';

test('all storefront designs are fixed ready products',()=>{const ready=products.filter(product=>product.id!=='custom-design');assert.ok(ready.length>0);assert.ok(ready.every(product=>product.kind==='ready'))});
test('the custom editor uses one separate custom product',()=>{assert.deepEqual(products.filter(product=>product.kind==='custom').map(product=>product.id),['custom-design'])});
test('phone compatibility never changes fixed artwork',()=>{const product=products[0];assert.equal(productImage(product,'iphone-17'),productImage(product,'iphone-16-pro-max'))});
