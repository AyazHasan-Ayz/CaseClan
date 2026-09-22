import type {Customization,Layer} from './customizer';

export type TemplateField={
 id:string;
 type:'text'|'image';
 label:string;
 placeholder?:string;
 maxCharacters?:number;
 required?:boolean;
 accept?:string;
};

export type TemplateDefinition={
 id:string;
 name:string;
 baseDesign:string;
 background:string;
 lockedLayers:Layer[];
 editableLayers:Array<TemplateField&{layer:Layer}>;
};

export type TemplateValues=Record<string,string>;

const text=(id:string,value:string,x:number,y:number,font:string,color:string,width:number,height:number,rotation=0,locked=true):Layer=>({
 id,type:'text',text:value,font,color,x,y,width,height,rotation,locked
});

const image=(id:string,x:number,y:number,width:number,height:number,rotation=0):Layer=>({
 id,type:'image',text:id,font:'Modern',color:'#8d8d8d',x,y,width,height,rotation,locked:false,placeholderId:id
});

export const caseTemplates:TemplateDefinition[]=[
 {
  id:'minimal-name-01',name:'Minimal Name',baseDesign:'/assets/designs/minimal-name.webp',background:'#191a1b',
  lockedLayers:[
   text('minimal-rule-top','—',500,930,'Modern','#77797b',520,45,0,true),
   text('minimal-rule-bottom','—',500,1370,'Modern','#77797b',520,45,0,true)
  ],
  editableLayers:[{id:'customer-name',type:'text',label:'Your Name',placeholder:'YOUR NAME',maxCharacters:18,required:true,layer:{...text('customer-name','AYAZ',500,1150,'Modern','#f5f3ee',780,270,0,false),placeholderId:'customer-name',minFontSize:54}}]
 },
 {
  id:'signature-style-01',name:'Signature Style',baseDesign:'/assets/designs/signature-style.webp',background:'#eee9df',
  lockedLayers:[text('signature-rule','______',500,1330,'Signature','#a8a197',440,70,-8,true)],
  editableLayers:[{id:'customer-name',type:'text',label:'Your Name',placeholder:'Your name',maxCharacters:18,required:true,layer:{...text('customer-name','Ayaz',500,1110,'Signature','#171717',790,330,-8,false),placeholderId:'customer-name',minFontSize:48}}]
 },
 {
  id:'initial-name-01',name:'Initial + Name',baseDesign:'/assets/designs/initial-name.webp',background:'#171819',
  lockedLayers:[text('initial-divider','—',500,1305,'Modern','#77797b',310,45,0,true)],
  editableLayers:[
   {id:'initial',type:'text',label:'Initial',placeholder:'A',maxCharacters:1,required:true,layer:{...text('initial','A',500,990,'Editorial','#f2efe8',690,590,0,false),placeholderId:'initial',minFontSize:130}},
   {id:'customer-name',type:'text',label:'Your Name',placeholder:'YOUR NAME',maxCharacters:18,required:true,layer:{...text('customer-name','AYAZ',500,1420,'Modern','#f2efe8',650,110,0,false),placeholderId:'customer-name',minFontSize:30}}
  ]
 },
 {
  id:'word-cloud-01',name:'Word Cloud',baseDesign:'/assets/designs/word-cloud.webp',background:'#161718',
  lockedLayers:[
   text('word-focus','FOCUS',740,650,'Modern','#f5f3ee',300,86,-8,true),
   text('word-discipline','DISCIPLINE',730,780,'Modern','#f5f3ee',390,76,-8,true),
   text('word-dream','DREAM BIGGER',290,800,'Modern','#f5f3ee',330,120,-8,true),
   text('word-i-am','I AM',500,950,'Modern','#f5f3ee',330,105,0,true),
   text('word-legacy','LEGACY',340,1460,'Modern','#f5f3ee',300,82,-8,true),
   text('word-blessed','BLESSED',715,1490,'Modern','#f5f3ee',300,82,-8,true),
   text('word-create','CREATE • DIFFERENT',500,1670,'Modern','#f5f3ee',620,75,0,true)
  ],
  editableLayers:[{id:'customer-name',type:'text',label:'Your Name',placeholder:'YOUR NAME',maxCharacters:18,required:true,layer:{...text('customer-name','AYAZ',500,1190,'Bold','#d31b27',820,340,-5,false),placeholderId:'customer-name',minFontSize:58}}]
 },
 {
  id:'photo-collage-01',name:'Photo Collage',baseDesign:'/assets/designs/photo-collage.webp',background:'#171717',
  lockedLayers:[
   text('collage-caption','GOOD VIBES ONLY',285,1540,'Signature','#f2f0ea',330,115,-4,true),
   text('collage-note','YOU ARE ENOUGH ♡',720,1590,'Signature','#f2f0ea',350,115,4,true)
  ],
  editableLayers:[
   {id:'photo-1',type:'image',label:'Upload Photo 1',required:true,accept:'image/png,image/jpeg,image/webp',layer:image('photo-1',300,780,410,470,-3)},
   {id:'photo-2',type:'image',label:'Upload Photo 2',required:true,accept:'image/png,image/jpeg,image/webp',layer:image('photo-2',720,920,350,500,4)},
   {id:'photo-3',type:'image',label:'Upload Photo 3',required:true,accept:'image/png,image/jpeg,image/webp',layer:image('photo-3',455,1370,470,330,-2)}
  ]
 }
];

export function templateForStyle(style:string){return caseTemplates.find(t=>t.name===style)||caseTemplates[0]}
export function templateForId(id:string){return caseTemplates.find(t=>t.id===id)||caseTemplates[0]}

export function defaultTemplateValues(template:TemplateDefinition):TemplateValues{
 const values:TemplateValues={};
 for(const field of template.editableLayers){
  if(field.type==='text')values[field.id]=field.layer.text;
  else values[field.id]='';
 }
 return values;
}

export function buildTemplateLayers(template:TemplateDefinition,values:TemplateValues):Layer[]{
 const locked=template.lockedLayers.map(layer=>({...layer,locked:true}));
 const editable=template.editableLayers.map(field=>{
  const value=values[field.id]??field.layer.text;
  if(field.type==='image')return {...field.layer,id:field.id,src:value||undefined,text:field.label,locked:false,placeholderId:field.id};
  const normalized=value.slice(0,field.maxCharacters||50);
  return {...field.layer,id:field.id,text:normalized||field.placeholder||field.layer.text,locked:false,placeholderId:field.id};
 });
 return [...locked,...editable];
}

export function createTemplateCustomization(template:TemplateDefinition,values:TemplateValues,device:string):Customization{
 const firstText=template.editableLayers.find(field=>field.type==='text');
 return {
  version:1,
  device,
  template:template.name,
  templateId:template.id,
  name:firstText?values[firstText.id]||firstText.placeholder||'':'Photo collage',
  color:firstText?.layer.color||'#ffffff',
  background:template.background,
  layers:buildTemplateLayers(template,values),
  instructions:''
 };
}

export function templateValuesFromCustomization(template:TemplateDefinition,design:Customization):TemplateValues{
 const values=defaultTemplateValues(template);
 for(const field of template.editableLayers){
  const layer=design.layers.find(item=>item.placeholderId===field.id||item.id===field.id);
  if(field.type==='image')values[field.id]=layer?.src||'';
  else values[field.id]=layer?.text||values[field.id];
 }
 return values;
}
