import {notFound} from 'next/navigation';
import {devices,products} from '@/lib/catalog';
import {CartPage,SearchPage} from '@/components/UtilityPages';
import Shop from '@/components/Shop';
import InfoPages from '@/components/InfoPages';
import Account,{Wishlist,Checkout,Login} from '@/components/Account';
import {AboutPage,FAQPage,PolicyPage,TrackOrderPage,ContactPage} from '@/components/CustomerPages';
import SeoLanding,{isSeoLanding} from '@/components/SeoLanding';
import JsonLd from '@/components/seo/JsonLd';
import {faqGroups} from '@/lib/seo/content';
import {pageMetadata} from '@/lib/seo/metadata';
import {breadcrumbSchema,collectionSchema,faqSchema,pageSchema} from '@/lib/seo/schemas';

const pages=['sustainability','careers','press','cart','search','personalized','ready-designs','custom-upload','coming-soon','shop','iphone','samsung','new-drops','devices','clans','collections','our-story','about','faq','faqs','size-guide','track-order','returns','returns-policy','shipping-policy','contact','privacy','privacy-policy','terms','wishlist','login','account','checkout','design-your-own','personalized-phone-covers','custom-phone-cases','custom-photo-cases','design-your-own-phone-case'];
const privatePages=new Set(['cart','search','track-order','wishlist','login','account','checkout']);
const seoTitles:Record<string,[string,string,string]>= {
 shop:['Phone Cases & Ready Designs | CASECLAN','Shop premium CASECLAN phone cases with fixed artwork for supported flagship phones.','/shop/'],
 'ready-designs':['Ready-Design Phone Cases | CASECLAN','Shop curated CASECLAN artwork exactly as shown, fitted to your selected phone model.','/ready-designs/'],
 about:['About CASECLAN | Premium Phone Cases','Learn about CASECLAN ready designs, custom creativity and the premium phone-case experience.','/about/'],
 contact:['Contact CASECLAN | Customer Support','Contact CASECLAN for order help, phone compatibility and custom artwork questions.','/contact/'],
 faq:['Phone Case FAQs | CASECLAN','Answers about CASECLAN orders, custom cases, phone models, payments, shipping and returns.','/faq/'],
 'shipping-policy':['Shipping & Delivery Policy | CASECLAN','Read the CASECLAN shipping, tracking, delivery and address guidance.','/shipping-policy/'],
 'returns-policy':['Returns, Refunds & Replacements | CASECLAN','Read the CASECLAN returns, refunds, damage and replacement policy structure.','/returns-policy/'],
 'privacy-policy':['Privacy Policy | CASECLAN','Learn how the CASECLAN storefront handles browser data, demo orders and uploaded artwork.','/privacy-policy/'],
 terms:['Terms & Conditions | CASECLAN','Read the CASECLAN website, product, ordering and user-uploaded artwork terms.','/terms/'],
 'personalized-phone-covers':['Personalized Phone Covers | CASECLAN','Explore premium personalized phone covers and create a case around your own ideas.','/personalized-phone-covers/'],
 'custom-phone-cases':['Custom Phone Cases | CASECLAN','Choose your phone and create a custom case from a blank model-specific canvas.','/custom-phone-cases/'],
 'custom-photo-cases':['Custom Photo Cases | CASECLAN','Upload and position an original photograph on a custom CASECLAN phone case.','/custom-photo-cases/'],
 'design-your-own-phone-case':['Design Your Own Phone Case | CASECLAN','Choose your phone model and build an original custom case in the CASECLAN editor.','/design-your-own-phone-case/'],
};

