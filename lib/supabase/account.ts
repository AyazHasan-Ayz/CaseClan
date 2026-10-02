import {createSupabaseBrowserClient} from './client';
import type {BagItem,Order} from '@/components/StoreProvider';
import type {CustomerProfile,PaymentMethod,ShippingAddress} from '@/lib/commerce';
import {readArtifact,type Customization} from '@/lib/customizer';
import {manualFulfilmentFromMetadata} from '@/lib/fulfilment';
import {paymentFields,paymentMethodLabel,paymentStatusLabel} from '@/lib/payment-state';

export async function updateRemoteProfile(userId:string,profile:CustomerProfile){const supabase=createSupabaseBrowserClient();const{error}=await supabase.from('customers').update({full_name:profile.name,email:profile.email,phone:profile.phone}).eq('id',userId);if(error)throw error}

export async function saveRemoteAddress(userId:string,address:ShippingAddress&{id?:string;label?:string;isDefault?:boolean},customer:CustomerProfile){const supabase=createSupabaseBrowserClient();if(address.isDefault)await supabase.from('addresses').update({is_default:false}).eq('customer_id',userId);const row={customer_id:userId,label:address.label||'Home',recipient_name:customer.name,phone:customer.phone,line1:address.line1,line2:address.line2||null,landmark:address.landmark||null,city:address.city,state:address.state,postal_code:address.pin,country_code:'IN',is_default:!!address.isDefault};const query=address.id?supabase.from('addresses').update(row).eq('id',address.id):supabase.from('addresses').insert(row);const{error}=await query;if(error)throw error}
export async function deleteRemoteAddress(id:string){const{error}=await createSupabaseBrowserClient().from('addresses').delete().eq('id',id);if(error)throw error}
export async function setRemoteDefaultAddress(userId:string,id:string){const supabase=createSupabaseBrowserClient();const reset=await supabase.from('addresses').update({is_default:false}).eq('customer_id',userId);if(reset.error)throw reset.error;const{error}=await supabase.from('addresses').update({is_default:true}).eq('id',id);if(error)throw error}

function dataUrlBlob(value:string){const match=/^data:([^;,]+)(?:;[^,]*)?,(.*)$/.exec(value);if(!match)throw new Error('Custom artwork is not a valid browser image.');const bytes=value.includes(';base64,')?Uint8Array.from(atob(match[2]),char=>char.charCodeAt(0)):new TextEncoder().encode(decodeURIComponent(match[2]));return new Blob([bytes],{type:match[1]})}
const extension=(type:string)=>type.split('/')[1]?.replace('jpeg','jpg').replace('svg+xml','svg')||'png';

async function uploadCustomAssets(userId:string,item:BagItem){
  if(item.type!=='custom-case')return {};
  if(!item.design?.artifactId)throw new Error('The custom design file is missing. Open the editor and add the case again.');
  const saved=await readArtifact<{print:Blob;preview:string;customization:Customization}>(item.design.artifactId);
  if(!saved)throw new Error('The custom print file is unavailable in this browser. Open the editor and add the case again.');
  const supabase=createSupabaseBrowserClient(),root=`${userId}/${item.design.artifactId}`;
  const previewBlob=dataUrlBlob(saved.preview),previewPath=`${root}/preview.${extension(previewBlob.type)}`,printPath=`${root}/print.${extension(saved.print.type)}`;
  const previewUpload=await supabase.storage.from('custom-previews').upload(previewPath,previewBlob,{contentType:previewBlob.type,upsert:true});if(previewUpload.error)throw previewUpload.error;
  const printUpload=await supabase.storage.from('print-ready').upload(printPath,saved.print,{contentType:saved.print.type||'image/png',upsert:true});if(printUpload.error)throw printUpload.error;
  const customerUploadPaths:string[]=[];
  for(const layer of saved.customization.layers){if(layer.type!=='image'||!layer.originalSrc?.startsWith('data:'))continue;const blob=dataUrlBlob(layer.originalSrc),path=`${root}/source-${layer.id}.${extension(blob.type)}`;const result=await supabase.storage.from('customer-uploads').upload(path,blob,{contentType:blob.type,upsert:true});if(result.error)throw result.error;customerUploadPaths.push(path)}
  return {preview_path:previewPath,print_ready_path:printPath,customer_upload_paths:customerUploadPaths};
}

