import {notFound} from 'next/navigation';
import Shop from '@/components/Shop';
import JsonLd from '@/components/seo/JsonLd';
import {devices,products} from '@/lib/catalog';
import {pageMetadata} from '@/lib/seo/metadata';
import {breadcrumbSchema,collectionSchema} from '@/lib/seo/schemas';
export function generateStaticParams(){return [{brand:'iphone'},{brand:'samsung'}]}
export async function generateMetadata({params}:{params:Promise<{brand:string}>}){const {brand}=await params;const name=brand==='iphone'?'iPhone':'Samsung';return pageMetadata({title:`${name} Phone Cases | CASECLAN`,description:`Explore premium ready-design CASECLAN cases for supported ${name} phones.`,path:`/collections/${brand}/`})}
export default async function CollectionPage({params}:{params:Promise<{brand:string}>}){const {brand}=await params;if(!['iphone','samsung'].includes(brand))notFound();const name=brand==='iphone'?'iPhone':'Samsung',items=products.filter(product=>product.kind==='ready'&&product.devices.some(id=>devices.find(device=>device.slug===id)?.brand===name));return <><JsonLd data={[collectionSchema(`${name} Phone Cases`,`/collections/${brand}/`,items),breadcrumbSchema([{name:'Home',path:'/'},{name:`${name} Cases`,path:`/collections/${brand}/`}])]}/><Shop brand={name}/></>}
