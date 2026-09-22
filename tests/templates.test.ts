import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTemplateLayers,caseTemplates,createTemplateCustomization,defaultTemplateValues,templateForStyle} from '../lib/templates.ts';

test('every ready-made design has protected and editable template data',()=>{
 for(const name of ['Minimal Name','Signature Style','Initial + Name','Word Cloud','Photo Collage']){
  const template=templateForStyle(name);
  assert.equal(template.name,name);
  assert.ok(template.id);
  assert.ok(template.baseDesign);
  assert.ok(template.editableLayers.length>0);
  assert.ok(buildTemplateLayers(template,defaultTemplateValues(template)).filter(layer=>layer.locked).length===template.lockedLayers.length);
 }
});

test('personalization replaces placeholders without moving the composition',()=>{
 const template=templateForStyle('Word Cloud');
 const original=buildTemplateLayers(template,defaultTemplateValues(template));
 const personalized=buildTemplateLayers(template,{'customer-name':'A VERY LONG CUSTOMER NAME'});
 const lockedIds=new Set(template.lockedLayers.map(layer=>layer.id));
 assert.deepEqual(personalized.filter(layer=>lockedIds.has(layer.id)),original.filter(layer=>lockedIds.has(layer.id)));
 const before=original.find(layer=>layer.id==='customer-name')!;
 const after=personalized.find(layer=>layer.id==='customer-name')!;
 assert.equal(after.text.length,18);
 assert.deepEqual({x:after.x,y:after.y,width:after.width,height:after.height,rotation:after.rotation},{x:before.x,y:before.y,width:before.width,height:before.height,rotation:before.rotation});
});

test('forms expose only the fields intended by each template',()=>{
 assert.deepEqual(templateForStyle('Minimal Name').editableLayers.map(field=>field.id),['customer-name']);
 assert.deepEqual(templateForStyle('Initial + Name').editableLayers.map(field=>field.id),['initial','customer-name']);
 assert.deepEqual(templateForStyle('Word Cloud').editableLayers.map(field=>field.id),['customer-name']);
 assert.deepEqual(templateForStyle('Photo Collage').editableLayers.map(field=>field.id),['photo-1','photo-2','photo-3']);
});

test('changing device preserves template identity and personalization',()=>{
 const template=templateForStyle('Initial + Name'),values={initial:'R','customer-name':'RHEA'};
 const first=createTemplateCustomization(template,values,'iphone-15');
 const second=createTemplateCustomization(template,values,'iphone-17-pro-max');
 assert.equal(first.templateId,second.templateId);
 assert.deepEqual(first.layers.map(layer=>[layer.id,layer.text,layer.locked]),second.layers.map(layer=>[layer.id,layer.text,layer.locked]));
 assert.notEqual(first.device,second.device);
});

test('photo collage keeps fixed frames while only image sources change',()=>{
 const template=templateForStyle('Photo Collage');
 const design=createTemplateCustomization(template,{'photo-1':'data:image/webp;base64,one','photo-2':'data:image/webp;base64,two','photo-3':'data:image/webp;base64,three'},'iphone-17-pro');
 const photos=design.layers.filter(layer=>layer.type==='image');
 assert.equal(photos.length,3);
 assert.deepEqual(photos.map(layer=>layer.placeholderId),['photo-1','photo-2','photo-3']);
 assert.ok(photos.every(layer=>layer.src?.startsWith('data:image/webp')));
 assert.equal(caseTemplates.length,5);
});
