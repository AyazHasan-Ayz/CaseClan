import type {MetadataRoute} from 'next';
import {absoluteUrl,siteConfig} from '../lib/seo/config.ts';
export const dynamic='force-static';

export default function robots():MetadataRoute.Robots{return {
  rules:{userAgent:'*',allow:'/',disallow:['/admin','/admin/','/account','/account/','/checkout','/checkout/','/cart','/cart/','/order-success/','/api/','/login','/login/','/wishlist','/wishlist/','/search','/search/','/track-order','/track-order/']},
  sitemap:absoluteUrl('/sitemap.xml'),host:siteConfig.url,
}}
