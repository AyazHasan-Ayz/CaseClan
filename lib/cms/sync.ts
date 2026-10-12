import 'server-only';
import {createSupabaseAdminClient} from '@/lib/supabase/server';
import {sanityClient} from './server';
import {productProjection,phoneProjection} from './queries';
import type {CmsProduct,CmsPhone,CmsSiteSettings,CmsCustomizer} from './types';
import type {Json} from '@/lib/supabase/types';
import {validateMockup} from './validation';
const checked=<T,>(result:{data:T;error:unknown})=>{if(result.error)throw result.error;return result.data};
/** Called only after a signed webhook. Re-read published documents; never trust webhook prices. */
export async function syncCommerceDocument(id:string,type:string){
 const db=createSupabaseAdminClient(),sanity=sanityClient(false),cleanId=id.replace(/^drafts\./,'');
 if(type==='phoneModel'){
  const phone=await sanity.fetch<CmsPhone|null>(`*[_id==$id][0]${phoneProjection}`,{id:cleanId},{cache:'no-store'});
  if(!phone)throw new Error('Published phone model missing. Archive instead of deleting.');
  const config=validateMockup(phone.mockup,phone.slug);
  const prior=checked(await db.from('phone_models').select('id,metadata').contains('metadata',{sanityId:cleanId}).maybeSingle());
  const metadata={...(prior?.metadata as object||{}),sanityId:cleanId,mockup:config,available:phone.active,deviceImage:phone.image?.url,modelUrl:phone.modelUrl,supportedCaseTypes:phone.supportedCaseTypes} as unknown as Json;
  const row={slug:phone.slug,name:phone.name,brand:phone.brand,status:phone.active?'active' as const:'inactive' as const,display_order:phone.sortOrder||0,base_mockup_path:config.assets.base,case_overlay_path:config.assets.caseOverlay,highlight_overlay_path:config.assets.highlightOverlay,shadow_overlay_path:config.assets.shadowOverlay,print_mask_path:config.assets.printMask,camera_mask_path:config.assets.cameraMask,print_area:config.printArea as unknown as Json,safe_area:config.safeArea as unknown as Json,camera_exclusion:config.camera as unknown as Json,metadata};
  checked(prior?await db.from('phone_models').update(row).eq('id',prior.id):await db.from('phone_models').upsert(row,{onConflict:'slug'}));return;
 }
 if(type==='product'){
  const product=await sanity.fetch<(CmsProduct&{commerceId?:string})|null>(`*[_id==$id][0]{${productProjection.slice(1,-1)},commerceId}`,{id:cleanId},{cache:'no-store'});
  if(!product)throw new Error('Published product missing. Archive instead of deleting.');
  if(!product.slug||!product.name||!Number.isFinite(product.price)||product.price<0||!product.images?.length)throw new Error('Invalid published product.');
  const payload={...product,sanityId:cleanId,revision:product._rev,metadata:{style:product.designType||product.name,featured:!!product.featured,bestSeller:!!product.bestSeller,rank:product.rank||999,seoTitle:product.seo?.title||'',metaDescription:product.seo?.description||'',features:product.features||[],imageDevice:product.devices?.[0]||''}};
  checked(await db.rpc('publish_cms_product',{payload:payload as unknown as Json}));return;
 }
 if(type==='siteSettings'||type==='customizerSettings'){
  const content=await sanity.fetch<CmsSiteSettings&CmsCustomizer>(`*[_id==$id][0]`,{id:cleanId},{cache:'no-store'});
  if(!content)return;
  const row=checked(await db.from('store_settings').select('value').eq('key','storefront').maybeSingle()),settings={...(row?.value as object||{})};
  const next:Record<string,unknown>={...settings};
  if(type==='siteSettings'){if(content.shippingThreshold!==undefined)next.freeShippingThreshold=content.shippingThreshold;if(content.brandName)next.storeName=content.brandName;if(content.contactEmail)next.supportEmail=content.contactEmail;if(content.supportPhone)next.supportPhone=content.supportPhone}
  if(type==='customizerSettings'&&content.price!==undefined){next.customCasePrice=content.price;checked(await db.from('products').update({price:content.price}).eq('kind','custom'))}
  checked(await db.from('store_settings').upsert({key:'storefront',value:next as Json,is_public:true},{onConflict:'key'}));
 }
}
