import type {Metadata} from 'next';
import type {CmsSeo} from './types';
import {pageMetadata} from '@/lib/seo/metadata';
export function cmsMetadata(seo:CmsSeo|undefined,fallback:{title:string;description:string;path:string;image?:string}):Metadata{
 const result=pageMetadata({...fallback,title:seo?.title||fallback.title,description:seo?.description||fallback.description,image:seo?.image?.url||fallback.image,index:!seo?.noindex});
 if(seo?.canonical&&/^https:\/\//.test(seo.canonical))result.alternates={canonical:seo.canonical};
 return result;
}
