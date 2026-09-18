/** User-supplied photographs. Replace files here without changing UI components. */
export const designAssets:Record<string,string>={
 'Minimal Name':'/assets/designs/minimal-name.webp',
 'Signature Style':'/assets/designs/signature-style.webp',
 'Initial + Name':'/assets/designs/initial-name.webp',
 'Word Cloud':'/assets/designs/word-cloud.webp',
 'Photo Collage':'/assets/designs/photo-collage.webp',
 'Custom Upload':'/assets/designs/photo-collage.webp',
};
export function phoneAsset(slug:string){return '/assets/phones/'+(slug.includes('samsung')?'samsung-ultra':slug.includes('17-pro')?'pro-wide':slug.includes('pro')?(slug.includes('15')?'pro-titanium':'pro-white'):'dual-white')+'.webp'}
export const brandAssets={logo:null as string|null,hero:'/images/hero-caseclan-lifestyle.webp'};
