import type { Metadata } from 'next';
import './globals.css';
import CmsProvider from '@/components/CmsProvider';
import {getCmsContent} from '@/lib/cms/server';
import './studio.css';
import './admin.css';
import StoreProvider from '@/components/StoreProvider';
import AuthProvider from '@/components/AuthProvider';
import Shell from '@/components/Shell';
import JsonLd from '@/components/seo/JsonLd';
import {siteConfig} from '@/lib/seo/config';
import {organizationSchema,websiteSchema} from '@/lib/seo/schemas';
const fallbackMetadata: Metadata = { metadataBase:new URL(siteConfig.url),title:{default:'Personalized Phone Covers & Custom Mobile Cases | CASECLAN',template:'%s | CASECLAN'},description:siteConfig.description,icons:{icon:'/favicon.svg'},alternates:{canonical:'/'},openGraph:{title:'Personalized Phone Covers & Custom Mobile Cases | CASECLAN',description:siteConfig.description,url:'/',siteName:'CASECLAN',type:'website',images:[{url:siteConfig.defaultImage,alt:'CASECLAN premium phone case'}]},twitter:{card:'summary_large_image',title:'Personalized Phone Covers & Custom Mobile Cases | CASECLAN',description:siteConfig.description,images:[siteConfig.defaultImage]}};
export async function generateMetadata():Promise<Metadata>{const settings=(await getCmsContent()).settings,seo=settings?.seo;return {...fallbackMetadata,title:seo?.title?{default:seo.title,template:'%s | '+(settings?.brandName||'CASECLAN')}:fallbackMetadata.title,description:seo?.description||fallbackMetadata.description,openGraph:{...fallbackMetadata.openGraph,title:seo?.title||'Personalized Phone Covers & Custom Mobile Cases | CASECLAN',description:seo?.description||siteConfig.description,images:seo?.image?.url?[seo.image.url]:[siteConfig.defaultImage]}}}
export default async function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { const content=await getCmsContent();return <html lang="en"><body><JsonLd data={[{...organizationSchema() as object,name:content.settings?.brandName||siteConfig.name,logo:content.settings?.logo?.url||`${siteConfig.url}/favicon.svg`},websiteSchema()]}/><CmsProvider content={content}><AuthProvider><StoreProvider><Shell>{children}</Shell></StoreProvider></AuthProvider></CmsProvider></body></html>; }

