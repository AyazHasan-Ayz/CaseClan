import test from 'node:test';
import assert from 'node:assert/strict';
import {constrainLayer,layerBounds,hitLayer,modelConfig,templateLayers,textLayer} from '../lib/customizer.ts';
test('rotated artwork remains inside the print-safe area and outside the camera',()=>{
 for(const device of ['iphone-17','iphone-17-pro','iphone-17-pro-max','iphone-16-pro','iphone-15-plus']){
  const c=modelConfig(device);
  for(const rotation of [-180,-135,-90,-45,0,45,90,135,180]){
   for(const y of [-500,200,1200,2600]){
    const l=constrainLayer({...textLayer('TEST'),width:2000,height:2000,x:-200,y,rotation},device),b=layerBounds(l);
    assert.ok(l.x-b.w/2>=c.safe-0.001);assert.ok(l.x+b.w/2<=1000-c.safe+0.001);
    assert.ok(l.y-b.h/2>=c.safe-0.001);assert.ok(l.y+b.h/2<=2000-c.safe+0.001);
    const r=c.camera;
    const intersects=l.x+b.w/2>r.x-c.safe&&l.x-b.w/2<r.x+r.width+c.safe&&l.y+b.h/2>r.y-c.safe&&l.y-b.h/2<r.y+r.height+c.safe-0.001;
    assert.equal(intersects,false);
   }
  }
 }
});
test('hit testing respects rotations and front-to-back layer order',()=>{
 const a={...textLayer('A'),width:200,height:80,rotation:90},b={...a,id:'top'};
 assert.equal(hitLayer([a,b],500,1180)?.id,'top');
 assert.equal(hitLayer([a,b],580,1100),undefined);
});
test('word cloud keeps supporting words apart from the brand footer',()=>{
 const layers=templateLayers('AYAZ','Word Cloud','#d31b27');
 assert.equal(layers.length,8);assert.equal(new Set(layers.map(l=>l.id)).size,8);
 assert.ok(layers.every(l=>l.y+l.height/2<1830));
 assert.equal(templateLayers('','Photo Collage','#fff').length,0);
});
