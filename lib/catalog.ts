import {designAssets,phoneAsset} from './assets.ts';
import type {Customization} from './customizer.ts';
import type {ModelConfig} from './mockups.ts';
export const clans = ['NOIR','VALOR','SAGE','AURA'] as const;
export type Clan=typeof clans[number];
export const clanInfo:Record<Clan,{line:string;finish:string;color:string;index:number}>={NOIR:{line:'Ambitious. Powerful. Always Ahead.',finish:'Carbon black',color:'#242426',index:0},VALOR:{line:'Bold. Fearless. Built Different.',finish:'Oxblood',color:'#74282d',index:1},SAGE:{line:'Refined. Intelligent. Purposeful.',finish:'Midnight blue',color:'#344556',index:2},AURA:{line:'Elegant. Calm. Unshaken.',finish:'Warm ivory',color:'#d6c9b5',index:3}};

export type Device={name:string;slug:string;brand:string;image:number;active?:boolean;available?:boolean;displayOrder?:number;mockup?:ModelConfig};
export const devices:Device[]=['iPhone 17','iPhone 17 Pro','iPhone 17 Pro Max','iPhone 16','iPhone 16 Plus','iPhone 16 Pro','iPhone 16 Pro Max','iPhone 15','iPhone 15 Plus','iPhone 15 Pro','iPhone 15 Pro Max'].map((name,image)=>({name,slug:name.toLowerCase().replaceAll(' ','-'),brand:'iPhone',image,active:true,available:true,displayOrder:image}));
export const styles=['Minimal Name','Signature Style','Initial + Name','Word Cloud','Photo Collage'] as const;
export type Design={name:string;font:string;textColor:string;style:string;upload?:string;filename?:string;instructions?:string;customization?:Customization;artifactId?:string;preview?:string;type?:'custom-case';uploadedImageReferences?:string[];uploadedArtworkUrls?:string[];printReadyArtifactId?:string;printReadyUrl?:string;createdAt?:string};
export type Product={id:string;name:string;price:number;clan:Clan;devices:string[];colors:string[];material:string;style:string;magsafe:boolean;rating:number;reviews:number;collection:string;rank:number;imageDevice:string;kind:'ready'|'custom';image?:string;gallery?:string[];sku?:string;compareAtPrice?:number;costPrice?:number;shortDescription?:string;description?:string;status?:'active'|'draft'|'archived';featured?:boolean;bestSeller?:boolean;newArrival?:boolean;seoTitle?:string;metaDescription?:string;createdAt?:string;modelPrices?:Record<string,number>};
const all=devices.map(d=>d.slug);
const make=(id:string,name:string,style:string,price:number,rank:number,kind:Product['kind']='ready'):Product=>({id,name,style,price,rank,kind,clan:'NOIR',devices:all,colors:['Black'],material:kind==='custom'?'Premium custom case':'Premium printed case',magsafe:false,rating:0,reviews:0,collection:kind==='ready'?'Ready Designs':'Design Your Own',imageDevice:all[(rank-1)%all.length],sku:`CC-${id.toUpperCase()}`,status:'active',featured:rank<=3,bestSeller:rank<=2,newArrival:false,createdAt:'2026-09-01T00:00:00.000Z'});
export const products:Product[]=[make('minimal-name','Minimal Name Case','Minimal Name',1299,1),make('signature-style','Signature Style Case','Signature Style',1499,2),make('initial-name','Initial + Name Case','Initial + Name',1499,3),make('word-cloud','Word Cloud Case','Word Cloud',1699,4),make('photo-collage','Photo Collage Case','Photo Collage',1799,5),make('ayaz-word-cloud','Ayaz Word Cloud Case','Word Cloud',1699,6),make('custom-design','Your Custom Design','Custom Upload',1899,7,'custom')];
export const assets={hero:'/images/hero-caseclan-lifestyle.webp',clans:'/images/clans.webp',devices:'/images/personalized/iphone-17.webp'};
export const money=(n:number)=>'₹'+n.toLocaleString('en-IN');
export const deviceName=(slug:string)=>devices.find(d=>d.slug===slug)?.name||slug;
export const defaultDevice=(p:Product)=>p.imageDevice;
export const deviceImage=(slug:string)=>phoneAsset(slug);
export const productImage=(product:Product|Clan,device?:string)=>typeof product==='string'?`/images/${product.toLowerCase()}.webp`:product.image||designAssets[product.style]||designAssets['Minimal Name'];
export function searchProducts(query:string){const terms=query.toLowerCase().trim().split(/\s+/);return products.filter(p=>p.kind==='ready'&&p.status!=='archived'&&p.status!=='draft'&&terms.every(t=>`${p.name} ${p.style} ${p.collection} ${p.devices.map(deviceName).join(' ')}`.toLowerCase().includes(t)))}

