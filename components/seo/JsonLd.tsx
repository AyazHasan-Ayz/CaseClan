import type {JsonLdValue} from '@/lib/seo/schemas';

export default function JsonLd({data}:{data:JsonLdValue|JsonLdValue[]}){
  const value=Array.isArray(data)?data:[data];
  return <>{value.map((item,index)=><script key={index} type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(item).replace(/</g,'\\u003c')}}/>)}</>;
}
