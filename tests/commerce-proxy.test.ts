import test from 'node:test';
import assert from 'node:assert/strict';
import {proxyCommerce} from '../lib/commerce-proxy.ts';
const config={url:'https://example.supabase.co',publishableKey:'public-test-key'};
const request=(headers:Record<string,string>={},body='{}')=>new Request('https://caseclan.in/api/commerce/razorpay-checkout/',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer customer-jwt',...headers},body});

test('commerce proxy rejects guests, cross-site requests and arbitrary actions before forwarding',async()=>{
 const never:typeof fetch=async()=>{throw new Error('Must not forward')};
 assert.equal((await proxyCommerce(request({authorization:''}),'razorpay-checkout',config,never)).status,401);
 assert.equal((await proxyCommerce(request({origin:'https://other.example'}),'razorpay-checkout',config,never)).status,403);
 assert.equal((await proxyCommerce(request(),'../razorpay-webhook',config,never)).status,404);
 assert.equal((await proxyCommerce(request(),'razorpay-checkout',{},never)).status,503);
 assert.equal((await proxyCommerce(request({},'{'),'razorpay-checkout',config,never)).status,400);
 assert.equal((await proxyCommerce(request({'content-length':'2097153'}),'razorpay-checkout',config,never)).status,413);
});
test('relative proxy preserves customer JWT, payload and upstream authorization rejection',async()=>{
 const transport:typeof fetch=async(url,options)=>{
  assert.equal(url,'https://example.supabase.co/functions/v1/admin-catalog');
  assert.equal(new Headers(options?.headers).get('authorization'),'Bearer customer-jwt');
  assert.equal(new Headers(options?.headers).get('apikey'),'public-test-key');
  assert.equal(options?.body,JSON.stringify({data:{products:[]}}));
  return Response.json({error:'Admin access required'},{status:403});
 };
 const result=await proxyCommerce(request({},JSON.stringify({data:{products:[]}})),'admin-catalog',config,transport);
 assert.equal(result.status,403);assert.equal(result.headers.get('cache-control'),'no-store');
 assert.deepEqual(await result.json(),{error:'Admin access required'});
});
test('payment success and upstream outages are passed safely without leaking secrets',async()=>{
 const ok=await proxyCommerce(request(),'razorpay-verify',config,async()=>Response.json({status:'paid'}));
 assert.deepEqual(await ok.json(),{status:'paid'});
 const failed=await proxyCommerce(request(),'razorpay-verify',config,async()=>{throw Error('private provider details')});
 assert.equal(failed.status,502);assert.doesNotMatch(await failed.text(),/private provider details/);
});
