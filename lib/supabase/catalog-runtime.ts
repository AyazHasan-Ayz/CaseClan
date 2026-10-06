'use client';

import type {AdminData,Coupon,Review} from '@/lib/admin';
import type {Device,Product} from '@/lib/catalog';
import {createSupabaseBrowserClient} from './client';
import type {Json} from './types';

type JsonObject=Record<string,Json|undefined>;
const objectValue=(value:Json|undefined):JsonObject=>value&&typeof value==='object'&&!Array.isArray(value)?value as JsonObject:{};
const stringArray=(value:Json|undefined,fallback:string[])=>Array.isArray(value)&&value.every(item=>typeof item==='string')?value as string[]:fallback;

function publicImage(path:string){
 if(!path||path.startsWith('/')||path.startsWith('data:')||/^https?:\/\//i.test(path))return path;
 return createSupabaseBrowserClient().storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

async function fetchCatalog(fallback:AdminData,admin:boolean):Promise<AdminData>{
 const client=createSupabaseBrowserClient();
 const productsQuery=client.from('products').select('*').order('created_at');
 const modelsQuery=client.from('phone_models').select('*').order('display_order');
 const mappingsQuery=client.from('product_phone_models').select('*');
 const settingsQuery=client.from('store_settings').select('key,value,is_public');
 const reviewsQuery=client.from('reviews').select('*').order('created_at',{ascending:false});
 const [productsResult,modelsResult,mappingsResult,imagesResult,settingsResult,reviewsResult,couponsResult]=await Promise.all([
  admin?productsQuery:productsQuery.eq('status','active'),
  admin?modelsQuery:modelsQuery.eq('status','active'),
  admin?mappingsQuery:mappingsQuery.eq('available',true),
  client.from('product_images').select('*').order('sort_order'),
  admin?settingsQuery:settingsQuery.eq('is_public',true),
  admin?reviewsQuery:reviewsQuery.eq('status','approved'),
  admin?client.from('coupons').select('*').order('created_at',{ascending:false}):Promise.resolve({data:[],error:null}),
 ]);
 const error=productsResult.error||modelsResult.error||mappingsResult.error||imagesResult.error||settingsResult.error||reviewsResult.error||couponsResult.error;
 if(error)throw error;

 const fallbackProducts=new Map(fallback.products.map(product=>[product.id,product]));
 const fallbackDevices=new Map(fallback.devices.map(device=>[device.slug,device]));
 const modelSlugById=new Map((modelsResult.data||[]).map(model=>[model.id,model.slug]));
 const mappingsByProduct=new Map<string,typeof mappingsResult.data>();
 for(const mapping of mappingsResult.data||[])mappingsByProduct.set(mapping.product_id,[...(mappingsByProduct.get(mapping.product_id)||[]),mapping]);
 const imagesByProduct=new Map<string,string[]>();
 for(const image of imagesResult.data||[])imagesByProduct.set(image.product_id,[...(imagesByProduct.get(image.product_id)||[]),publicImage(image.storage_path)]);
 const reviewsByProduct=new Map<string,typeof reviewsResult.data>();
 for(const review of reviewsResult.data||[])reviewsByProduct.set(review.product_id,[...(reviewsByProduct.get(review.product_id)||[]),review]);

 const remoteDevices:Device[]=(modelsResult.data||[]).map(model=>{const existing=fallbackDevices.get(model.slug),metadata=objectValue(model.metadata),storedMockup=objectValue(metadata.mockup);return{name:model.name,slug:model.slug,brand:model.brand,image:existing?.image??model.display_order,active:model.status==='active',available:metadata.available!==false,displayOrder:model.display_order,mockup:Object.keys(storedMockup).length?storedMockup as unknown as Device['mockup']:existing?.mockup};});
 const remoteProducts:Product[]=(productsResult.data||[]).map(row=>{
  const existing=fallbackProducts.get(row.slug),metadata=objectValue(row.metadata),mappings=mappingsByProduct.get(row.id)||[],compatibleDevices=mappings.filter(mapping=>mapping.available).map(mapping=>modelSlugById.get(mapping.phone_model_id)).filter((slug):slug is string=>!!slug),images=imagesByProduct.get(row.id)||[],reviews=reviewsByProduct.get(row.id)||[],rating=reviews.length?reviews.reduce((sum,review)=>sum+review.rating,0)/reviews.length:0;
  const modelPrices=Object.fromEntries(mappings.map(mapping=>[modelSlugById.get(mapping.phone_model_id),mapping.price_override]).filter((entry):entry is [string,number]=>typeof entry[0]==='string'&&typeof entry[1]==='number'));
  return{id:row.slug,name:row.name,price:Number(row.price),clan:(typeof metadata.clan==='string'?metadata.clan:existing?.clan||'NOIR') as Product['clan'],devices:compatibleDevices,colors:stringArray(metadata.colors,existing?.colors||['Black']),material:row.material||existing?.material||'Premium printed case',style:typeof metadata.style==='string'?metadata.style:existing?.style||row.name,magsafe:metadata.magsafe===true,rating,reviews:reviews.length,collection:row.collection||existing?.collection||'Ready Designs',rank:typeof metadata.rank==='number'?metadata.rank:existing?.rank||999,imageDevice:typeof metadata.imageDevice==='string'?metadata.imageDevice:existing?.imageDevice||compatibleDevices[0]||remoteDevices[0]?.slug||'',kind:row.kind,image:images[0]||existing?.image,gallery:images.slice(1),sku:row.sku||undefined,compareAtPrice:row.compare_at_price==null?undefined:Number(row.compare_at_price),costPrice:row.cost_price==null?undefined:Number(row.cost_price),shortDescription:row.short_description||undefined,description:row.description||undefined,status:row.status,featured:metadata.featured===true,bestSeller:metadata.bestSeller===true,newArrival:metadata.newArrival===true,seoTitle:typeof metadata.seoTitle==='string'?metadata.seoTitle:undefined,metaDescription:typeof metadata.metaDescription==='string'?metadata.metaDescription:undefined,createdAt:row.created_at,modelPrices};
 });
 const publicSettings=Object.fromEntries((settingsResult.data||[]).map(setting=>[setting.key,setting.value]));
 const coupons:Coupon[]=(couponsResult.data||[]).map(row=>{const metadata=objectValue(row.metadata);return{id:row.id,code:row.code,kind:row.discount_type,value:Number(row.value),minimum:Number(row.minimum_cart_value),maximum:typeof metadata.maximum_discount==='number'?metadata.maximum_discount:undefined,usageLimit:row.usage_limit||undefined,startsAt:row.starts_at||'',endsAt:row.ends_at||'',active:row.active};});
 const reviews:Review[]=(reviewsResult.data||[]).map(row=>({id:row.id,productId:(productsResult.data||[]).find(product=>product.id===row.product_id)?.slug||row.product_id,customer:'Verified customer',rating:row.rating,text:row.body||row.title||'',status:row.status,verified:row.verified_purchase,createdAt:row.created_at}));
 const derivedMedia=remoteProducts.flatMap(product=>[product.image,...(product.gallery||[])].filter((url):url is string=>!!url).map((url,index)=>({id:`${product.id}-${index}`,name:index?`${product.name} gallery ${index}`:product.name,url,kind:'product' as const,createdAt:product.createdAt||''})));
 const savedMedia=Array.isArray(publicSettings.media_library)?publicSettings.media_library.filter(item=>item&&typeof item==='object'&&!Array.isArray(item)).map(item=>item as unknown as AdminData['media'][number]):[];
 return{...fallback,products:remoteProducts,devices:remoteDevices,coupons:admin?coupons:fallback.coupons,reviews,settings:{...fallback.settings,...(objectValue(publicSettings.storefront) as Partial<AdminData['settings']>)},media:admin?[...savedMedia,...derivedMedia.filter(item=>!savedMedia.some(saved=>saved.url===item.url))]:derivedMedia};
}

export const fetchRemoteCatalog=(fallback:AdminData)=>fetchCatalog(fallback,false);
export const fetchRemoteAdminCatalog=(fallback:AdminData)=>fetchCatalog(fallback,true);
