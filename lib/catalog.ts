import {designAssets,phoneAsset} from './assets.ts';
import type {Customization} from './customizer.ts';
import type {ModelConfig} from './mockups.ts';
import {getFileDesignProducts,searchDesigns} from './designs.ts';
export const clans = ['NOIR','VALOR','SAGE','AURA'] as const;
export type Clan=typeof clans[number];
export const clanInfo:Record<Clan,{line:string;finish:string;color:string;index:number}>={NOIR:{line:'Ambitious. Powerful. Always Ahead.',finish:'Carbon black',color:'#242426',index:0},VALOR:{line:'Bold. Fearless. Built Different.',finish:'Oxblood',color:'#74282d',index:1},SAGE:{line:'Refined. Intelligent. Purposeful.',finish:'Midnight blue',color:'#344556',index:2},AURA:{line:'Elegant. Calm. Unshaken.',finish:'Warm ivory',color:'#d6c9b5',index:3}};

export type Device={name:string;slug:string;brand:string;image:number;imageUrl?:string;active?:boolean;available?:boolean;displayOrder?:number;mockup?:ModelConfig};
export const devices:Device[]=['iPhone 17','iPhone 17 Pro','iPhone 17 Pro Max','iPhone 16','iPhone 16 Plus','iPhone 16 Pro','iPhone 16 Pro Max','iPhone 15','iPhone 15 Plus','iPhone 15 Pro','iPhone 15 Pro Max'].map((name,image)=>({name,slug:name.toLowerCase().replaceAll(' ','-'),brand:'iPhone',image,active:true,available:true,displayOrder:image}));
export const styles=['Minimal Name','Signature Style','Initial + Name','Word Cloud','Photo Collage'] as const;
export type Design={name:string;font:string;textColor:string;style:string;upload?:string;filename?:string;instructions?:string;customization?:Customization;artifactId?:string;preview?:string;type?:'custom-case';uploadedImageReferences?:string[];uploadedArtworkUrls?:string[];printReadyArtifactId?:string;printReadyUrl?:string;createdAt?:string};
export type Product={id:string;slug?:string;tags?:string[];name:string;price:number;clan:Clan;devices:string[];colors:string[];material:string;style:string;magsafe:boolean;rating:number;reviews:number;collection:string;rank:number;imageDevice:string;kind:'ready'|'custom';image?:string;gallery?:string[];sku?:string;compareAtPrice?:number;costPrice?:number;shortDescription?:string;description?:string;status?:'active'|'draft'|'archived';featured?:boolean;bestSeller?:boolean;newArrival?:boolean;seoTitle?:string;metaDescription?:string;createdAt?:string;modelPrices?:Record<string,number>};
const all=devices.map(d=>d.slug);
export const products:Product[]=[...getFileDesignProducts(),{id:'custom-design',name:'Your Custom Design',style:'Custom Upload',price:1899,rank:99,kind:'custom',clan:'NOIR',devices:all,colors:['Black'],material:'Premium custom case',magsafe:false,rating:0,reviews:0,collection:'Design Your Own',imageDevice:'iphone-16-pro-max',sku:'CC-CUSTOM-DESIGN',status:'active',createdAt:'2026-09-01T00:00:00.000Z'}];
export const assets={hero:'/images/hero-caseclan-lifestyle.webp',clans:'/images/clans.webp',devices:'/images/personalized/iphone-17.webp'};
export const money=(n:number)=>'₹'+n.toLocaleString('en-IN');
export const deviceName=(slug:string)=>devices.find(d=>d.slug===slug)?.name||slug;
export const defaultDevice=(p:Product)=>p.imageDevice;
export const deviceImage=(slug:string)=>devices.find(d=>d.slug===slug)?.imageUrl||phoneAsset(slug);
export const productImage=(product:Product|Clan,device?:string)=>typeof product==='string'?`/images/${product.toLowerCase()}.webp`:product.image||designAssets[product.style]||designAssets['Minimal Name'];
export function searchProducts(query:string){return searchDesigns(products,query)}

