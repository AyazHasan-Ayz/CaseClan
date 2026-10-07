'use client';
import {useRef,useState} from 'react';
import {Product,productImage} from '@/lib/catalog';

export function galleryImages(primary:string,gallery?:string[]){return [...new Set([primary,...gallery||[]].filter(src=>typeof src==='string'&&!!src.trim()))]}
export default function ProductGallery({product}:{product:Product}){
 const images=galleryImages(productImage(product),product.gallery),track=useRef<HTMLDivElement>(null),[active,setActive]=useState(0);
 const select=(index:number)=>{setActive(index);const el=track.current;if(el)el.scrollTo({left:el.clientWidth*index,behavior:'smooth'})};
 return <div className="product-gallery"><div className="product-gallery-track" ref={track} onScroll={event=>{const el=event.currentTarget;setActive(Math.round(el.scrollLeft/el.clientWidth))}} aria-label={`${product.name} image gallery`}>
 {images.map((src,index)=><div className="product-gallery-slide" key={src}><img src={src} alt={`${product.name} — image ${index+1} of ${images.length}`} width={900} height={1125} loading={index?'lazy':'eager'} fetchPriority={index?'auto':'high'} onError={event=>{event.currentTarget.style.visibility='hidden';event.currentTarget.parentElement!.dataset.failed='Image unavailable'}}/></div>)}
 </div>{images.length>1&&<div className="product-gallery-thumbnails" aria-label="Choose product image">{images.map((src,index)=><button type="button" key={src} aria-label={`View image ${index+1}`} aria-pressed={active===index} onClick={()=>select(index)}><img src={src} alt="" loading="lazy" onError={event=>{event.currentTarget.style.visibility='hidden'}}/></button>)}</div>}</div>;
}
