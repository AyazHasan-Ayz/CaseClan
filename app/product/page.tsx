import ProductDetail from '@/components/ProductDetail';
import {getStorefrontProduct} from '@/lib/cms/product';
import {cmsMetadata} from '@/lib/cms/metadata';
import {notFound} from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import {productSchema} from '@/lib/seo/schemas';
import {productSlug} from '@/lib/designs';
type Props={searchParams:Promise<{id?:string}>};
export async function generateMetadata({searchParams}:Props){const {id}=await searchParams,result=id?await getStorefrontProduct(id):null;return cmsMetadata(result?.seo,{title:result?.product.name||'Case | CASECLAN',description:result?.product.description||'Premium CASECLAN ready designs.',path:result?`/product/${productSlug(result.product)}/`:'/product/'});}
export default async function Page({searchParams}:Props){const {id}=await searchParams,result=id?await getStorefrontProduct(id):null;if(!result)notFound();return <><JsonLd data={productSchema(result.product)}/><ProductDetail product={result.product} preview={result.preview}/></>}
