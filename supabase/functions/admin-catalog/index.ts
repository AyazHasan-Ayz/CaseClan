import{adminClient,authenticatedUser,cors,json}from'../_shared/razorpay.ts';

type RecordValue=Record<string,unknown>;
const list=(value:unknown)=>Array.isArray(value)?value as RecordValue[]:[];
const text=(value:unknown)=>typeof value==='string'?value:'';
const numberOrNull=(value:unknown)=>Number.isFinite(Number(value))?Number(value):null;
const staffRoles=new Set(['owner','admin','staff']);

Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});
 if(req.method!=='POST')return json(req,{error:'Method not allowed.'},405);
 try{
  const user=await authenticatedUser(req),admin=adminClient();
  const profile=await admin.from('customers').select('role').eq('id',user.id).single();
  if(profile.error||!staffRoles.has(String(profile.data?.role)))return json(req,{error:'Admin permission required.'},403);
  const body=await req.json(),data=(body?.data||{}) as RecordValue;
  const products=list(data.products),devices=list(data.devices),coupons=list(data.coupons),reviews=list(data.reviews),settings=(data.settings||{}) as RecordValue;
  if(products.length>100||devices.length>100)throw new Error('Too many changes in one request.');
  for(const product of products){if(!text(product.id)||!text(product.name)||!Number.isFinite(Number(product.price))||Number(product.price)<0)throw new Error('Valid product name, slug, and price are required.');}

  const modelRows=devices.map(device=>({
   slug:text(device.slug),name:text(device.name),brand:text(device.brand),status:device.active===false?'inactive':'active',display_order:Number(device.displayOrder)||0,
   base_mockup_path:((device.mockup as RecordValue|undefined)?.assets as RecordValue|undefined)?.base||null,case_overlay_path:((device.mockup as RecordValue|undefined)?.assets as RecordValue|undefined)?.caseOverlay||null,highlight_overlay_path:((device.mockup as RecordValue|undefined)?.assets as RecordValue|undefined)?.highlightOverlay||null,shadow_overlay_path:((device.mockup as RecordValue|undefined)?.assets as RecordValue|undefined)?.shadowOverlay||null,print_mask_path:((device.mockup as RecordValue|undefined)?.assets as RecordValue|undefined)?.printMask||null,camera_mask_path:((device.mockup as RecordValue|undefined)?.assets as RecordValue|undefined)?.cameraMask||null,
   print_area:(device.mockup as RecordValue|undefined)?.printArea||{},safe_area:(device.mockup as RecordValue|undefined)?.safeArea||{},camera_exclusion:(device.mockup as RecordValue|undefined)?.camera||{},metadata:{available:device.available!==false,mockup:device.mockup||null}
  }));
  if(modelRows.length){const modelsSaved=await admin.from('phone_models').upsert(modelRows,{onConflict:'slug'});if(modelsSaved.error)throw modelsSaved.error;}

  const productRows=products.map(product=>({
   slug:text(product.id),name:text(product.name),description:text(product.description)||null,short_description:text(product.shortDescription)||null,kind:product.kind==='custom'?'custom':'ready',status:['active','draft','archived'].includes(text(product.status))?text(product.status):'draft',
   price:Number(product.price)||0,compare_at_price:numberOrNull(product.compareAtPrice),cost_price:numberOrNull(product.costPrice),sku:text(product.sku)||null,material:text(product.material)||null,collection:text(product.collection)||null,artwork_locked:product.kind!=='custom',
   metadata:{clan:product.clan||'NOIR',colors:Array.isArray(product.colors)?product.colors:['Black'],style:product.style||'',magsafe:!!product.magsafe,rank:Number(product.rank)||999,imageDevice:product.imageDevice||'',featured:!!product.featured,bestSeller:!!product.bestSeller,newArrival:!!product.newArrival,seoTitle:product.seoTitle||'',metaDescription:product.metaDescription||''}
  }));
  if(productRows.length){const productsSaved=await admin.from('products').upsert(productRows,{onConflict:'slug'});if(productsSaved.error)throw productsSaved.error;}

  const productLookup=await admin.from('products').select('id,slug').in('slug',products.map(product=>text(product.id)));
  const modelLookup=await admin.from('phone_models').select('id,slug');
  if(productLookup.error||modelLookup.error)throw productLookup.error||modelLookup.error;
  const productIds=new Map((productLookup.data||[]).map(row=>[row.slug,row.id])),modelIds=new Map((modelLookup.data||[]).map(row=>[row.slug,row.id]));

  for(const product of products){
   const productId=productIds.get(text(product.id));if(!productId)continue;
   const disabled=await admin.from('product_phone_models').update({available:false}).eq('product_id',productId);if(disabled.error)throw disabled.error;
   const modelPrices=(product.modelPrices||{}) as RecordValue;
   const mappings=(Array.isArray(product.devices)?product.devices:[]).map(value=>text(value)).map(slug=>({product_id:productId,phone_model_id:modelIds.get(slug),price_override:numberOrNull(modelPrices[slug]),available:true})).filter(row=>!!row.phone_model_id);
   if(mappings.length){const result=await admin.from('product_phone_models').upsert(mappings,{onConflict:'product_id,phone_model_id'});if(result.error)throw result.error}

   const urls=[text(product.image),...(Array.isArray(product.gallery)?product.gallery.map(text):[])].filter(Boolean);
   const oldImages=await admin.from('product_images').select('id,storage_path').eq('product_id',productId);if(oldImages.error)throw oldImages.error;
   if(oldImages.data?.length){const reset=await admin.from('product_images').update({is_primary:false}).eq('product_id',productId);if(reset.error)throw reset.error}
   const imageRows=urls.map((url,index)=>({product_id:productId,storage_path:url,alt_text:index===0?`${text(product.name)} product image`:`${text(product.name)} gallery image ${index+1}`,sort_order:index,is_primary:index===0}));
   if(imageRows.length){const result=await admin.from('product_images').upsert(imageRows,{onConflict:'product_id,storage_path'});if(result.error)throw result.error}
   const staleIds=(oldImages.data||[]).filter(row=>!urls.includes(row.storage_path)).map(row=>row.id);
   if(staleIds.length){const result=await admin.from('product_images').delete().in('id',staleIds);if(result.error)throw result.error}
  }

  for(const coupon of coupons){const row={id:text(coupon.id),code:text(coupon.code).toUpperCase(),discount_type:coupon.kind==='fixed'?'fixed':'percentage',value:Number(coupon.value)||0,minimum_cart_value:Number(coupon.minimum)||0,usage_limit:numberOrNull(coupon.usageLimit),starts_at:text(coupon.startsAt)||null,ends_at:text(coupon.endsAt)||null,active:coupon.active!==false,metadata:{maximum_discount:numberOrNull(coupon.maximum)}};const result=await admin.from('coupons').upsert(row);if(result.error)throw result.error}
  for(const review of reviews){const result=await admin.from('reviews').update({status:review.status,verified_purchase:!!review.verified}).eq('id',text(review.id));if(result.error)throw result.error}
  if('settings' in data){const settingsSaved=await admin.from('store_settings').upsert({key:'storefront',value:settings,is_public:true},{onConflict:'key'});if(settingsSaved.error)throw settingsSaved.error;}
  if('media' in data){const mediaSaved=await admin.from('store_settings').upsert({key:'media_library',value:Array.isArray(data.media)?data.media:[],is_public:false},{onConflict:'key'});if(mediaSaved.error)throw mediaSaved.error;}
  return json(req,{ok:true,products:products.length,devices:devices.length});
 }catch(error){return json(req,{error:error&&typeof error==='object'&&'message' in error?String(error.message):'Catalog update failed.'},400)}
});
