import 'server-only';
import {draftMode} from 'next/headers';
import type {Product} from '@/lib/catalog';
import {findDesign} from '../designs';
import {getProductBySlug} from './server';
import {getPublishedCommerceProducts} from './commerce';
export async function getStorefrontProduct(slug:string){
 const [catalog,content,mode]=await Promise.all([getPublishedCommerceProducts(),getProductBySlug(slug),draftMode()]);
 const commerce=findDesign(catalog,slug);
 const preview=mode.isEnabled&&!!content;
 if(!commerce&&!preview)return null;
 const product=content?{...commerce,id:content.slug,name:content.name,description:content.description,shortDescription:content.shortDescription,material:content.material||commerce?.material||'Premium printed case',style:content.designType||commerce?.style||content.name,devices:content.devices,image:content.images?.[0]?.url,gallery:content.images?.slice(1).map(image=>image.url),price:preview?content.price:commerce!.price,compareAtPrice:preview?content.compareAtPrice:commerce?.compareAtPrice,kind:'ready',status:'active',colors:commerce?.colors||['Black'],clan:commerce?.clan||'NOIR',magsafe:commerce?.magsafe||false,rating:commerce?.rating||0,reviews:commerce?.reviews||0,collection:content.category||'Ready Designs',rank:content.rank||999,imageDevice:content.devices[0]||''} as Product:commerce!;
 return {product,seo:content?.seo,preview};
}
