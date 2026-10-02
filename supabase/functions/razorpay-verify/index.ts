import{adminClient,authenticatedUser,cors,hmacHex,json,paymentForProviderOrder,razorpay,razorpayEnv,safeEqual}from'../_shared/razorpay.ts';

Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});if(req.method!=='POST')return json(req,{error:'Method not allowed.'},405);
 try{
  const user=await authenticatedUser(req),body=await req.json(),providerOrderId=String(body.razorpay_order_id||''),providerPaymentId=String(body.razorpay_payment_id||''),signature=String(body.razorpay_signature||''),admin=adminClient(),payment=await paymentForProviderOrder(admin,providerOrderId);
  if(payment.customer_id!==user.id)throw new Error('Payment attempt not found.');if(payment.status==='paid'&&payment.provider_payment_id===providerPaymentId)return json(req,{orderId:payment.order_id,status:'paid',duplicate:true});
  const{keySecret}=razorpayEnv(),expectedSignature=await hmacHex(keySecret,`${payment.provider_order_id}|${providerPaymentId}`);if(!safeEqual(expectedSignature,signature))throw new Error('Invalid Razorpay payment signature.');
  const remotePayment=await razorpay(`/payments/${encodeURIComponent(providerPaymentId)}`),remoteOrder=await razorpay(`/orders/${encodeURIComponent(providerOrderId)}`),received=Number(remotePayment.amount),currency=String(remotePayment.currency||''),captured=remotePayment.status==='captured'&&remotePayment.captured===true,amountMatches=received===Number(payment.expected_amount)&&Number(remoteOrder.amount)===Number(payment.expected_amount)&&currency===payment.currency&&remotePayment.order_id===providerOrderId;
  if(!amountMatches){await admin.from('payments').update({provider_payment_id:providerPaymentId,received_amount:Number.isFinite(received)?received:null,status:'amount_mismatch',payment_method:String(remotePayment.method||''),signature_verified:true,verified_at:new Date().toISOString(),metadata:{remote_payment_status:remotePayment.status,remote_order_status:remoteOrder.status}}).eq('id',payment.id);await admin.from('orders').update({payment_status:'amount_mismatch',status:'Payment Review'}).eq('id',payment.order_id);return json(req,{error:'Payment amount did not match the CASECLAN order.'},409)}
  if(!captured)return json(req,{orderId:payment.order_id,status:'pending',message:'Payment is verified but is not captured yet.'},202);
  const verifiedAt=new Date().toISOString();await admin.from('payments').update({provider_payment_id:providerPaymentId,received_amount:received,status:'paid',payment_method:String(remotePayment.method||''),signature_verified:true,verified_at:verifiedAt,metadata:{remote_payment_status:remotePayment.status,remote_order_status:remoteOrder.status}}).eq('id',payment.id);
  const{data:order}=await admin.from('orders').select('metadata').eq('id',payment.order_id).single();await admin.from('orders').update({payment_status:'paid',status:'Confirmed',metadata:{...(order?.metadata||{}),razorpay_order_id:providerOrderId,razorpay_payment_id:providerPaymentId,payment_verified_at:verifiedAt}}).eq('id',payment.order_id);
  return json(req,{orderId:payment.order_id,status:'paid',verifiedAt});
 }catch(error){return json(req,{error:error instanceof Error?error.message:'Payment verification failed.'},error instanceof Error&&error.message==='Authentication required.'?401:400)}
});

