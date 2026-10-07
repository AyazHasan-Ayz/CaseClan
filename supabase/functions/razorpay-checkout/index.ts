import{adminClient,amountPaise,authenticatedUser,cors,json,ownedOrder,razorpay,razorpayEnv}from'../_shared/razorpay.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});if(req.method!=='POST')return json(req,{error:'Method not allowed.'},405);
 const started=performance.now();
 try{
  const user=await authenticatedUser(req),body=await req.json(),admin=adminClient(),order=await ownedOrder(admin,user.id,String(body.orderId||''));
  const kind=body.kind==='cod'?'cod':'claim';
  const claimed=await admin.rpc('prepare_payment',{order_uuid:order.id,operation:kind});if(claimed.error)throw new Error(claimed.error.message);
  if(kind==='cod')return json(req,{...claimed.data,caseclanOrderId:order.id});
  let payment=claimed.data;let providerMs=0;
  if(!payment.provider_order_id){
   const start=performance.now();
   const provider=await razorpay('/orders',{method:'POST',body:JSON.stringify({amount:amountPaise(order.total),currency:order.currency,receipt:`CC${order.order_number}`,notes:{caseclan_order_id:order.id}})});
   providerMs=Math.round(performance.now()-start);
   if(!provider.id)throw new Error('Razorpay did not return an order ID.');
   const attached=await admin.rpc('prepare_payment',{order_uuid:order.id,operation:'attach',details:{provider_order_id:String(provider.id)}});if(attached.error)throw new Error(attached.error.message);payment=attached.data;
  }
  const{keyId}=razorpayEnv();
  return json(req,{keyId,providerOrderId:payment.provider_order_id,caseclanOrderId:order.id,caseclanOrderNumber:`CC-${String(order.order_number).padStart(8,'0')}`,amount:payment.expected_amount,currency:payment.currency,timings:{serverMs:Math.round(performance.now()-started),providerMs}});
 }catch(error){return json(req,{error:error instanceof Error?error.message:'Could not start payment.'},error instanceof Error&&error.message==='Authentication required.'?401:400)}
});
