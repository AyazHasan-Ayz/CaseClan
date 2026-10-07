import{adminClient,cors,hmacHex,json,providerEntity,razorpay,safeEqual}from'../_shared/razorpay.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});if(req.method!=='POST')return json(req,{error:'Method not allowed.'},405);
 const raw=await req.text(),signature=req.headers.get('x-razorpay-signature')||'',secret=Deno.env.get('RAZORPAY_WEBHOOK_SECRET')||'';if(!secret)return json(req,{error:'Webhook secret is not configured.'},503);
 if(!safeEqual(await hmacHex(secret,raw),signature))return json(req,{error:'Invalid webhook signature.'},401);
 try{
  const payload=JSON.parse(raw),event=String(payload.event||''),entity=providerEntity(payload,'payment');
  if(event==='refund.processed'){
   const refund=providerEntity(payload,'refund'),remote=await razorpay(`/payments/${encodeURIComponent(String(refund.payment_id||''))}`);
   const{error}=await adminClient().rpc('settle_payment',{provider_order:String(remote.order_id),new_status:'refunded',details:{event_id:req.headers.get('x-razorpay-event-id')||await hmacHex(secret,raw),event_type:event,payment_id:refund.payment_id,amount_refunded:remote.amount_refunded,signature_verified:true}});if(error)throw new Error(error.message);return json(req,{ok:true});
  }
  if(!['payment.captured','order.paid','payment.failed'].includes(event))return json(req,{ok:true,ignored:true});
  if(!entity.order_id||!entity.id)throw new Error('Webhook missing payment entity.');
  const paid=event!=='payment.failed';if(paid&&(entity.status!=='captured'||entity.captured!==true))throw new Error('Payment is not captured.');
  // payment_events insertion and order settlement share one database transaction.
  const{data,error}=await adminClient().rpc('settle_payment',{provider_order:String(entity.order_id),new_status:paid?'paid':'failed',details:{event_id:req.headers.get('x-razorpay-event-id')||await hmacHex(secret,raw),event_type:event,payment_id:String(entity.id),amount:Number(entity.amount),currency:String(entity.currency),signature_verified:true,method:entity.method}});
  if(error)throw new Error(error.message);return json(req,{ok:true,...data});
 }catch(error){return json(req,{error:error instanceof Error?error.message:'Webhook processing failed.'},500)}
});
