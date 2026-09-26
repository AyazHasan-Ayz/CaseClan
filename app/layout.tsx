import type { Metadata } from 'next';
import './globals.css';
import './studio.css';
import StoreProvider from '@/components/StoreProvider';
import Shell from '@/components/Shell';
import JsonLd from '@/components/seo/JsonLd';
import {siteConfig} from '@/lib/seo/config';
import {organizationSchema,websiteSchema} from '@/lib/seo/schemas';
export const metadata: Metadata = { metadataBase:new URL(siteConfig.url),title:{default:'Personalized Phone Covers & Custom Mobile Cases | CASECLAN',template:'%s | CASECLAN'},description:siteConfig.description,icons:{icon:'/favicon.svg'},alternates:{canonical:'/'},openGraph:{title:'Personalized Phone Covers & Custom Mobile Cases | CASECLAN',description:siteConfig.description,url:'/',siteName:'CASECLAN',type:'website',images:[{url:siteConfig.defaultImage,alt:'CASECLAN premium phone case'}]},twitter:{card:'summary_large_image',title:'Personalized Phone Covers & Custom Mobile Cases | CASECLAN',description:siteConfig.description,images:[siteConfig.defaultImage]}};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body><JsonLd data={[organizationSchema(),websiteSchema()]}/><StoreProvider><Shell>{children}</Shell></StoreProvider></body></html>; }
