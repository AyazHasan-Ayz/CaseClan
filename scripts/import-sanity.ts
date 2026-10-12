/** Additive import: never replaces existing Sanity documents or deletes Supabase data. */
import {createClient as createSanityClient} from '@sanity/client';
import {createClient as createSupabaseClient} from '@supabase/supabase-js';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {products,devices,assets} from '../lib/catalog.ts';
import {modelConfigs} from '../lib/mockups.ts';
import {designAssets,phoneAsset} from '../lib/assets.ts';
import {defaultHomepage,defaultSiteSettings,defaultCustomizer} from '../lib/cms/defaults.ts';
import {faqGroups} from '../lib/seo/content.ts';
async function main(){
const projectId=process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,dataset=process.env.NEXT_PUBLIC_SANITY_DATASET,token=process.env.SANITY_API_WRITE_TOKEN;
const dryRun=process.argv.includes('--dry-run');
if(!dryRun&&(!projectId||!dataset||!token))throw new Error('Set Sanity project, dataset and server-only write token before importing.');
const sanity=projectId&&dataset?createSanityClient({projectId,dataset,token,apiVersion:'2025-02-19',useCdn:false}):null;
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const db=url&&key?createSupabaseClient(url,key,{auth:{persistSession:false}}):null;
const result=db?await Promise.all([db.from('products').select('*').eq('status','active'),db.from('phone_models').select('*'),db.from('product_images').select('*'),db.from('product_phone_models').select('*'),db.from('store_settings').select('key,value').eq('is_public',true),db.from('reviews').select('*').eq('status','approved')]):null;
if(result?.some(r=>r.error))throw new Error('Supabase snapshot failed; refusing to import a stale catalog.');
const remoteProducts=result?.[0].data||[],remotePhones=result?.[1].data||[],images=result?.[2].data||[],mappings=result?.[3].data||[],settings=result?.[4].data?.find(r=>r.key==='storefront')?.value||{};
const cached=new Map<string,unknown>();
async function image(source:string,alt:string){
 if(dryRun)return {_type:'image',alt,source};
 if(cached.has(source))return {...cached.get(source) as object,alt};
 if(!sanity)throw new Error('Sanity unavailable');
 let bytes:Buffer;
 if(source.startsWith('/')){const local=path.resolve('public','.'+source);if(!local.startsWith(path.resolve('public')+path.sep))throw new Error('Invalid media path');bytes=await readFile(local)}else{
  const origin=new URL(source).origin;if(![url,'https://cdn.sanity.io'].includes(origin))throw new Error('Unapproved media host; review before import.');
  const response=await fetch(source,{redirect:'error'});if(!response.ok)throw new Error(`Image import failed (${response.status}).`);bytes=Buffer.from(await response.arrayBuffer());
 }
 if(bytes.length>20*1024*1024)throw new Error('Media exceeds 20 MB');
 const asset=await sanity.assets.upload('image',bytes,{filename:path.basename(source.split('?')[0])});const value={_type:'image',asset:{_type:'reference',_ref:asset._id}};cached.set(source,value);return {...value,alt};
}
const reference=(id:string)=>({_type:'reference',_ref:id});
const documents:Record<string,unknown>[]=[];
const phoneIds=new Map<string,string>();
for(const phone of remotePhones.length?remotePhones:devices){const slug=phone.slug,id=`phone-${slug}`,mockup=phone.metadata?.mockup||modelConfigs[slug];if(!mockup)throw new Error(`Missing accurate mockup: ${slug}`);phoneIds.set(slug,id);documents.push({_id:id,_type:'phoneModel',name:phone.name,slug:{_type:'slug',current:slug},brand:phone.brand,active:phone.status?phone.status==='active':phone.active!==false,sortOrder:phone.display_order??phone.displayOrder??0,mockup,image:await image(phone.metadata?.deviceImage||phoneAsset(slug),phone.name)})}
const categories=new Map<string,string>();for(const item of remoteProducts.length?remoteProducts:products){const title=item.collection||'Ready Designs',slug=title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),id=`category-${slug}`;if(!categories.has(title)){categories.set(title,id);documents.push({_id:id,_type:'category',title,slug:{_type:'slug',current:slug}})}}
for(const item of remoteProducts.length?remoteProducts:products){const seeded=products.find(p=>p.id===item.slug||p.id===item.id),slug=item.slug||item.id,id=`product-${item.slug?item.id:slug}`,metadata=item.metadata||{},urls=item.slug?images.filter(i=>i.product_id===item.id).sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)||a.sort_order-b.sort_order).map(i=>i.storage_path.startsWith('/')||i.storage_path.startsWith('https://')?i.storage_path:`${url}/storage/v1/object/public/product-images/${i.storage_path}`):[item.image||designAssets[item.style]||designAssets['Minimal Name'],...(item.gallery||[])];const phones=item.slug?mappings.filter(m=>m.product_id===item.id&&m.available).map(m=>remotePhones.find(p=>p.id===m.phone_model_id)?.slug).filter(Boolean):item.devices;
 documents.push({_id:id,_type:'product',commerceId:item.slug?item.id:undefined,name:item.name,slug:{_type:'slug',current:slug},category:reference(categories.get(item.collection||'Ready Designs')!),kind:item.kind,status:item.status||'active',price:item.price,compareAtPrice:item.compare_at_price??item.compareAtPrice,images:await Promise.all(urls.map((source:string)=>image(source,item.name))),phones:phones.map((slug:string)=>reference(phoneIds.get(slug)!)),description:item.description,shortDescription:item.short_description??item.shortDescription,material:item.material,designType:metadata.style||seeded?.style||item.name,bestSeller:metadata.bestSeller??item.bestSeller,featured:metadata.featured??item.featured,rank:metadata.rank??item.rank,seo:{title:metadata.seoTitle||item.seoTitle,description:metadata.metaDescription||item.metaDescription}})
}
const home={...defaultHomepage,hero:{...defaultHomepage.hero,image:await image(assets.hero,'CASECLAN lifestyle hero')},customBanner:{...defaultHomepage.customBanner,image:await image(designAssets['Word Cloud'],'CASECLAN custom artwork')},devices:[...phoneIds.values()].map(reference)};
documents.push({_id:'homepage',_type:'homepage',...home},{_id:'siteSettings',_type:'siteSettings',...defaultSiteSettings,brandName:settings.storeName||'CASECLAN',contactEmail:settings.supportEmail||'',supportPhone:settings.supportPhone||'',shippingThreshold:settings.freeShippingThreshold??999},{_id:'customizerSettings',_type:'customizerSettings',...defaultCustomizer,price:settings.customCasePrice??products.find(p=>p.kind==='custom')?.price});
for(const [groupIndex,group] of faqGroups.entries())for(const [index,[question,answer]] of group.items.entries())documents.push({_id:`faq-${groupIndex}-${index}`,_type:'faq',question,answer,category:group.title,active:true,sortOrder:groupIndex*100+index,placements:['faq']});
for(const review of result?.[5].data||[])documents.push({_id:`review-${review.id}`,_type:'review',customer:'Verified customer',rating:review.rating,text:review.body||review.title,verified:review.verified_purchase,active:true,product:reference(`product-${review.product_id}`)});
function keys(value:unknown):unknown{if(Array.isArray(value))return value.map((item,index)=>item&&typeof item==='object'?{...keys(item) as object,_key:`item-${index}`} :item);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k,keys(v)]));return value}
console.log(`Prepared ${documents.length} documents from ${remoteProducts.length?'remote Supabase':'existing fallback'} catalog. Mode: ${dryRun?'dry-run':'additive import'}.`);
if(!dryRun&&sanity){for(const document of documents)await sanity.createIfNotExists(keys(document) as {_id:string;_type:string});console.log('Import finished. Existing CMS documents were preserved.');}

}
main().catch(error=>{console.error(error instanceof Error?error.message:"Import failed");process.exitCode=1});
