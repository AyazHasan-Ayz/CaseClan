'use client';
import {createSupabaseBrowserClient} from '@/lib/supabase/client';
import type {CustomerProfile} from '@/lib/commerce';

export type RazorpayCheckoutSession={keyId:string;providerOrderId:string;caseclanOrderId:string;caseclanOrderNumber:string;amount:number;currency:string};
export type RazorpaySuccess={razorpay_payment_id:string;razorpay_order_id:string;razorpay_signature:string};
type RazorpayFailure={error?:{code?:string;description?:string;reason?:string;metadata?:{order_id?:string;payment_id?:string}}};
type RazorpayInstance={open:()=>void;on:(event:'payment.failed',handler:(response:RazorpayFailure)=>void)=>void};
declare global{interface Window{Razorpay?:new(options:Record<string,unknown>)=>RazorpayInstance}}

async function invoke<T>(name:string,body:Record<string,unknown>){const{data,error}=await createSupabaseBrowserClient().functions.invoke(name,{body});if(error)throw new Error(error.message);if(data?.error)throw new Error(data.error);return data as T}
export const createRazorpayCheckout=(orderId:string)=>invoke<RazorpayCheckoutSession>('razorpay-checkout',{orderId,kind:'razorpay'});
export const confirmCodOrder=(orderId:string)=>invoke<{caseclanOrderId:string;caseclanOrderNumber:string;status:string;paymentStatus:string}>('razorpay-checkout',{orderId,kind:'cod'});
export const verifyRazorpayPayment=(response:RazorpaySuccess)=>invoke<{orderId:string;status:string;verifiedAt?:string}>('razorpay-verify',response);
export const recordRazorpayStatus=(providerOrderId:string,status:'failed'|'cancelled',details?:unknown)=>invoke('razorpay-status',{razorpay_order_id:providerOrderId,status,error:details});

let scriptPromise:Promise<void>|undefined;
function loadCheckout(){if(window.Razorpay)return Promise.resolve();if(scriptPromise)return scriptPromise;scriptPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;script.onload=()=>resolve();script.onerror=()=>reject(new Error('Razorpay Checkout could not be loaded.'));document.head.appendChild(script)});return scriptPromise}

export async function openRazorpayCheckout(session:RazorpayCheckoutSession,customer:CustomerProfile,onFailure?:(message:string)=>void){
 await loadCheckout();if(!window.Razorpay)throw new Error('Razorpay Checkout is unavailable.');
 return new Promise<RazorpaySuccess>((resolve,reject)=>{let finished=false;const instance=new window.Razorpay!({key:session.keyId,amount:session.amount,currency:session.currency,name:'CASECLAN',description:`Order ${session.caseclanOrderNumber}`,order_id:session.providerOrderId,prefill:{name:customer.name,email:customer.email,contact:customer.phone},theme:{color:'#111111'},retry:{enabled:true},modal:{confirm_close:true,ondismiss:()=>{if(!finished)reject(new Error('Payment checkout was closed.'))}},handler:(response:RazorpaySuccess)=>{finished=true;resolve(response)}});instance.on('payment.failed',response=>{const message=response.error?.description||'Payment failed. Please retry.';onFailure?.(message);void recordRazorpayStatus(session.providerOrderId,'failed',response.error).catch(()=>undefined)});instance.open()})
}

export async function payExistingOrder(orderId:string,customer:CustomerProfile,onFailure?:(message:string)=>void){const session=await createRazorpayCheckout(orderId);try{const response=await openRazorpayCheckout(session,customer,onFailure);const verified=await verifyRazorpayPayment(response);return{session,response,verified}}catch(error){if(error instanceof Error&&error.message==='Payment checkout was closed.')await recordRazorpayStatus(session.providerOrderId,'cancelled').catch(()=>undefined);throw error}}

