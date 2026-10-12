import {designs} from '../data/designs.ts';
/** Compatibility lookup for editor/banners; design image paths live only in designs.ts. */
export const designAssets:Record<string,string>=Object.fromEntries(designs.map(design=>[design.style||design.category,design.images[0]]));
designAssets['Custom Upload']=designAssets['Photo Collage'];
export function phoneAsset(slug:string){return '/assets/phones/'+(slug.includes('samsung')?'samsung-ultra':slug.includes('17-pro')?'pro-wide':slug.includes('pro')?(slug.includes('15')?'pro-titanium':'pro-white'):'dual-white')+'.webp'}
export const brandAssets={logo:null as string|null,hero:'/images/hero-caseclan-lifestyle.webp'};
