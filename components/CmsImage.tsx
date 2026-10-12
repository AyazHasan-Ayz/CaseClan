import Image from 'next/image';
import type {CmsImage as CmsImageData} from '@/lib/cms/types';
export default function CmsImage({image,fallback,alt,width=900,height=1125,className,priority=false}:{image?:CmsImageData;fallback:string;alt:string;width?:number;height?:number;className?:string;priority?:boolean}){
 const src=image?.url||fallback;
 const optimized=src.startsWith('/')||/^https:\/\/(cdn\.sanity\.io|ftjucooznvhpdcjsfngr\.supabase\.co)\//.test(src);
 return <Image src={src} alt={image?.alt||alt} width={image?.width||width} height={image?.height||height} className={className} priority={priority} unoptimized={!optimized} sizes="(max-width: 700px) 100vw, 60vw"/>;
}
