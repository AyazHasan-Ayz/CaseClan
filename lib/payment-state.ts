import type {PaymentStatus,PaymentMethod} from './commerce';

export type PaymentRow={provider?:'razorpay'|'cod'|null;provider_order_id?:string|null;provider_payment_id?:string|null;expected_amount?:number|null;received_amount?:number|null;status?:string|null;signature_verified?:boolean|null;verified_at?:string|null};

export function paymentStatusLabel(status?:string|null,method?:string|null):PaymentStatus{
  if(method==='cod'||status==='cod_pending')return 'Cash on Delivery';
  return({paid:'Paid',pending:'Pending',failed:'Failed',cancelled:'Cancelled',amount_mismatch:'Amount mismatch',refunded:'Refunded'} as Record<string,PaymentStatus>)[status||'']||'Not processed';
}
export function paymentMethodLabel(method?:string|null):PaymentMethod{return method==='cod'||method==='Cash on Delivery'?'Cash on Delivery':'Online Payment'}
export function canRetryPayment(status:PaymentStatus){return status==='Pending'||status==='Failed'||status==='Cancelled'}
export function paymentFields(payment?:PaymentRow|null){return payment?{paymentProvider:payment.provider||undefined,razorpayOrderId:payment.provider_order_id||undefined,razorpayPaymentId:payment.provider_payment_id||undefined,expectedAmount:payment.expected_amount==null?undefined:payment.expected_amount/100,receivedAmount:payment.received_amount==null?undefined:payment.received_amount/100,signatureVerified:payment.signature_verified||false,paymentVerifiedAt:payment.verified_at||undefined}:{};}

/** Payment initialization is not an ecommerce order. Keep historical attempts internal. */
export function isConfirmedOrder(row:{payment_status?:string;paymentStatus?:string;payment_method?:string|null;paymentMethod?:string;status?:string}){
 const payment=(row.payment_status||row.paymentStatus||'').toLowerCase();
 if(['paid','refunded'].includes(payment))return true;
 const method=(row.payment_method||row.paymentMethod||'').toLowerCase();
 return ['cod','cash on delivery'].includes(method)&&['cod_pending','cash on delivery'].includes(payment)&&!['new','pending','payment pending','order placed',''].includes((row.status||'').toLowerCase());
}
