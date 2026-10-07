'use client';
import {createSupabaseBrowserClient} from '@/lib/supabase/client';
import type {CustomerProfile} from '@/lib/commerce';

export type RazorpayCheckoutSession={keyId:string;providerOrderId:string;caseclanOrderId:string;caseclanOrderNumber:string;amount:number;currency:string;timings?:{serverMs:number;providerMs:number}};
export type RazorpaySuccess={razorpay_payment_id:string;razorpay_order_id:string;razorpay_signature:string};
type RazorpayFailure={error?:{code?:string;description?:string;reason?:string;metadata?:{order_id?:string;payment_id?:string}}};
type RazorpayInstance={open:()=>void;on:(event:'payment.failed',handler:(response:RazorpayFailure)=>void)=>void};
declare global{interface Window{Razorpay?:new(options:Record<string,unknown>)=>RazorpayInstance}}

async function invoke<T>(name:string,body:Record<string,unknown>){
 const{data,error}=await createSupabaseBrowserClient().functions.invoke(name,{body});
 if(error){
  let message=error.message;
  const response=(error as {context?:Response}).context;
  if(response){
   try{const payload=await response.clone().json() as {error?:string};if(payload.error)message=payload.error}catch{}
  }
  throw new Error(message);
 }
 if(data?.error)throw new Error(data.error);return data as T
}
export const createRazorpayCheckout=(orderId:string)=>invoke<RazorpayCheckoutSession>('razorpay-checkout',{orderId,kind:'razorpay'});
export const confirmCodOrder=(orderId:string)=>invoke<{caseclanOrderId:string;caseclanOrderNumber:string;status:string;paymentStatus:string}>('razorpay-checkout',{orderId,kind:'cod'});
export const verifyRazorpayPayment=(response:RazorpaySuccess)=>invoke<{orderId:string;status:string;verifiedAt?:string}>('razorpay-verify',response);
export const recordRazorpayStatus=(providerOrderId:string,status:'failed'|'cancelled',details?:unknown)=>invoke('razorpay-status',{razorpay_order_id:providerOrderId,status,error:details});

let scriptPromise:Promise<void>|undefined;
export function preloadRazorpay(){
 if(typeof window==='undefined')return Promise.resolve();
 if(window.Razorpay)return Promise.resolve();if(scriptPromise)return scriptPromise;
 const started=performance.now();
 scriptPromise=new Promise<void>((resolve,reject)=>{
  const script=document.createElement('script');script.id='caseclan-razorpay';script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;
  const timer=setTimeout(()=>fail(),15000);
  const fail=()=>{clearTimeout(timer);script.remove();scriptPromise=undefined;reject(new Error('Secure payment could not load. Check your connection and try again.'))};
  script.onload=()=>{clearTimeout(timer);if(!window.Razorpay){fail();return}console.info('[checkout timing] script loaded ms',Math.round(performance.now()-started));resolve()};script.onerror=fail;document.head.appendChild(script);
 });return scriptPromise;
}

export async function openRazorpayCheckout(session:RazorpayCheckoutSession,customer:CustomerProfile,onFailure?:(message:string)=>void){
 await preloadRazorpay();if(!window.Razorpay)throw new Error('Razorpay Checkout is unavailable.');
 return new Promise<RazorpaySuccess>((resolve,reject)=>{let finished=false;const instance=new window.Razorpay!({key:session.keyId,amount:session.amount,currency:session.currency,name:'CASECLAN',description:`Order ${session.caseclanOrderNumber}`,order_id:session.providerOrderId,prefill:{name:customer.name,email:customer.email,contact:customer.phone},theme:{color:'#111111'},retry:{enabled:true},modal:{confirm_close:true,ondismiss:()=>{if(!finished)reject(new Error('Payment checkout was closed.'))}},handler:(response:RazorpaySuccess)=>{finished=true;resolve(response)}});instance.on('payment.failed',response=>{const message=response.error?.description||'Payment failed. Please retry.';onFailure?.(message);void recordRazorpayStatus(session.providerOrderId,'failed',response.error).catch(()=>undefined)});const opened=performance.now();instance.open();requestAnimationFrame(()=>console.info('[checkout timing] checkout open invoked ms',Math.round(performance.now()-opened)))})
}

export async function payExistingOrder(orderId:string,customer:CustomerProfile,onFailure?:(message:string)=>void){
 const started=performance.now();
 const[session]=await Promise.all([createRazorpayCheckout(orderId),preloadRazorpay()]);
 console.info('[checkout timing] payment session ms',Math.round(performance.now()-started),session.timings);
 try{const response=await openRazorpayCheckout(session,customer,onFailure);const verified=await verifyRazorpayPayment(response);
 if(verified.status!=='paid')throw new Error('Payment is awaiting capture. Your cart is saved. Check My Orders before retrying.');
 return{session,response,verified};
 }catch(error){if(error instanceof Error&&error.message==='Payment checkout was closed.')void recordRazorpayStatus(session.providerOrderId,'cancelled').catch(()=>undefined);throw error}
}
