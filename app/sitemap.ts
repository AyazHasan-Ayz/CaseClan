import type {MetadataRoute} from 'next';
import {devices,products} from '../lib/catalog.ts';
import {absoluteUrl} from '../lib/seo/config.ts';
export const dynamic='force-static';

export default function sitemap():MetadataRoute.Sitemap{
  const core=['/','/shop/','/ready-designs/','/personalized-phone-covers/','/custom-phone-cases/','/custom-photo-cases/','/design-your-own-phone-case/','/devices/','/collections/iphone/','/collections/samsung/','/about/','/contact/','/faq/','/shipping-policy/','/returns-policy/','/privacy-policy/','/terms/','/sitemap/'];
  const routes=[...core,...devices.map(device=>`/${device.slug}-cases/`),...products.filter(product=>product.kind==='ready').map(product=>`/product/${product.id}/`)];
  return routes.map((path)=>({url:absoluteUrl(path),changeFrequency:path==='/'?'weekly':'monthly',priority:path==='/'?1:path.startsWith('/product/')?.8:.7}));
}
