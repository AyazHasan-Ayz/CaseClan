export const clans = ['NOIR','VALOR','SAGE','AURA'] as const;
export type Clan = typeof clans[number];
export const clanInfo: Record<Clan,{line:string;finish:string;color:string;index:number}> = {
 NOIR:{line:'Ambitious. Powerful. Always Ahead.',finish:'Carbon black',color:'#242426',index:0},
 VALOR:{line:'Bold. Fearless. Built Different.',finish:'Oxblood',color:'#74282d',index:1},
 SAGE:{line:'Refined. Intelligent. Purposeful.',finish:'Midnight blue',color:'#344556',index:2},
 AURA:{line:'Elegant. Calm. Unshaken.',finish:'Warm ivory',color:'#d6c9b5',index:3}
};
export const devices = [
 {slug:'iphone-18-pro-max',name:'iPhone 18 Pro Max',brand:'iPhone',image:0},
 {slug:'iphone-18-pro',name:'iPhone 18 Pro',brand:'iPhone',image:1},
 {slug:'iphone-17-pro',name:'iPhone 17 Pro',brand:'iPhone',image:2},
 {slug:'galaxy-s26-ultra',name:'Galaxy S26 Ultra',brand:'Samsung',image:3},
 {slug:'galaxy-z-fold',name:'Galaxy Z Fold',brand:'Samsung',image:4},
 {slug:'iphone-17-pro-max',name:'iPhone 17 Pro Max',brand:'iPhone',image:0},
 {slug:'galaxy-s26-plus',name:'Galaxy S26+',brand:'Samsung',image:3},
 {slug:'galaxy-z-flip',name:'Galaxy Z Flip',brand:'Samsung',image:4},
];
export type Product={id:string;name:string;price:number;clan:Clan;devices:string[];colors:string[];material:string;style:string;magsafe:boolean;rating:number;reviews:number;collection:string;rank:number};
const all=devices.map(d=>d.slug);
export const products:Product[]=[
 {id:'carbon-01',name:'Carbon 01',price:1699,clan:'NOIR',devices:all,colors:['Carbon black'],material:'Carbon composite',style:'Textured',magsafe:true,rating:4.8,reviews:127,collection:'Carbon Collection',rank:1},
 {id:'ivory-form',name:'Ivory Form',price:1499,clan:'AURA',devices:all,colors:['Warm ivory'],material:'Vegan leather',style:'Minimal',magsafe:true,rating:4.7,reviews:84,collection:'Essential Collection',rank:2},
 {id:'slate-form',name:'Slate Form',price:1799,clan:'SAGE',devices:all,colors:['Midnight blue'],material:'Vegan leather',style:'Minimal',magsafe:true,rating:4.8,reviews:96,collection:'Essential Collection',rank:3},
 {id:'valor-weave',name:'Valor Weave',price:1899,clan:'VALOR',devices:all,colors:['Oxblood'],material:'Aramid weave',style:'Textured',magsafe:true,rating:4.7,reviews:72,collection:'Carbon Collection',rank:4},
 {id:'noir-essential',name:'Noir Essential',price:1299,clan:'NOIR',devices:all.filter(d=>!d.includes('fold')&&!d.includes('flip')),colors:['Carbon black'],material:'Carbon composite',style:'Minimal',magsafe:false,rating:4.8,reviews:53,collection:'Essential Collection',rank:5},
 {id:'aura-fold',name:'Aura Fold',price:2299,clan:'AURA',devices:['galaxy-z-fold','galaxy-z-flip'],colors:['Warm ivory'],material:'Vegan leather',style:'Minimal',magsafe:false,rating:4.7,reviews:28,collection:'Fold Collection',rank:6},
 {id:'sage-armour',name:'Sage Armour',price:2099,clan:'SAGE',devices:['galaxy-s26-ultra','galaxy-s26-plus','iphone-18-pro-max'],colors:['Midnight blue'],material:'Aramid weave',style:'Protective',magsafe:true,rating:4.8,reviews:42,collection:'Carbon Collection',rank:7},
 {id:'valor-essential',name:'Valor Essential',price:1599,clan:'VALOR',devices:all,colors:['Oxblood'],material:'Vegan leather',style:'Minimal',magsafe:false,rating:4.7,reviews:38,collection:'Essential Collection',rank:8}
];
export const assets={hero:'/images/hero.webp',clans:'/images/clans.webp',devices:'/images/devices.webp'};
export const money=(n:number)=>'₹'+n.toLocaleString('en-IN');
export const deviceName=(slug:string)=>devices.find(d=>d.slug===slug)?.name||slug;
export const defaultDevice=(p:Product)=>p.id==='slate-form'?'galaxy-s26-ultra':p.id==='valor-weave'?'iphone-18-pro-max':p.devices.includes('iphone-18-pro')?'iphone-18-pro':p.devices[0];
export const productImage=(clan:Clan)=>`/images/${clan.toLowerCase()}.webp`;
export function searchProducts(query:string){const terms=query.toLowerCase().trim().split(/\s+/);return products.filter(p=>terms.every(t=>`${p.name} ${p.clan} ${p.collection} ${p.material} ${p.devices.map(deviceName).join(' ')}`.toLowerCase().includes(t)))}
