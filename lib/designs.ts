import {designs,type CaseDesign} from '../data/designs.ts';
import type {Product} from './catalog.ts';

export const phoneSlug=(phone:string)=>phone.trim().toLowerCase().replace(/\s+/g,'-');
export const productSlug=(product:Product)=>product.slug||product.id;
export function designToProduct(design:CaseDesign,index=0):Product{
 const compatible=design.compatiblePhones.map(phoneSlug);
 return {id:design.id,slug:design.slug,name:design.name,shortDescription:design.shortDescription,description:design.description,price:design.price,compareAtPrice:design.compareAtPrice,image:design.images[0],gallery:design.images.slice(1),collection:design.category,tags:[...design.tags],devices:compatible,featured:design.featured,bestSeller:design.bestSeller,status:design.active?'active':'archived',createdAt:design.createdAt,kind:'ready',style:design.style||design.category,clan:'NOIR',colors:['Black'],material:design.material||'Premium printed case',magsafe:false,rating:0,reviews:0,rank:index+1,imageDevice:design.imageDevice||compatible[0]||'',sku:`CC-${design.id.toUpperCase()}`};
}
export const getFileDesignProducts=()=>designs.map(designToProduct);

/** One catalog boundary: local additions survive refreshes; existing admin products remain authoritative. */
export function resolveDesignCatalog(remote:Product[],source:CaseDesign[]=designs):Product[]{
 const byId=new Map(remote.map(product=>[product.id,product]));
 for(const [index,design] of source.entries()){
  const product=designToProduct(design,index),existing=byId.get(design.id);
  if(existing&&design.managedRemotely){byId.set(design.id,{...product,...existing,slug:existing.slug||design.slug,tags:existing.tags||design.tags,...(!design.active?{status:'archived' as const}:{})});}
  else if(!design.managedRemotely)byId.set(design.id,product);
 }
 return [...byId.values()];
}
export const activeDesigns=(catalog:Product[])=>catalog.filter(p=>p.kind==='ready'&&p.status==='active');
export const newestDesigns=(catalog:Product[])=>activeDesigns(catalog).sort((a,b)=>(Date.parse(b.createdAt||'')||0)-(Date.parse(a.createdAt||'')||0)||productSlug(a).localeCompare(productSlug(b)));
export const bestSellerDesigns=(catalog:Product[])=>newestDesigns(catalog).filter(p=>p.bestSeller===true);
export const featuredDesigns=(catalog:Product[])=>newestDesigns(catalog).filter(p=>p.featured===true);
export const findDesign=(catalog:Product[],slug:string)=>activeDesigns(catalog).find(p=>productSlug(p)===slug||p.id===slug);
export function searchDesigns(catalog:Product[],query:string){const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);return newestDesigns(catalog).filter(p=>terms.every(term=>[p.name,p.shortDescription||'',p.description||'',p.style,p.collection,...(p.tags||[]),...p.devices.map(slug=>slug.replaceAll('-',' '))].join(' ').toLowerCase().includes(term)));}
