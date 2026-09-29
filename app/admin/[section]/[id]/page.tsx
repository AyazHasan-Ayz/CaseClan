import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import AdminApp from '@/components/AdminApp';
import {products} from '@/lib/catalog';
export const metadata:Metadata={title:'Admin | CASECLAN',robots:{index:false,follow:false}};
export function generateStaticParams(){return [{section:'products',id:'new'},{section:'products',id:'product'},{section:'orders',id:'order'},...products.map(product=>({section:'products',id:product.id}))]}
export default async function AdminDetailPage({params}:{params:Promise<{section:string;id:string}>}){const{section,id}=await params;if(!['products','orders'].includes(section))notFound();return <AdminApp section={section} id={id}/>}
