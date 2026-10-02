import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canRetryPayment,paymentStatusLabel} from '../lib/payment-state.ts';

const read=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('payment state exposes safe customer labels and retry states',()=>{assert.equal(paymentStatusLabel('paid','razorpay'),'Paid');assert.equal(paymentStatusLabel('cod_pending','cod'),'Cash on Delivery');assert.equal(canRetryPayment('Failed'),true);assert.equal(canRetryPayment('Paid'),false)});
test('checkout and verification stay server-side and validate captured amount',()=>{const checkout=read('supabase/functions/razorpay-checkout/index.ts'),shared=read('supabase/functions/_shared/razorpay.ts'),verify=read('supabase/functions/razorpay-verify/index.ts');assert.match(checkout,/amountPaise\(order\.total\)/);assert.match(shared,/api\.razorpay\.com\/v1/);assert.match(verify,/safeEqual/);assert.match(verify,/remotePayment\.status===['"]captured['"]/);assert.match(verify,/amount_mismatch/)});
test('webhook validates raw body, signature and delivery idempotency',()=>{const source=read('supabase/functions/razorpay-webhook/index.ts');assert.match(source,/await req\.text\(\)/);assert.match(source,/x-razorpay-signature/);assert.match(source,/x-razorpay-event-id/);assert.match(source,/payment_events/)});
test('Razorpay secrets are never public environment variables',()=>{const env=read('.env.example');assert.doesNotMatch(env,/NEXT_PUBLIC_RAZORPAY_(KEY_SECRET|WEBHOOK_SECRET)/);assert.match(env,/RAZORPAY_WEBHOOK_SECRET/)});
