import test from 'node:test';
import assert from 'node:assert/strict';
import {priceDisplay,toPaise} from '../lib/pricing.ts';
import {isConfirmedOrder} from '../lib/payment-state.ts';
test('selling price remains payable and compare-at is presentation only',()=>{
 assert.deepEqual(priceDisplay({price:599,compareAtPrice:999}),{selling:599,compare:999});
 for(const compareAtPrice of [undefined,0,599,499])assert.equal(priceDisplay({price:599,compareAtPrice}).compare,null);
 assert.equal(toPaise(599),59900);assert.equal(toPaise(698),69800);
 assert.deepEqual(priceDisplay({price:599,compareAtPrice:999,modelPrices:{pro:699}},'pro',2),{selling:1398,compare:1998});
});
test('unpaid initialization, cancellation and failure never become normal orders',()=>{
 for(const payment_status of ['not_processed','pending','failed','cancelled','amount_mismatch'])
  for(const status of ['new','Pending','Confirmed','Payment Pending'])assert.equal(isConfirmedOrder({payment_status,status,payment_method:'razorpay'}),false);
 assert.equal(isConfirmedOrder({payment_status:'paid',status:'Confirmed'}),true);
 assert.equal(isConfirmedOrder({paymentStatus:'Refunded',status:'Refunded'}),true);
 assert.equal(isConfirmedOrder({payment_method:'cod',payment_status:'cod_pending',status:'Confirmed'}),true);
 assert.equal(isConfirmedOrder({payment_method:'cod',payment_status:'cod_pending',status:'new'}),false);
 assert.equal(isConfirmedOrder({paymentMethod:'Cash on Delivery',paymentStatus:'Cash on Delivery',status:'Confirmed'}),true);
 assert.equal(isConfirmedOrder({paymentMethod:'Online Payment',paymentStatus:'Cash on Delivery',status:'Confirmed'}),false);
});
