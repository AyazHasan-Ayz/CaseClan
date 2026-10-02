import{adminClient,authenticatedUser,cors,json,paymentForProviderOrder}from'../_shared/razorpay.ts';

Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});if(req.method!=='POST')return json(req,{error:'Method not allowed.'},405);
 try{const user=await authenticatedUser(req),body=await req.json(),providerOrderId=String(body.razorpay_order_id||''),requested=body.status==='cancelled'?'cancelled':'failed',admin=adminClient(),payment=await paymentForProviderOrder(admin,providerOrderId);if(payment.customer_id!==user.id)throw new Error('Payment attempt not found.');if(payment.status==='paid')return json(req,{status:'paid'});await admin.from('payments').update({status:requested,provider_payment_id:body.razorpay_payment_id||payment.provider_payment_id,metadata:{...(payment.metadata||{}),client_error:body.error||null}}).eq('id',payment.id);await admin.from('orders').update({payment_status:requested,status:'Payment Pending'}).eq('id',payment.order_id);return json(req,{orderId:payment.order_id,status:requested})}catch(error){return json(req,{error:error instanceof Error?error.message:'Could not record payment status.'},error instanceof Error&&error.message==='Authentication required.'?401:400)}
});

