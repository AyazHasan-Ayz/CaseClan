import {createClient, type SupabaseClient} from 'npm:@supabase/supabase-js@2.117.2';

export type JsonRecord=Record<string,unknown>;
const encoder=new TextEncoder();

export function cors(req:Request){
  const origin=req.headers.get('origin')||'';
  const configured=(Deno.env.get('CASECLAN_ALLOWED_ORIGINS')||'https://caseclan.vercel.app,http://localhost:3000').split(',').map(v=>v.trim());
  const allowed=configured.includes(origin)?origin:configured[0];
  return {'Access-Control-Allow-Origin':allowed,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
}
export function json(req:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors(req),'content-type':'application/json','cache-control':'no-store'}})}

function keyedEnv(name:'SUPABASE_PUBLISHABLE_KEYS'|'SUPABASE_SECRET_KEYS'){
  const value=Deno.env.get(name);if(!value)return '';
  try{const parsed=JSON.parse(value);return String(parsed.default||Object.values(parsed)[0]||'')}catch{return ''}
}
export function adminClient(){
  const url=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_SECRET_KEY')||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||keyedEnv('SUPABASE_SECRET_KEYS');
  if(!url||!key)throw new Error('Supabase server credentials are unavailable.');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function authenticatedUser(req:Request){
  const authorization=req.headers.get('authorization')||'',token=authorization.replace(/^Bearer\s+/i,'');
  if(!token)throw new Error('Authentication required.');
  const url=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||Deno.env.get('SUPABASE_ANON_KEY')||keyedEnv('SUPABASE_PUBLISHABLE_KEYS');
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),{data,error}=await client.auth.getUser(token);
  if(error||!data.user)throw new Error('Authentication required.');
  return data.user;
}

export function razorpayEnv(){
  const mode=(Deno.env.get('RAZORPAY_MODE')||'test').toLowerCase();
  if(mode!=='test'&&mode!=='live')throw new Error('RAZORPAY_MODE must be test or live.');
  // Keep the documented uppercase variable canonical. The final fallback supports
  // the mixed-case name already present in the linked project so checkout does
  // not fail while the dashboard secret is corrected.
  const keyId=Deno.env.get(mode==='live'?'RAZORPAY_LIVE_KEY_ID':'RAZORPAY_TEST_KEY_ID')||Deno.env.get('RAZORPAY_KEY_ID')||Deno.env.get('Razorpay_Key_ID');
  const keySecret=Deno.env.get(mode==='live'?'RAZORPAY_LIVE_KEY_SECRET':'RAZORPAY_TEST_KEY_SECRET')||Deno.env.get('RAZORPAY_KEY_SECRET');
  if(!keyId||!keySecret)throw new Error(`Razorpay ${mode} credentials are not configured.`);
  return{mode,keyId,keySecret};
}
export async function razorpay(path:string,init:RequestInit={}){
  const{keyId,keySecret}=razorpayEnv(),authorization='Basic '+btoa(`${keyId}:${keySecret}`);
  const response=await fetch(`https://api.razorpay.com/v1${path}`,{...init,headers:{authorization,'content-type':'application/json',...init.headers}});
  const text=await response.text();let body:unknown;try{body=JSON.parse(text)}catch{body={error:{description:text.slice(0,500)}}}
  if(!response.ok)throw new Error(`Razorpay HTTP ${response.status}: ${JSON.stringify(body)}`);
  return body as JsonRecord;
}
export async function hmacHex(secret:string,message:string){
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(message)));
  return[...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export function safeEqual(a:string,b:string){if(a.length!==b.length)return false;let value=0;for(let i=0;i<a.length;i++)value|=a.charCodeAt(i)^b.charCodeAt(i);return value===0}
export function amountPaise(value:unknown){const amount=Math.round(Number(value)*100);if(!Number.isSafeInteger(amount)||amount<0)throw new Error('Invalid CASECLAN order amount.');return amount}
export async function ownedOrder(admin:SupabaseClient,userId:string,orderId:string){
  const{data,error}=await admin.from('orders').select('*').eq('id',orderId).eq('customer_id',userId).single();if(error||!data)throw new Error('Order not found.');return data;
}
export async function paymentForProviderOrder(admin:SupabaseClient,providerOrderId:string){
  const{data,error}=await admin.from('payments').select('*').eq('provider_order_id',providerOrderId).single();if(error||!data)throw new Error('Payment attempt not found.');return data;
}
export function providerEntity(payload:JsonRecord,key:'payment'|'order'|'refund'){const wrapper=(payload.payload as JsonRecord|undefined)?.[key] as JsonRecord|undefined;return(wrapper?.entity||{}) as JsonRecord}
