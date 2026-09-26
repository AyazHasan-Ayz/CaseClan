import type {Metadata} from 'next';
import Link from 'next/link';
import {devices} from '@/lib/catalog';
import {pageMetadata} from '@/lib/seo/metadata';

export const metadata:Metadata=pageMetadata({title:'Sitemap | CASECLAN',description:'Browse CASECLAN shop, phone model, custom case, help, company and policy pages.',path:'/sitemap/'});
const groups=[
 {title:'SHOP',links:[['All Cases','/shop/'],['iPhone Cases','/collections/iphone/'],['Samsung Cases','/collections/samsung/'],['Design Your Own','/design-your-own-phone-case/']]},
 {title:'CUSTOM CASES',links:[['Personalized Phone Covers','/personalized-phone-covers/'],['Custom Photo Cases','/custom-photo-cases/'],['Design Your Own Phone Case','/design-your-own-phone-case/']]},
 {title:'HELP',links:[['FAQ','/faq/'],['Contact','/contact/'],['Track Order','/track-order/'],['Shipping','/shipping-policy/'],['Returns','/returns-policy/']]},
 {title:'COMPANY',links:[['About CaseClan','/about/']]},
 {title:'LEGAL',links:[['Privacy Policy','/privacy-policy/'],['Terms & Conditions','/terms/']]},
] as const;
export default function SitemapPage(){return <><div className="page-intro"><p className="eyebrow">EXPLORE CASECLAN</p><h1>Sitemap</h1><p>Every public part of CASECLAN, arranged for people.</p></div><section className="html-sitemap"><article><h2>POPULAR PHONE MODELS</h2><div>{devices.map(device=><Link key={device.slug} href={`/${device.slug}-cases/`}>{device.name} Cases</Link>)}</div><p className="small muted">Samsung model pages will appear as supported cases become available.</p></article>{groups.map(group=><article key={group.title}><h2>{group.title}</h2><div>{group.links.map(([label,href])=><Link key={href} href={href}>{label}</Link>)}</div></article>)}</section></>}
