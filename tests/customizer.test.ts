import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {constrainLayer,initialCustomization,layerBounds,hitLayer,modelConfig,textLayer} from '../lib/customizer.ts';
import {modelConfigs} from '../lib/mockups.ts';
import {devices} from '../lib/catalog.ts';
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
test('phone models use their matching 2.5D camera geometry',()=>{
 assert.equal(modelConfig('iphone-15').cameraLayout,'dual-diagonal');
 assert.equal(modelConfig('iphone-16').cameraLayout,'dual-vertical');
 assert.equal(modelConfig('iphone-17').cameraLayout,'dual-vertical');
 assert.deepEqual(modelConfig('iphone-17').camera,{x:64,y:57,width:445,height:535});
 assert.equal(modelConfig('iphone-16-pro-max').cameraLayout,'triple-square');
 assert.equal(modelConfig('iphone-17-pro').cameraLayout,'triple-wide');
 assert.equal(modelConfig('iphone-17-pro-max').cameraLayout,'triple-wide');
 assert.deepEqual(modelConfig('iphone-17-pro').camera,{x:78,y:88,width:866,height:533});
 assert.deepEqual(modelConfig('iphone-17-pro-max').camera,{x:68,y:73,width:854,height:582});
 assert.equal(modelConfig('iphone-16-plus').cameraLayout,'dual-vertical');
 for(const device of devices)assert.equal(modelConfig(device.slug).photorealistic,true,`${device.slug} should use a photographic reference asset`);
});
test('every supported phone owns a complete layered mockup bundle',()=>{
 const files=['base.png','case-overlay.png','print-mask.png','camera-mask.png','highlight-overlay.png','shadow-overlay.png','config.json'];
 assert.equal(new Set(devices.map(device=>modelConfigs[device.slug].assets.base)).size,devices.length);
 for(const device of devices){
  const config=modelConfigs[device.slug];
  assert.ok(config,`${device.slug} requires an explicit model config`);
  assert.equal(config.slug,device.slug);
  assert.match(config.assets.base,new RegExp(`/mockups/${device.slug}/base\\.png$`));
  for(const file of files)assert.ok(existsSync(join(process.cwd(),'public','mockups',device.slug,file)),`${device.slug}/${file} is missing`);
 }
});
