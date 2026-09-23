'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowRight,Heart,ImagePlus,LockKeyhole,Upload} from 'lucide-react';
import {Design,Product,defaultDevice,deviceName,money,productImage,products} from '@/lib/catalog';
import {normalizeName} from '@/lib/personalization';
import {constrainLayer,initialCustomization,readArtifact,renderArtwork,saveArtifact,textLayer} from '@/lib/customizer';
import {createTemplateCustomization,defaultTemplateValues,templateForStyle,TemplateField,TemplateValues} from '@/lib/templates';
import {useStore} from './StoreProvider';

const CaseScene=dynamic(()=>import('./CaseScene'),{ssr:false});

async function prepareImage(file:File){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Choose a JPG, PNG or WebP image under 10 MB.');
 const bitmap=await createImageBitmap(file);
 try{
  if(bitmap.width<300||bitmap.height<300)throw new Error('Use an image at least 300 × 300 pixels.');
  const ratio=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*ratio));
  canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
  canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/webp',.86);
 }finally{bitmap.close()}
}

export default function ProductDetail({product:p,upload=false}:{product:Product;upload?:boolean}){
 const store=useStore(),router=useRouter(),form=useRef<HTMLFormElement>(null),deviceInitialized=useRef(false),valuesTouched=useRef(false);
 const template=useMemo(()=>templateForStyle(p.style),[p.style]);
 const [device,setDevice]=useState(()=>store.selectedDevice&&p.devices.includes(store.selectedDevice)?store.selectedDevice:defaultDevice(p));
 const [values,setValues]=useState<TemplateValues>(()=>defaultTemplateValues(template));
 const [proof,setProof]=useState(!upload);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState('');
 const [draftReady,setDraftReady]=useState(upload);
 const [customUpload,setCustomUpload]=useState<Design>({name:'Custom artwork',font:'Modern',textColor:'#ffffff',style:'Custom Upload'});

 useEffect(()=>{
  if(!store.ready||deviceInitialized.current)return;
  deviceInitialized.current=true;
  const selected=new URLSearchParams(window.location.search).get('device');
  if(selected&&p.devices.includes(selected)){setDevice(selected);store.setSelectedDevice(selected)}
  else if(store.selectedDevice&&p.devices.includes(store.selectedDevice))setDevice(store.selectedDevice);
 },[p,store.ready]);
 const chooseDevice=(next:string)=>{deviceInitialized.current=true;setDevice(next);store.setSelectedDevice(next)};

 useEffect(()=>{
  if(upload){setDraftReady(true);return}
  let active=true;
  readArtifact<{values:TemplateValues}>(`product-draft:${template.id}`).then(saved=>{
   if(active&&saved?.values&&!valuesTouched.current)setValues(current=>({...current,...saved.values}));
  }).catch(()=>{}).finally(()=>{if(active)setDraftReady(true)});
  return()=>{active=false};
 },[template.id,upload]);

 useEffect(()=>{
  if(upload||!draftReady)return;
  const timer=setTimeout(()=>{saveArtifact(`product-draft:${template.id}`,{templateId:template.id,values,updatedAt:new Date().toISOString()}).catch(()=>{})},350);
  return()=>clearTimeout(timer);
 },[draftReady,template.id,upload,values]);

 const customization=useMemo(()=>{
  if(upload){
   const layers=customUpload.upload?[constrainLayer({...textLayer('Uploaded artwork'),type:'image' as const,src:customUpload.upload,width:760,height:1180,x:500,y:1120},device)]:[];
   return {...initialCustomization,device,template:'Custom Upload',name:'Custom artwork',layers};
  }
  const next=createTemplateCustomization(template,values,device);
  return {...next,layers:next.layers.map(layer=>constrainLayer(layer,device))};
 },[customUpload.upload,device,template,upload,values]);

 const selectedProduct=p.kind==='personalized'?(products.find(item=>item.kind==='personalized'&&item.style===template.name)||p):p;
 const firstText=template.editableLayers.find(field=>field.type==='text');
 const quickDesign:Design={
  name:firstText?normalizeName(values[firstText.id]||''):upload?'Custom artwork':'Photo collage',
  font:firstText?.layer.font||'Modern',
  textColor:firstText?.layer.color||'#ffffff',
  style:upload?'Custom Upload':template.name,
  templateId:upload?undefined:template.id,
  personalization:upload?undefined:values,
  upload:upload?customUpload.upload:template.editableLayers.find(field=>field.type==='image')?values[template.editableLayers.find(field=>field.type==='image')!.id]:undefined,
  filename:customUpload.filename,
  instructions:customUpload.instructions,
  customization
 };

 const updateValue=(id:string,value:string)=>{valuesTouched.current=true;setValues(current=>({...current,[id]:value}));setProof(true);setError('')};

 async function readTemplateImage(field:TemplateField,file?:File){
  if(!file)return;
  setLoading(field.id);setError('');
  try{updateValue(field.id,await prepareImage(file))}catch(reason){setError(reason instanceof Error?reason.message:'This image could not be read. Try another file.')}finally{setLoading('')}
 }

 async function readCustomImage(file?:File){
  if(!file)return;
  setLoading('custom');setError('');
  try{const prepared=await prepareImage(file);setCustomUpload(current=>({...current,upload:prepared,filename:file.name}));setProof(true)}catch(reason){setError(reason instanceof Error?reason.message:'This image could not be read. Try another file.')}finally{setLoading('')}
 }

 const validate=()=>{
  if(!form.current?.reportValidity())return false;
  if(upload&&!customUpload.upload){setError('Please upload your design first.');return false}
  const missing=template.editableLayers.find(field=>field.required&&!values[field.id]?.trim());
  if(!upload&&missing){setError(`${missing.label} is required.`);return false}
  return true;
 };

 const add=async(buy=false)=>{
  if(!validate())return;
  setLoading('cart');setError('');
  try{
   const [printCanvas,previewCanvas]=await Promise.all([renderArtwork(customization,2048),renderArtwork(customization,640)]);
   const print=await new Promise<Blob>((resolve,reject)=>printCanvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Unable to prepare print artwork.')),'image/png'));
   const preview=previewCanvas.toDataURL('image/webp',.86);
   const artifactId=crypto.randomUUID();
   await saveArtifact(artifactId,{customization,print,preview,templateId:template.id,personalization:upload?undefined:values,createdAt:new Date().toISOString(),productionApproved:false});
   store.add(selectedProduct,device,p.colors[0],{...quickDesign,artifactId,preview});
   if(buy){store.setDrawer(false);router.push('/checkout/')}
  }catch{setError('Unable to save your preview and print artwork. Free some browser storage and try again.')}finally{setLoading('')}
 };

 async function openAdvanced(){
  if(!validate())return;
  setLoading('handoff');setError('');
  try{
   await saveArtifact('template-handoff',{design:customization,step:2,templateId:template.id,values});
   router.push('/customize/?handoff=1');
  }catch{setError('Unable to open the advanced editor. Free some browser storage and try again.');setLoading('')}
 }

 return <>
  <div className="product-page">
   <p className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/shop/">Shop</Link><span>/</span>{p.name}</p>
   <div className="product-detail-layout">
    <div className="gallery">
     {proof?<CaseScene design={customization}/>:<div className="gallery-main supplied-gallery"><img src={productImage(p,device)} alt={`Original ${p.name} template for ${deviceName(device)}`}/></div>}
     {!upload&&<div className="preview-tabs"><button className={!proof?'selected':''} onClick={()=>setProof(false)}>Original design</button><button className={proof?'selected':''} onClick={()=>setProof(true)}>Your live preview</button></div>}
     <p className="small muted">{upload?'Live device-specific 2.5D preview.':'The template composition stays fixed. Only the fields marked below are replaced.'}</p>
    </div>
    <form ref={form} className="product-details quick-personalize" onSubmit={event=>{event.preventDefault();add()}}>
     <p className="eyebrow">{upload?'YOUR ART. YOUR EVERYDAY.':'QUICK PERSONALIZE'}</p>
     <h1>{upload?'DESIGN YOUR OWN COVER':selectedProduct.name.toUpperCase()}</h1>
     <p className="detail-rating muted">☆☆☆☆☆ · New design · No reviews yet</p>
     <p className="detail-price">{money(selectedProduct.price)} <span>Inclusive of all taxes</span></p>
     <p className="product-description">{upload?'Upload your artwork and preview it on your chosen phone.':`Keep the original ${template.name} composition and replace only your personalization.`}</p>
     <label className="field-label">Phone model<select value={device} onChange={event=>chooseDevice(event.target.value)}>{p.devices.map(item=><option key={item} value={item}>{deviceName(item)}</option>)}</select></label>

     {upload?<>
      <label className="upload-field"><Upload size={25}/><strong>{loading==='custom'?'Preparing preview…':customUpload.filename||'Choose your design'}</strong><span>JPG, PNG, WebP · Up to 10 MB · Minimum 300 × 300</span><input required type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload image or design" disabled={!!loading} onChange={event=>readCustomImage(event.target.files?.[0])}/></label>
      <label className="field-label">Print instructions<textarea maxLength={1000} rows={3} placeholder="Tell us about placement, colors, or details to keep." value={customUpload.instructions||''} onChange={event=>setCustomUpload(current=>({...current,instructions:event.target.value}))}/></label>
     </>:<>
      <div className="template-lock-note"><LockKeyhole size={18}/><div><strong>Original layout protected</strong><span>Typography, placement, colors, spacing, graphics, and background remain locked.</span></div></div>
      <div className="template-fields">
       {template.editableLayers.map(field=>field.type==='text'?<label className="field-label" key={field.id}>{field.label}<div className="name-input"><input required={field.required} maxLength={field.maxCharacters} value={values[field.id]||''} placeholder={field.placeholder} onChange={event=>updateValue(field.id,event.target.value)}/><span>{(values[field.id]||'').length}/{field.maxCharacters}</span></div></label>:<label className={`template-upload ${values[field.id]?'has-image':''}`} key={field.id}><ImagePlus size={20}/><strong>{loading===field.id?'Preparing photo…':values[field.id]?'Photo ready':field.label}</strong><span>{values[field.id]?'Tap to replace':'JPG, PNG or WebP · Fixed template frame'}</span><input required={field.required&&!values[field.id]} type="file" accept={field.accept} aria-label={field.label} disabled={!!loading} onChange={event=>readTemplateImage(field,event.target.files?.[0])}/></label>)}
      </div>
     </>}

     {error&&<p role="alert" className="form-error">{error}</p>}
     <div className="quick-actions">
      <button type="button" className="button outline wide" onClick={()=>setProof(true)}>PREVIEW <ArrowRight size={15}/></button>
      <button disabled={!!loading} className="button wide" type="submit">{loading==='cart'?'SAVING DESIGN…':`ADD TO CART — ${money(selectedProduct.price)}`} {loading!=='cart'&&<ArrowRight size={15}/>}</button>
     </div>
     {!upload&&<button type="button" className="advanced-editor-link" disabled={!!loading} onClick={openAdvanced}>{loading==='handoff'?'OPENING EDITOR…':'CUSTOMIZE THIS DESIGN FURTHER'} <ArrowRight size={15}/></button>}
     <div className="purchase-assurances"><span>Free shipping above ₹999</span><span>Easy 7-day returns</span></div>
     <button type="button" className="wishlist-detail" aria-label="Save to wishlist" aria-pressed={store.wishlist.includes(p.id)} onClick={()=>store.toggleWish(p.id)}><Heart size={18} fill={store.wishlist.includes(p.id)?'currentColor':'none'}/> Save this design</button>
    </form>
   </div>
  </div>
  <section className="section product-faq">
   <div><p className="eyebrow">DESIGNED TO STAY DESIGNED</p><h2>Your details. The original composition.</h2></div>
   <div>
    <details><summary>What can I change?<span>+</span></summary><p>Only the personalization fields shown on this product page. Every other template layer remains fixed.</p></details>
    <details><summary>What happens when I change phones?<span>+</span></summary><p>Your entries stay intact while the artwork maps to the selected model’s predefined print area and camera layout.</p></details>
    <details><summary>Can I make more changes?<span>+</span></summary><p>Yes. Choose “Customize this design further” to open the advanced editor. Protected template layers stay identified and your personalization travels with the design.</p></details>
   </div>
  </section>
 </>;
}
