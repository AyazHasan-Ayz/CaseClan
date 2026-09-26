import {notFound} from 'next/navigation';
import {products,productImage} from '@/lib/catalog';
import ProductDetail from '@/components/ProductDetail';
import JsonLd from '@/components/seo/JsonLd';
import {pageMetadata} from '@/lib/seo/metadata';
import {breadcrumbSchema,productSchema} from '@/lib/seo/schemas';

export function generateStaticParams(){return products.filter(product=>product.kind==='ready').map(product=>({id:product.id}))}
export async function generateMetadata({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const product=products.find(item=>item.id===id&&item.kind==='ready');
  if(!product)return pageMetadata({title:'Case Not Found | CASECLAN',description:'The requested CASECLAN case could not be found.',path:`/product/${id}/`,index:false});
  return pageMetadata({title:`${product.name} for iPhone 15–17 Series | CASECLAN`,description:`Shop the fixed ${product.name} artwork on a ${product.material.toLowerCase()} compatible with supported iPhone 15, 16 and 17 models.`,path:`/product/${product.id}/`,image:productImage(product)});
}
export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const product=products.find(item=>item.id===id&&item.kind==='ready');if(!product)notFound();
  return <><JsonLd data={[productSchema(product),breadcrumbSchema([{name:'Home',path:'/'},{name:'Ready Designs',path:'/ready-designs/'},{name:product.name,path:`/product/${product.id}/`}])]}/><ProductDetail product={product} key={product.id}/></>;
}