export async function placeRemoteOrder(input:{customer:CustomerProfile;shippingAddress:ShippingAddress;paymentMethod:PaymentMethod;items:BagItem[]}){
  const supabase=createSupabaseBrowserClient(),{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('Authentication required.');
  const prepared=await Promise.all(input.items.map(async item=>({...item,...await uploadCustomAssets(user.id,item)})));
  const payload={customer:{full_name:input.customer.name,email:input.customer.email,phone:input.customer.phone},shipping_address:{recipient_name:input.customer.name,phone:input.customer.phone,line1:input.shippingAddress.line1,line2:input.shippingAddress.line2,landmark:input.shippingAddress.landmark,city:input.shippingAddress.city,state:input.shippingAddress.state,postal_code:input.shippingAddress.pin,country_code:'IN'},payment_method:input.paymentMethod,items:prepared.map(item=>({product_slug:item.productId,phone_model_slug:item.device,quantity:item.quantity,item_type:item.type||'ready-design',fixed_design_id:item.fixedDesignId||null,design_state:item.design?.customization||null,preview:item.design?.preview||null,preview_path:item.preview_path||null,print_ready_path:item.print_ready_path||null,customer_upload_paths:item.customer_upload_paths||[]}))};
  const{data,error}=await supabase.rpc('place_order',{payload});if(error)throw error;return data;
}

async function signedUrl(bucket:'custom-previews'|'print-ready'|'customer-uploads',path:string|null|undefined){if(!path)return undefined;const{data,error}=await createSupabaseBrowserClient().storage.from(bucket).createSignedUrl(path,3600);return error?undefined:data.signedUrl}

export async function loadRemoteAccount(userId:string){
  const supabase=createSupabaseBrowserClient();
  const[customerResult,addressResult,orderResult,productResult,modelResult]=await Promise.all([supabase.from('customers').select('id,email,phone,full_name').eq('id',userId).single(),supabase.from('addresses').select('*').eq('customer_id',userId).order('created_at'),supabase.from('orders').select('*').eq('customer_id',userId).order('created_at',{ascending:false}),supabase.from('products').select('id,slug,name'),supabase.from('phone_models').select('id,slug')]);
  if(customerResult.error)throw customerResult.error;if(addressResult.error)throw addressResult.error;if(orderResult.error)throw orderResult.error;
  const orderIds=orderResult.data.map(order=>order.id),[itemsResult,paymentsResult]=orderIds.length?await Promise.all([supabase.from('order_items').select('*').in('order_id',orderIds),supabase.from('payments').select('*').in('order_id',orderIds)]):[{data:[],error:null},{data:[],error:null}];if(itemsResult.error)throw itemsResult.error;if(paymentsResult.error)throw paymentsResult.error;
  const itemIds=(itemsResult.data||[]).map(item=>item.id),customResult=itemIds.length?await supabase.from('customizations').select('*').in('order_item_id',itemIds):{data:[],error:null};if(customResult.error)throw customResult.error;
  const customer:CustomerProfile={name:customerResult.data.full_name||'',email:customerResult.data.email||'',phone:customerResult.data.phone||'',address:''},productMap=new Map((productResult.data||[]).map(product=>[product.id,product])),modelMap=new Map((modelResult.data||[]).map(model=>[model.id,model.slug])),customMap=new Map((customResult.data||[]).map(custom=>[custom.order_item_id,custom])),paymentMap=new Map((paymentsResult.data||[]).map(payment=>[payment.order_id,payment]));
  const addresses=addressResult.data.map(row=>({id:row.id,label:row.label||'Home',line1:row.line1,line2:row.line2||'',landmark:row.landmark||'',city:row.city,state:row.state,pin:row.postal_code,isDefault:row.is_default}));
  const orders:Order[]=await Promise.all(orderResult.data.map(async row=>{const shipping=(row.shipping_address||{}) as Record<string,string>,payment=paymentMap.get(row.id);return{databaseId:row.id,id:`CC-${String(row.order_number).padStart(8,'0')}`,date:row.created_at,items:await Promise.all((itemsResult.data||[]).filter(item=>item.order_id===row.id).map(async item=>{const product=productMap.get(item.product_id||''),custom=customMap.get(item.id),preview=await signedUrl('custom-previews',custom?.preview_path);return{key:item.id,productId:product?.slug||item.product_id||'',productName:item.product_name,device:modelMap.get(item.phone_model_id||'')||'',color:'Clear',quantity:item.quantity,type:item.item_type,unitPrice:item.unit_price,fixedDesignId:item.fixed_design_id||undefined,design:custom?{name:'Custom artwork',font:'Modern',textColor:'#000000',style:'Custom Upload',type:'custom-case',preview,customization:custom.design_state as never}:undefined}})),subtotal:row.subtotal,shipping:row.shipping_amount,discount:row.discount_amount,codFee:row.cod_fee,total:row.total,clans:[],customer,shippingAddress:{line1:shipping.line1||'',line2:shipping.line2||'',landmark:shipping.landmark||'',city:shipping.city||'',state:shipping.state||'',pin:shipping.postal_code||''},paymentMethod:paymentMethodLabel(row.payment_method),paymentStatus:paymentStatusLabel(payment?.status,row.payment_method),...paymentFields(payment),status:row.status==='new'?'New':row.status,trackingId:row.tracking_id||undefined,courier:row.courier||undefined,...manualFulfilmentFromMetadata(row.metadata)} as Order}));
  return{customer,addresses,orders};
}
