import {notFound} from 'next/navigation';
import {products} from '@/lib/catalog';
import ProductDetail from '@/components/ProductDetail';
export function generateStaticParams(){return products.map(p=>({id:p.id}))}
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;const p=products.find(p=>p.id===id);return {title:p?p.name:'Case not found',description:p?`Explore ${p.name} with your own identity. Premium ${p.material.toLowerCase()} case design for flagship phones.`:'',openGraph:{title:p?`${p.name} | CASECLAN`:'CASECLAN',description:p?`${p.collection}. ${p.colors[0]}. A considered case for your flagship.`:''}}}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const p=products.find(p=>p.id===id);if(!p)notFound();return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'Product',name:`CASECLAN ${p.name}`,brand:{'@type':'Brand',name:'CASECLAN'},description:`Concept ${p.material} case in ${p.colors[0]}. Product not yet available for sale.`,sku:p.id,color:p.colors[0],material:p.material})}}/><ProductDetail product={p} key={p.id} upload={p.kind==='upload'}/></>}

