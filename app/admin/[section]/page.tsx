import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import AdminApp from '@/components/AdminApp';
const sections=['dashboard','orders','products','custom-designs','phone-models','customers','inventory','coupons','reviews','fulfilment','media','settings'];
export const metadata:Metadata={title:'Admin | CASECLAN',robots:{index:false,follow:false}};
export function generateStaticParams(){return sections.map(section=>({section}))}
export default async function AdminSectionPage({params}:{params:Promise<{section:string}>}){const{section}=await params;if(!sections.includes(section))notFound();return <AdminApp section={section}/>}
