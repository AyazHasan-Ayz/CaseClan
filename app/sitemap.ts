import type {MetadataRoute} from 'next';
import {devices,products} from '../lib/catalog.ts';
import {activeDesigns,productSlug} from '../lib/designs.ts';
import {absoluteUrl} from '../lib/seo/config.ts';
export const dynamic='force-static';
export const revalidate=60;

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  let catalog=products,phones=devices.map(d=>d.slug),posts:string[]=[];
  if(process.env.NEXT_PUBLIC_SUPABASE_URL){catalog=await (await import('../lib/cms/commerce')).getPublishedCommerceProducts()}
  if(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID){const cms=await import('../lib/cms/server');const models=await cms.getPhoneModels();if(models.length)phones=models.map(d=>d.slug);posts=(await cms.getBlogPosts()).map(p=>`/blog/${p.slug}/`)}
  const core=['/','/shop/','/ready-designs/','/personalized-phone-covers/','/custom-phone-cases/','/custom-photo-cases/','/design-your-own-phone-case/','/devices/','/collections/iphone/','/collections/samsung/','/about/','/contact/','/faq/','/shipping-policy/','/returns-policy/','/privacy-policy/','/terms/','/sitemap/','/blog/'];
  const routes=[...core,...phones.map(slug=>`/${slug}-cases/`),...posts,...activeDesigns(catalog).map(product=>`/product/${productSlug(product)}/`)];
  return routes.map((path)=>({url:absoluteUrl(path),changeFrequency:path==='/'?'weekly':'monthly',priority:path==='/'?1:path.startsWith('/product/')?.8:.7}));
}
