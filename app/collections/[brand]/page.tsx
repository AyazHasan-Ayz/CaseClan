import {notFound} from 'next/navigation';
import Shop from '@/components/Shop';
export function generateStaticParams(){return [{brand:'iphone'},{brand:'samsung'}]}
export async function generateMetadata({params}:{params:Promise<{brand:string}>}){const {brand}=await params;const name=brand==='iphone'?'iPhone':'Samsung';return {title:`${name} Cases`,description:`Explore CASECLAN personalized covers for ${name}.`}}
export default async function CollectionPage({params}:{params:Promise<{brand:string}>}){const {brand}=await params;if(!['iphone','samsung'].includes(brand))notFound();return <Shop brand={brand==='iphone'?'iPhone':'Samsung'}/>}