export function generateStaticParams(){return [...pages,...devices.flatMap(device=>[device.slug,`${device.slug}-cases`])].map(slug=>({slug}))}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const directDevice=devices.find(device=>device.slug===slug),caseDevice=devices.find(device=>`${device.slug}-cases`===slug);
 if(caseDevice)return pageMetadata({title:`${caseDevice.name} Cases | CASECLAN`,description:`Shop premium CASECLAN cases compatible with ${caseDevice.name}, including ready designs and custom options.`,path:`/${slug}/`});
 if(directDevice)return pageMetadata({title:`${directDevice.name} Cases | CASECLAN`,description:`Explore CASECLAN cases compatible with ${directDevice.name}.`,path:`/${directDevice.slug}-cases/`,index:false});
 if(privatePages.has(slug))return pageMetadata({title:`${slug.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ')} | CASECLAN`,description:`CASECLAN ${slug.replaceAll('-',' ')}.`,path:`/${slug}/`,index:false});
 if(seoTitles[slug]){const [title,description,path]=seoTitles[slug];return pageMetadata({title,description,path});}
 if(slug==='design-your-own'||slug==='custom-upload')return pageMetadata({title:'Design Your Own Phone Case | CASECLAN',description:'Choose your phone and begin with a blank CASECLAN custom case.',path:'/design-your-own-phone-case/',index:false});
 if(slug==='iphone'||slug==='samsung'){const name=slug==='iphone'?'iPhone':'Samsung';return pageMetadata({title:`${name} Phone Cases | CASECLAN`,description:`Explore CASECLAN cases for ${name} phones.`,path:`/collections/${slug}/`,index:false});}
 const title=slug.split('-').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ');
 return pageMetadata({title:`${title} | CASECLAN`,description:`Explore ${title.toLowerCase()} at CASECLAN.`,path:`/${slug}/`,index:!['personalized','new-drops','collections','our-story','faqs','returns','privacy'].includes(slug)});
}

export default async function Page({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const directDevice=devices.find(device=>device.slug===slug),caseDevice=devices.find(device=>`${device.slug}-cases`===slug),device=caseDevice||directDevice;
 if(device){const path=`/${device.slug}-cases/`,items=products.filter(product=>product.kind==='ready'&&product.devices.includes(device.slug));return <><JsonLd data={[collectionSchema(`${device.name} Cases`,path,items),breadcrumbSchema([{name:'Home',path:'/'},{name:'iPhone Cases',path:'/collections/iphone/'},{name:`${device.name} Cases`,path}])]}/><Shop device={device.slug}/></>}
 if(slug==='shop'||slug==='new-drops'||slug==='personalized'||slug==='collections'||slug==='ready-designs'){const path=slug==='ready-designs'?'/ready-designs/':'/shop/',items=products.filter(product=>product.kind==='ready');return <><JsonLd data={[collectionSchema(slug==='ready-designs'?'Ready-Design Phone Cases':'All Phone Cases',path,items),breadcrumbSchema([{name:'Home',path:'/'},{name:slug==='ready-designs'?'Ready Designs':'Shop',path}])]}/><Shop kind="ready"/></>}
 if(slug==='cart')return <CartPage/>;if(slug==='search')return <SearchPage/>;
 if(slug==='iphone'||slug==='samsung'){const name=slug==='iphone'?'iPhone':'Samsung',items=products.filter(product=>product.kind==='ready'&&product.devices.some(id=>devices.find(item=>item.slug===id)?.brand===name));return <><JsonLd data={[collectionSchema(`${name} Phone Cases`,`/collections/${slug}/`,items),breadcrumbSchema([{name:'Home',path:'/'},{name:`${name} Cases`,path:`/collections/${slug}/`}])]}/><Shop brand={name}/></>}
 if(slug==='custom-upload'||slug==='design-your-own')return <InfoPages slug="design-your-own"/>;
 if(isSeoLanding(slug))return <SeoLanding slug={slug}/>;
 if(slug==='login')return <Login/>;if(slug==='account')return <Account/>;if(slug==='wishlist')return <Wishlist/>;if(slug==='checkout')return <Checkout/>;
 if(slug==='about'||slug==='our-story')return <><JsonLd data={pageSchema('AboutPage','About CASECLAN','/about/','CASECLAN creates premium ready-design and custom phone cases.')}/><AboutPage/></>;
 if(slug==='faq'||slug==='faqs')return <><JsonLd data={faqSchema(faqGroups)}/><FAQPage/></>;
 if(slug==='track-order')return <TrackOrderPage/>;
 if(slug==='contact')return <><JsonLd data={pageSchema('ContactPage','Contact CASECLAN','/contact/','Contact CASECLAN for order, compatibility and custom artwork help.')}/><ContactPage/></>;
 if(slug==='shipping-policy'||slug==='returns-policy'||slug==='privacy-policy'||slug==='terms')return <PolicyPage slug={slug}/>;
 if(!pages.includes(slug))notFound();return <InfoPages slug={slug}/>;
}
