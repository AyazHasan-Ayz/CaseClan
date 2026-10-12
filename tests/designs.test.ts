import test from 'node:test';
import assert from 'node:assert/strict';
import {designs,type CaseDesign} from '../data/designs.ts';
import {designToProduct,resolveDesignCatalog,activeDesigns,newestDesigns,bestSellerDesigns,featuredDesigns,findDesign,searchDesigns,productSlug} from '../lib/designs.ts';

const newDesign:CaseDesign={id:'new-design-id',slug:'midnight-discipline',name:'Midnight Discipline',shortDescription:'Discipline over mood.',price:599,images:['/assets/designs/word-cloud.webp'],category:'Grunge',tags:['Dark','Motivational'],compatiblePhones:['iPhone 17','iPhone 16 Pro'],featured:true,bestSeller:true,active:true,createdAt:'2099-01-01T00:00:00.000Z'};
test('one new object reaches every catalog consumer even after a database refresh',()=>{
 const catalog=resolveDesignCatalog([designToProduct(designs[0])],[...designs,newDesign]);
 assert.equal(newestDesigns(catalog)[0].id,newDesign.id);
 assert.ok(activeDesigns(catalog).some(p=>p.id===newDesign.id));
 assert.ok(featuredDesigns(catalog).some(p=>p.id===newDesign.id));
 assert.ok(bestSellerDesigns(catalog).some(p=>p.id===newDesign.id));
 assert.equal(findDesign(catalog,newDesign.slug)?.id,newDesign.id);
 assert.equal(productSlug(findDesign(catalog,newDesign.slug)!),newDesign.slug);
 assert.equal(searchDesigns(catalog,'motivational iphone 17')[0].id,newDesign.id);
 assert.deepEqual(findDesign(catalog,newDesign.slug)?.devices,['iphone-17','iphone-16-pro']);
});
test('inactive file designs stay out of all public sections, search and product lookup',()=>{
 const catalog=resolveDesignCatalog([designToProduct(newDesign)],[{...newDesign,active:false}]);
 for(const selector of [activeDesigns,newestDesigns,featuredDesigns,bestSellerDesigns])assert.equal(selector(catalog).length,0);
 assert.equal(findDesign(catalog,newDesign.slug),undefined);
 assert.equal(searchDesigns(catalog,newDesign.name).length,0);
 assert.equal(activeDesigns(resolveDesignCatalog([designToProduct(newDesign)],[{...newDesign,active:false,managedRemotely:true}])).length,0);
});
test('catalog refresh preserves admin pricing and unpublishing for existing managed products',()=>{
 const source={...newDesign,managedRemotely:true},remote={...designToProduct(source),price:799,status:'archived' as const};
 assert.equal(resolveDesignCatalog([remote],[source])[0].price,799);
 assert.equal(activeDesigns(resolveDesignCatalog([remote],[source])).length,0);
 assert.equal(resolveDesignCatalog([],[source]).length,0);
});
test('file catalog has unique IDs/slugs, valid dates, image lists and prices',()=>{
 assert.equal(new Set(designs.map(d=>d.id)).size,designs.length);
 assert.equal(new Set(designs.map(d=>d.slug)).size,designs.length);
 for(const design of designs){assert.ok(design.images.length);assert.ok(Number.isFinite(Date.parse(design.createdAt)));assert.ok(design.price>=0);assert.match(design.slug,/^[a-z0-9-]+$/);}
});
