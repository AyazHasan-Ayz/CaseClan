import test from 'node:test';
import assert from 'node:assert/strict';
import {constrainLayer,initialCustomization,layerBounds,hitLayer,modelConfig,textLayer} from '../lib/customizer.ts';
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
test('the custom editor starts with a blank case',()=>{assert.equal(initialCustomization.layers.length,0);assert.equal(initialCustomization.name,'Custom artwork')});
test('phone families use their matching 2.5D camera template',()=>{
 assert.equal(modelConfig('iphone-15').cameraLayout,'dual-diagonal');
 assert.equal(modelConfig('iphone-16').cameraLayout,'dual-vertical');
 assert.equal(modelConfig('iphone-17').cameraLayout,'dual-vertical');
 assert.equal(modelConfig('iphone-16-pro-max').cameraLayout,'triple-square');
 assert.equal(modelConfig('iphone-17-pro').cameraLayout,'triple-wide');
 assert.ok(modelConfig('iphone-17-pro-max').camera.width>850);
});
