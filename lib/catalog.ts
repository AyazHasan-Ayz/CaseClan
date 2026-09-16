export const clans = ['NOIR','VALOR','SAGE','AURA'] as const;
export type Clan=typeof clans[number];
export const clanInfo:Record<Clan,{line:string;finish:string;color:string;index:number}>={NOIR:{line:'Ambitious. Powerful. Always Ahead.',finish:'Carbon black',color:'#242426',index:0},VALOR:{line:'Bold. Fearless. Built Different.',finish:'Oxblood',color:'#74282d',index:1},SAGE:{line:'Refined. Intelligent. Purposeful.',finish:'Midnight blue',color:'#344556',index:2},AURA:{line:'Elegant. Calm. Unshaken.',finish:'Warm ivory',color:'#d6c9b5',index:3}};
export const devices=['iPhone 17','iPhone 16','iPhone 17 Pro Max','iPhone 17 Pro','iPhone 16 Pro Max','iPhone 16 Pro','iPhone 15','iPhone 15 Pro Max','iPhone 15 Pro','iPhone 15 Plus'].map((name,image)=>({name,slug:name.toLowerCase().replaceAll(' ','-'),brand:'iPhone',image}));
export const styles=['Minimal Name','Signature Style','Initial + Name','Word Cloud'] as const;
export type Design={name:string;font:string;textColor:string;style:string;upload?:string;filename?:string;instructions?:string};
export type Product={id:string;name:string;price:number;clan:Clan;devices:string[];colors:string[];material:string;style:string;magsafe:boolean;rating:number;reviews:number;collection:string;rank:number;imageDevice:string;kind:'personalized'|'ready'|'upload'};
const all=devices.map(d=>d.slug);
const make=(id:string,name:string,style:string,price:number,rank:number,kind:Product['kind']='personalized'):Product=>({id,name,style,price,rank,kind,clan:'NOIR',devices:all,colors:['Black'],material:'Textured finish',magsafe:false,rating:0,reviews:0,collection:kind==='ready'?'Ready Designs':kind==='upload'?'Custom Upload':'Personalized',imageDevice:all[(rank-1)%all.length]});
export const products:Product[]=[make('minimal-name','Minimal Name Case','Minimal Name',1299,1),make('signature-style','Signature Style Case','Signature Style',1499,2),make('initial-name','Initial + Name Case','Initial + Name',1499,3),make('word-cloud','Word Cloud Case','Word Cloud',1699,4),make('ayaz-word-cloud','Ayaz Word Cloud Case','Word Cloud',1699,5,'ready'),make('custom-design','Your Custom Design','Custom Upload',1899,6,'upload')];
export const assets={hero:'/images/personalized/iphone-17-pro-max.webp',clans:'/images/clans.webp',devices:'/images/personalized/iphone-17.webp'};
export const money=(n:number)=>'₹'+n.toLocaleString('en-IN');
export const deviceName=(slug:string)=>devices.find(d=>d.slug===slug)?.name||slug;
export const defaultDevice=(p:Product)=>p.imageDevice;
export const deviceImage=(slug:string)=>`/images/personalized/${devices.some(d=>d.slug===slug)?slug:'iphone-17'}.webp`;
export const productImage=(product:Product|Clan,device?:string)=>typeof product==='string'?`/images/${product.toLowerCase()}.webp`:deviceImage(device||product.imageDevice);
export function searchProducts(query:string){const terms=query.toLowerCase().trim().split(/\s+/);return products.filter(p=>terms.every(t=>`${p.name} ${p.style} ${p.collection} ${p.devices.map(deviceName).join(' ')}`.toLowerCase().includes(t)))}
