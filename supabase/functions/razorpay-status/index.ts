import{adminClient,authenticatedUser,cors,json,paymentForProviderOrder}from'../_shared/razorpay.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});if(req.method!=='POST')return json(req,{error:'Method not allowed.'},405);
 try{const user=await authenticatedUser(req),body=await req.json(),providerOrderId=String(body.razorpay_order_id||''),admin=adminClient(),payment=await paymentForProviderOrder(admin,providerOrderId);if(payment.customer_id!==user.id)throw new Error('Payment attempt not found.');
 const{data,error}=await admin.rpc('settle_payment',{provider_order:providerOrderId,new_status:body.status==='cancelled'?'cancelled':'failed',details:{source:'client',error:String(body.error?.description||'').slice(0,500)}});if(error)throw new Error(error.message);return json(req,data);
 }catch(error){return json(req,{error:error instanceof Error?error.message:'Could not record payment status.'},error instanceof Error&&error.message==='Authentication required.'?401:400)}
});
