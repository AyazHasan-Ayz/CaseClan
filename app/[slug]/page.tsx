import {notFound} from 'next/navigation';
import {devices,products} from '@/lib/catalog';
import Customizer from '@/components/Customizer';
import {CartPage,SearchPage} from '@/components/UtilityPages';
import Shop from '@/components/Shop';
import InfoPages from '@/components/InfoPages';
import Account,{Wishlist,Checkout} from '@/components/Account';
const pages=['sustainability','careers','press','cart','search','personalized','ready-designs','custom-upload','coming-soon','shop','iphone','samsung','new-drops','devices','clans','collections','our-story','faqs','size-guide','track-order','returns','contact','privacy','wishlist','account','checkout'];
export function generateStaticParams(){return [...pages,...devices.map(d=>d.slug)].map(slug=>({slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const device=devices.find(d=>d.slug===slug);const title=device?`${device.name} Cases`:slug.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join(' ');return {title,description:`${title}. Discover CASECLAN premium phone cases and make it your own.`,openGraph:{title:`${title} | CASECLAN`,description:`Explore ${title.toLowerCase()} at CASECLAN.`}}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(devices.some(d=>d.slug===slug))return <Shop device={slug}/>;if(slug==='shop')return <Shop/>;if(slug==='cart')return <CartPage/>;if(slug==='search')return <SearchPage/>;if(slug==='iphone'||slug==='samsung')return <Shop brand={slug==='iphone'?'iPhone':'Samsung'}/>;if(slug==='new-drops'||slug==='personalized'||slug==='collections')return <Shop kind="personalized"/>;if(slug==='ready-designs')return <Shop kind="ready"/>;if(slug==='custom-upload')return <Customizer upload/>;if(slug==='account')return <Account/>;if(slug==='wishlist')return <Wishlist/>;if(slug==='checkout')return <Checkout/>;if(!pages.includes(slug))notFound();return <InfoPages slug={slug}/>}
