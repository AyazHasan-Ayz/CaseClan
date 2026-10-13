import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCoupon} from '../supabase/functions/_shared/coupons.ts';
import {isConfirmedOrder} from '../lib/payment-state.ts';
test('coupon codes normalize and retain optional rules',()=>{const c=parseCoupon({code:' case10 ',kind:'percentage',value:10,minimum:499,maximum:200,usageLimit:20,perUserLimit:1});assert.equal(c.code,'CASE10');assert.equal(c.maximum,200);assert.equal(c.perUserLimit,1);assert.equal(c.active,true)});
test('invalid coupon controls cannot reach database saves',()=>{for(const patch of [{value:101},{value:-1},{maximum:-1},{usageLimit:0},{perUserLimit:1.5},{code:'bad code'},{startsAt:'invalid'},{startsAt:'2026-10-14',endsAt:'2026-10-13'}])assert.throws(()=>parseCoupon({code:'CASE10',kind:'percentage',value:10,...patch}));assert.equal(parseCoupon({code:'FIXED',kind:'fixed',value:999,usageLimit:''}).usageLimit,undefined)});
test('confirmed COD remains visible when fulfilment is reset to Pending',()=>{assert.equal(isConfirmedOrder({payment_method:'cod',payment_status:'cod_pending',status:'Pending',metadata:{confirmed_at:'2026-10-13'}}),true);assert.equal(isConfirmedOrder({payment_method:'cod',payment_status:'cod_pending',status:'Pending'}),false)});
