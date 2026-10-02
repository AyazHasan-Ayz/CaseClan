'use client';

import {createSupabaseBrowserClient} from './client';
import type {Order} from '@/components/StoreProvider';
import type {CustomerProfile} from '@/lib/commerce';
import {jsonRecord,manualFulfilmentFromMetadata,statusForCustomer} from '@/lib/fulfilment';
import {paymentFields,paymentMethodLabel,paymentStatusLabel} from '@/lib/payment-state';

async function signedUrl(bucket:'custom-previews'|'print-ready'|'customer-uploads',path:string|null|undefined){if(!path)return undefined;const{data,error}=await createSupabaseBrowserClient().storage.from(bucket).createSignedUrl(path,3600);return error?undefined:data.signedUrl}

export async function loadRemoteAdminOrders():Promise<Order[]>{
  const supabase=createSupabaseBrowserClient();
  const[ordersResult,itemsResult,customResult,productsResult,modelsResult,customersResult,paymentsResult]=await Promise.all([
    supabase.from('orders').select('*').order('created_at',{ascending:false}),supabase.from('order_items').select('*'),supabase.from('customizations').select('*'),supabase.from('products').select('id,slug,name'),supabase.from('phone_models').select('id,slug'),supabase.from('customers').select('id,email,phone,full_name'),supabase.from('payments').select('*'),
  ]);
  for(const result of[ordersResult,itemsResult,customResult,productsResult,modelsResult,customersResult,paymentsResult])if(result.error)throw result.error;
  const productMap=new Map((productsResult.data||[]).map(row=>[row.id,row])),modelMap=new Map((modelsResult.data||[]).map(row=>[row.id,row.slug])),customerMap=new Map((customersResult.data||[]).map(row=>[row.id,row])),customMap=new Map((customResult.data||[]).map(row=>[row.order_item_id,row])),paymentMap=new Map((paymentsResult.data||[]).map(row=>[row.order_id,row]));
  return Promise.all((ordersResult.data||[]).map(async row=>{
    const shipping=(row.shipping_address||{}) as Record<string,string>,account=customerMap.get(row.customer_id||''),payment=paymentMap.get(row.id),customer:CustomerProfile={name:account?.full_name||shipping.recipient_name||'',email:account?.email||row.guest_email||'',phone:account?.phone||shipping.phone||'',address:''};
    const items=await Promise.all((itemsResult.data||[]).filter(item=>item.order_id===row.id).map(async item=>{
      const product=productMap.get(item.product_id||''),custom=customMap.get(item.id),preview=await signedUrl('custom-previews',custom?.preview_path),printReadyUrl=await signedUrl('print-ready',custom?.print_ready_path),uploadedArtworkUrls=await Promise.all((custom?.customer_upload_paths||[]).map(path=>signedUrl('customer-uploads',path)));
      return{key:item.id,productId:product?.slug||item.product_id||'',productName:item.product_name,device:modelMap.get(item.phone_model_id||'')||'',color:'Clear',quantity:item.quantity,type:item.item_type,unitPrice:item.unit_price,fixedDesignId:item.fixed_design_id||undefined,design:custom?{name:'Custom artwork',font:'Modern',textColor:'#000000',style:'Custom Upload',type:'custom-case' as const,preview,printReadyUrl,uploadedArtworkUrls:uploadedArtworkUrls.filter((url):url is string=>!!url),customization:custom.design_state as never}:undefined};
    }));
    return{databaseId:row.id,id:`CC-${String(row.order_number).padStart(8,'0')}`,date:row.created_at,items,subtotal:row.subtotal,shipping:row.shipping_amount,discount:row.discount_amount,codFee:row.cod_fee,total:row.total,clans:[],customer,shippingAddress:{line1:shipping.line1||'',line2:shipping.line2||'',landmark:shipping.landmark||'',city:shipping.city||'',state:shipping.state||'',pin:shipping.postal_code||''},paymentMethod:paymentMethodLabel(row.payment_method),paymentStatus:paymentStatusLabel(payment?.status,row.payment_method),...paymentFields(payment),status:row.status==='new'?'New':row.status,trackingId:row.tracking_id||undefined,courier:row.courier||undefined,adminNote:row.admin_note||undefined,...manualFulfilmentFromMetadata(row.metadata)} as Order;
  }));
}

export async function saveRemoteManualFulfilment(order:Order,patch:Partial<Order>){
  if(!order.databaseId)throw new Error('This order is not linked to Supabase.');
  if(patch.trackingUrl&&!/^https:\/\//i.test(patch.trackingUrl))throw new Error('Tracking URL must use HTTPS.');
  const supabase=createSupabaseBrowserClient(),current=await supabase.from('orders').select('metadata').eq('id',order.databaseId).single();if(current.error)throw current.error;
  const status=String(patch.shipmentStatus||patch.status||order.shipmentStatus||order.status),existing=jsonRecord(current.data.metadata),previousHistory=Array.isArray(existing.status_history)?existing.status_history:[],last=jsonRecord(previousHistory.at(-1)),history=last.status===status?previousHistory:[...previousHistory,{status,at:new Date().toISOString()}];
  const metadata={...existing,fulfilment_provider:patch.fulfilmentProvider||order.fulfilmentProvider||'Qikink',qikink_order_id:patch.qikinkOrderId||null,fulfilment_status:patch.fulfilmentStatus||order.fulfilmentStatus||'Pending',shipment_status:status,tracking_url:patch.trackingUrl||null,status_history:history};
  const update=await supabase.from('orders').update({status,tracking_id:patch.trackingId||null,courier:patch.courier||null,admin_note:patch.adminNote||null,metadata}).eq('id',order.databaseId).select('id').single();if(update.error)throw update.error;
  return{...patch,status:statusForCustomer(status) as Order['status'],shipmentStatus:status,statusHistory:history as Order['statusHistory']};
}
