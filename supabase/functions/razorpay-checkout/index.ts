import{adminClient,amountPaise,authenticatedUser,cors,json,ownedOrder,razorpay,razorpayEnv}from'../_shared/razorpay.ts';

Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});if(req.method!=='POST')return json(req,{error:'Method not allowed.'},405);
 try{
  const user=await authenticatedUser(req),body=await req.json(),orderId=String(body.orderId||''),kind=body.kind==='cod'?'cod':'razorpay',admin=adminClient(),order=await ownedOrder(admin,user.id,orderId);
  if(kind==='cod'){
   if(!['Cash on Delivery','cod'].includes(String(order.payment_method)))throw new Error('This order is not a COD order.');
   const expected=amountPaise(order.total),{error:paymentError}=await admin.from('payments').upsert({order_id:order.id,customer_id:user.id,provider:'cod',expected_amount:expected,received_amount:null,currency:order.currency,status:'pending',payment_method:'cod',signature_verified:false,metadata:{}},{onConflict:'order_id,provider'});if(paymentError)throw paymentError;
   const{error}=await admin.from('orders').update({payment_method:'cod',payment_status:'cod_pending',status:'Confirmed'}).eq('id',order.id);if(error)throw error;
   return json(req,{caseclanOrderId:order.id,caseclanOrderNumber:`CC-${String(order.order_number).padStart(8,'0')}`,status:'Confirmed',paymentStatus:'cod_pending'});
  }
  if(order.payment_status==='paid')throw new Error('This order is already paid.');
  if(!['Online Payment','razorpay'].includes(String(order.payment_method)))throw new Error('This order is not eligible for online payment.');
  const expected=amountPaise(order.total),{data:existing}=await admin.from('payments').select('*').eq('order_id',order.id).eq('provider','razorpay').maybeSingle();
  if(existing?.status==='pending'&&existing.provider_order_id){const{keyId}=razorpayEnv();return json(req,{keyId,providerOrderId:existing.provider_order_id,caseclanOrderId:order.id,caseclanOrderNumber:`CC-${String(order.order_number).padStart(8,'0')}`,amount:existing.expected_amount,currency:existing.currency});}
  const receipt=`CC${String(order.order_number).padStart(8,'0')}`,provider=await razorpay('/orders',{method:'POST',body:JSON.stringify({amount:expected,currency:order.currency,receipt,notes:{caseclan_order_id:order.id,caseclan_order_number:receipt}})}),providerOrderId=String(provider.id||'');if(!providerOrderId)throw new Error('Razorpay did not return an order ID.');
  const metadata={...(existing?.metadata||{}),attempts:[...((existing?.metadata as {attempts?:unknown[]}|null)?.attempts||[]),{provider_order_id:providerOrderId,created_at:new Date().toISOString()}]};
  const{error:paymentError}=await admin.from('payments').upsert({order_id:order.id,customer_id:user.id,provider:'razorpay',provider_order_id:providerOrderId,provider_payment_id:null,expected_amount:expected,received_amount:null,currency:order.currency,status:'pending',payment_method:null,signature_verified:false,verified_at:null,metadata},{onConflict:'order_id,provider'});if(paymentError)throw paymentError;
  const{error:orderError}=await admin.from('orders').update({payment_method:'razorpay',payment_status:'pending',status:'Pending',metadata:{...(order.metadata||{}),razorpay_order_id:providerOrderId}}).eq('id',order.id);if(orderError)throw orderError;
  const{keyId}=razorpayEnv();return json(req,{keyId,providerOrderId,caseclanOrderId:order.id,caseclanOrderNumber:`CC-${String(order.order_number).padStart(8,'0')}`,amount:expected,currency:order.currency});
 }catch(error){return json(req,{error:error instanceof Error?error.message:'Could not start payment.'},error instanceof Error&&error.message==='Authentication required.'?401:400)}
});

