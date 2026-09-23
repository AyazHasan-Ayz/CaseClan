'use client';

import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,ChevronRight,Smartphone,X} from 'lucide-react';
import {deviceImage,devices} from '@/lib/catalog';
import {useStore} from './StoreProvider';

export default function ModelChooser(){
 const store=useStore(),[open,setOpen]=useState(false),dialog=useRef<HTMLDialogElement>(null);
 const selected=devices.find(device=>device.slug===store.selectedDevice);
 useEffect(()=>{const element=dialog.current;if(!element)return;if(open&&!element.open){element.showModal();document.body.style.overflow='hidden'}if(!open&&element.open)element.close();return()=>{document.body.style.overflow='';if(element.open)element.close()}},[open]);
 const choose=(slug:string)=>{store.setSelectedDevice(slug);setOpen(false)};
 return <section className="model-chooser" aria-labelledby="model-chooser-title">
  <div className="model-chooser-copy"><p className="eyebrow">PRECISION STARTS HERE</p><h2 id="model-chooser-title">Choose Your Model</h2><p>We&apos;ll fit your design perfectly to your phone.</p></div>
  {selected?<div className="model-selection-card selected-model-card"><div className="selected-model-visual"><img src={deviceImage(selected.slug)} alt={`${selected.name} device reference`}/></div><div className="selected-model-copy"><span className="selected-status"><Check size={13}/> Selected</span><h3>{selected.name}</h3><button onClick={()=>setOpen(true)}>Change model</button></div><Link className="model-personalize-cta" href={`/customize/?device=${selected.slug}`}>Start Personalizing <ArrowRight size={16}/></Link></div>:<button className="model-selection-card empty-model-card" onClick={()=>setOpen(true)} aria-haspopup="dialog"><span className="model-icon"><Smartphone size={30} strokeWidth={1.2}/></span><span><strong>Choose your model</strong><small>Tap to see all models</small></span><ChevronRight size={20}/></button>}
  <dialog ref={dialog} className="model-picker-sheet" aria-labelledby="model-picker-title" onCancel={event=>{event.preventDefault();setOpen(false)}} onClick={event=>{if(event.target===event.currentTarget)setOpen(false)}}><div className="model-picker-panel"><div className="model-picker-heading"><div><p className="eyebrow">SUPPORTED FLAGSHIPS</p><h2 id="model-picker-title">Choose your phone</h2><p>Your choice will follow you across CASECLAN.</p></div><button onClick={()=>setOpen(false)} aria-label="Close model chooser"><X size={22}/></button></div><div className="model-picker-grid">{devices.map(device=><button key={device.slug} className={store.selectedDevice===device.slug?'selected':''} aria-pressed={store.selectedDevice===device.slug} onClick={()=>choose(device.slug)}><img src={deviceImage(device.slug)} alt=""/><span><strong>{device.name}</strong><small>{store.selectedDevice===device.slug?'Selected ✓':'Choose model'}</small></span>{store.selectedDevice===device.slug?<Check size={17}/>:<ChevronRight size={17}/>}</button>)}</div></div></dialog>
 </section>;
}
