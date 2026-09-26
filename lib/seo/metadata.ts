import type {Metadata} from 'next';
import {absoluteUrl,siteConfig} from './config';

type PageMetadataInput={title:string;description:string;path:string;image?:string;index?:boolean};

export function pageMetadata({title,description,path,image=siteConfig.defaultImage,index=true}:PageMetadataInput):Metadata{
  const canonical=absoluteUrl(path);
  const imageUrl=absoluteUrl(image);
  return {
    title:{absolute:title},
    description,
    alternates:{canonical},
    robots:index?{index:true,follow:true}:{index:false,follow:false,noarchive:true},
    openGraph:{title,description,url:canonical,siteName:siteConfig.name,type:'website',images:[{url:imageUrl,alt:title}]},
    twitter:{card:'summary_large_image',title,description,images:[imageUrl]},
  };
}
