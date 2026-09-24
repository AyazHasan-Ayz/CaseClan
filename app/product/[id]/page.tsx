import {notFound} from 'next/navigation';
import {products} from '@/lib/catalog';
import ProductDetail from '@/components/ProductDetail';
export function generateStaticParams(){return products.filter(p=>p.kind==='ready').map(p=>({id:p.id}))}
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;const p=products.find(p=>p.id===id&&p.kind==='ready');return {title:p?p.name:'Case not found',description:p?`Shop the fixed ${p.name} artwork on a premium ${p.material.toLowerCase()} for compatible flagship phones.`:'',openGraph:{title:p?`${p.name} | CASECLAN`:'CASECLAN',description:p?`${p.collection}. Fixed artwork, made for your selected phone.`:''}}}
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const p=products.find(p=>p.id===id&&p.kind==='ready');if(!p)notFound();return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'Product',name:`CASECLAN ${p.name}`,brand:{'@type':'Brand',name:'CASECLAN'},description:`Fixed ${p.material} design in ${p.colors[0]} for compatible flagship phones.`,sku:p.id,color:p.colors[0],material:p.material})}}/><ProductDetail product={p} key={p.id}/></>}

