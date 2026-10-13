import test from 'node:test';
import assert from 'node:assert/strict';
import {proxyCommerce} from '../lib/commerce-proxy.ts';
import {isAllowedRequestOrigin,normalizeOrigin} from '../lib/request-origins.ts';
const config={url:'https://example.supabase.co',publishableKey:'public-test-key'};
const request=(headers:Record<string,string>={},body='{}')=>new Request('https://caseclan.in/api/commerce/razorpay-checkout/',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer customer-jwt',...headers},body});

test('configured browser origins survive Netlify internal URL changes without trusting forwarded hosts',async()=>{
 for(const origin of ['https://caseclan.in','https://www.caseclan.in']){
  const req=new Request('http://internal.netlify.local/api/commerce/razorpay-checkout/',{method:'POST',headers:{origin,'content-type':'application/json',authorization:'Bearer customer-jwt','x-forwarded-host':'evil.example','x-forwarded-proto':'http'},body:'{}'});
  const result=await proxyCommerce(req,'razorpay-checkout',config,async()=>Response.json({providerOrderId:'test-order'}));
  assert.equal(result.status,200);
 }
 assert.equal(isAllowedRequestOrigin(request({origin:'https://evil.example','x-forwarded-host':'evil.example'})),false);
});
test('origin parsing trims entries and slashes but rejects wildcards, null and non-origin URLs',()=>{
 assert.equal(isAllowedRequestOrigin(request({origin:' https://caseclan.in/ '}),' https://caseclan.in/ , https://www.caseclan.in/ '),true);
 assert.equal(isAllowedRequestOrigin(request({origin:'http://localhost:3000'})),true);
 assert.equal(isAllowedRequestOrigin(request({origin:'https://caseclan.vercel.app'}),'https://caseclan.vercel.app, https://caseclan.in'),true);
 for(const value of ['null','https://caseclan.in.evil.example','https://caseclan.in/path','https://user@caseclan.in','https://caseclan.in?query=1','https://*.caseclan.in'])assert.equal(isAllowedRequestOrigin(request({origin:value})),false,value);
 assert.equal(isAllowedRequestOrigin(request({origin:'https://caseclan.in'}),'*'),false);
 assert.equal(isAllowedRequestOrigin(request({'sec-fetch-site':'cross-site'})),false);
 assert.equal(isAllowedRequestOrigin(request(),undefined,true),false);
 assert.equal(normalizeOrigin('https://CASECLAN.IN:443/'),'https://caseclan.in');
});

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
