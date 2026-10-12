import {notFound} from 'next/navigation';
import {products,productImage} from '@/lib/catalog';
import {activeDesigns,productSlug} from '@/lib/designs';
import ProductDetail from '@/components/ProductDetail';
import JsonLd from '@/components/seo/JsonLd';
import {cmsMetadata} from '@/lib/cms/metadata';
import {getStorefrontProduct} from '@/lib/cms/product';
import {breadcrumbSchema,productSchema} from '@/lib/seo/schemas';
export function generateStaticParams(){return activeDesigns(products).map(p=>({id:productSlug(p)}))}
export async function generateMetadata({params}:{params:Promise<{id:string}>}){
 const {id}=await params,result=await getStorefrontProduct(id);
 return cmsMetadata(result?.seo,{title:result?`${result.product.name} | CASECLAN`:'Case Not Found | CASECLAN',description:result?.product.description||'Shop premium CASECLAN ready designs, fitted to your phone.',path:`/product/${id}/`,image:result?productImage(result.product):undefined});
}
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params,result=await getStorefrontProduct(id);if(!result)notFound();const {product,preview}=result;
 return <><JsonLd data={[productSchema(product),breadcrumbSchema([{name:'Home',path:'/'},{name:'Ready Designs',path:'/ready-designs/'},{name:product.name,path:`/product/${id}/`}])]}/><ProductDetail product={product} preview={preview} key={product.id}/></>;
}
