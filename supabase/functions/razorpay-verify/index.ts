import{adminClient,authenticatedUser,cors,hmacHex,json,paymentForProviderOrder,razorpay,razorpayEnv,safeEqual}from'../_shared/razorpay.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});if(req.method!=='POST')return json(req,{error:'Method not allowed.'},405);
 try{
  const user=await authenticatedUser(req),body=await req.json(),providerOrderId=String(body.razorpay_order_id||''),providerPaymentId=String(body.razorpay_payment_id||''),signature=String(body.razorpay_signature||''),admin=adminClient(),payment=await paymentForProviderOrder(admin,providerOrderId);
  if(payment.customer_id!==user.id)throw new Error('Payment attempt not found.');
  const{keySecret}=razorpayEnv(),expectedSignature=await hmacHex(keySecret,`${payment.provider_order_id}|${providerPaymentId}`);if(!safeEqual(expectedSignature,signature))throw new Error('Invalid Razorpay payment signature.');
  const[remotePayment,remoteOrder]=await Promise.all([razorpay(`/payments/${encodeURIComponent(providerPaymentId)}`),razorpay(`/orders/${encodeURIComponent(providerOrderId)}`)]);
  const received=Number(remotePayment.amount),currency=String(remotePayment.currency||''),captured=remotePayment.status==='captured'&&remotePayment.captured===true;
  if(received!==Number(payment.expected_amount)||Number(remoteOrder.amount)!==Number(payment.expected_amount)||currency!==payment.currency||remotePayment.order_id!==providerOrderId){
   const review=await admin.rpc('settle_payment',{provider_order:providerOrderId,new_status:'amount_mismatch',details:{payment_id:providerPaymentId,amount:received}});if(review.error)throw new Error(review.error.message);
   return json(req,{error:'Payment amount did not match the CASECLAN order.'},409);
  }
  if(!captured)return json(req,{orderId:payment.order_id,status:'pending',message:'Payment is verified but is not captured yet.'},202);
  const{data,error}=await admin.rpc('settle_payment',{provider_order:providerOrderId,new_status:'paid',details:{payment_id:providerPaymentId,amount:received,currency,signature_verified:true,method:remotePayment.method}});if(error)throw new Error(error.message);
  return json(req,data);
 }catch(error){return json(req,{error:error instanceof Error?error.message:'Payment verification failed.'},error instanceof Error&&error.message==='Authentication required.'?401:400)}
});
