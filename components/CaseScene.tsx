'use client';

import {PointerEvent as ReactPointerEvent,useCallback,useEffect,useRef,useState} from 'react';
import {Customization,Layer,constrainLayer,hitLayer,modelConfig,renderArtwork} from '@/lib/customizer';

type Props={design:Customization;selected?:string;guides?:boolean;editing?:boolean;view?:string;onSelect?:(id:string)=>void;onMove?:(layer:Layer,commit:boolean)=>void;onCapture?:(capture:()=>string)=>void};
type Frame={x:number;y:number;w:number;h:number;angle:number;skew:number};
type MockupLayers={base:HTMLImageElement;caseOverlay:HTMLImageElement;highlight:HTMLImageElement;shadow:HTMLImageElement};

const VIEW:Record<string,{angle:number;skew:number;scale:number}>={Front:{angle:0,skew:0,scale:1},Angle:{angle:-.045,skew:-.10,scale:.96},Left:{angle:.035,skew:.09,scale:.95},Right:{angle:-.035,skew:-.09,scale:.95},Top:{angle:-.018,skew:-.04,scale:.92},Bottom:{angle:.018,skew:.04,scale:.92}};
const assetCache=new Map<string,Promise<HTMLImageElement>>();

function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,w/2,h/2))}
function layout(size:{width:number;height:number},design:Customization,view:string):Frame{const p=VIEW[view]||VIEW.Front,c=modelConfig(design.device),maxH=size.height*.79,maxW=size.width*.48,ratio=c.width/c.height,h=Math.min(maxH,maxW/ratio)*p.scale,w=h*ratio;return {x:(size.width-w)/2,y:(size.height-h)/2-6,w,h,angle:p.angle,skew:p.skew}}
function loadAsset(src:string){if(!assetCache.has(src))assetCache.set(src,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`Unable to load ${src}`));image.src=src}));return assetCache.get(src)!}
async function loadMockup(device:string):Promise<MockupLayers>{const a=modelConfig(device).assets;const [base,caseOverlay,highlight,shadow]=await Promise.all([loadAsset(a.base),loadAsset(a.caseOverlay),loadAsset(a.highlightOverlay),loadAsset(a.shadowOverlay)]);return {base,caseOverlay,highlight,shadow}}

async function paint(canvas:HTMLCanvasElement,d:Customization,selected:string|undefined,guides:boolean,view:string){
 const dpr=Math.min(2,window.devicePixelRatio||1),cssW=Math.max(320,canvas.clientWidth||720),cssH=Math.max(420,canvas.clientHeight||820);
 if(canvas.width!==Math.round(cssW*dpr)||canvas.height!==Math.round(cssH*dpr)){canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr)}
 const ctx=canvas.getContext('2d')!;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cssW,cssH);
 const [art,layers]=await Promise.all([renderArtwork(d,1000,guides,selected),loadMockup(d.device)]),f=layout({width:cssW,height:cssH},d,view),c=modelConfig(d.device),radius=c.cornerRadius*f.w/1000;
 const bg=ctx.createLinearGradient(0,0,0,cssH);bg.addColorStop(0,'#f4f3f1');bg.addColorStop(.67,'#dedcd8');bg.addColorStop(.68,'#d0ceca');bg.addColorStop(1,'#e8e6e2');ctx.fillStyle=bg;ctx.fillRect(0,0,cssW,cssH);
 const halo=ctx.createRadialGradient(cssW*.39,cssH*.25,5,cssW*.47,cssH*.42,cssW*.58);halo.addColorStop(0,'rgba(255,255,255,.98)');halo.addColorStop(.56,'rgba(255,255,255,.24)');halo.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=halo;ctx.fillRect(0,0,cssW,cssH);
 ctx.save();ctx.filter='blur(20px)';ctx.fillStyle='rgba(18,22,25,.30)';ctx.beginPath();ctx.ellipse(cssW*.51,f.y+f.h+24,f.w*.72,19,-.03,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.save();ctx.translate(cssW/2,cssH/2);ctx.rotate(f.angle);ctx.transform(1,0,f.skew,1,0,0);ctx.translate(-cssW/2,-cssH/2);
 ctx.shadowColor='rgba(20,24,28,.36)';ctx.shadowBlur=34;ctx.shadowOffsetX=view==='Left'?-13:13;ctx.shadowOffsetY=22;rounded(ctx,f.x-5,f.y-5,f.w+10,f.h+10,radius+8);ctx.fillStyle='rgba(187,198,204,.28)';ctx.fill();ctx.shadowColor='transparent';
 ctx.drawImage(layers.base,f.x,f.y,f.w,f.h);
 ctx.save();rounded(ctx,f.x,f.y,f.w,f.h,radius);ctx.clip();ctx.drawImage(art,f.x,f.y,f.w,f.h);ctx.restore();
 ctx.drawImage(layers.shadow,f.x,f.y,f.w,f.h);
 ctx.drawImage(layers.caseOverlay,f.x,f.y,f.w,f.h);
 ctx.drawImage(layers.highlight,f.x,f.y,f.w,f.h);
 ctx.restore();
}

export default function CaseScene(props:Props){const canvas=useRef<HTMLCanvasElement>(null),drag=useRef<{layer:Layer;x:number;y:number;latest:Layer;mode:'move'|'scale'}|null>(null),[loading,setLoading]=useState(true);const redraw=useCallback(()=>{if(!canvas.current)return;paint(canvas.current,props.design,props.selected,!!props.guides,props.view||'Front').then(()=>setLoading(false)).catch(()=>setLoading(false))},[props.design,props.selected,props.guides,props.view]);useEffect(()=>{redraw();const el=canvas.current;if(!el)return;const observer=new ResizeObserver(redraw);observer.observe(el);return()=>observer.disconnect()},[redraw]);useEffect(()=>{props.onCapture?.(()=>canvas.current?.toDataURL('image/webp',.9)||'')},[props.onCapture,props.design,props.view]);const point=(e:ReactPointerEvent<HTMLCanvasElement>)=>{const el=canvas.current!,rect=el.getBoundingClientRect(),f=layout({width:rect.width,height:rect.height},props.design,props.view||'Front');return {x:(e.clientX-rect.left-f.x)/f.w*1000,y:(e.clientY-rect.top-f.y)/f.h*2000}};const down=(e:ReactPointerEvent<HTMLCanvasElement>)=>{if(!props.editing)return;const p=point(e),layer=hitLayer(props.design.layers,p.x,p.y);if(!layer||layer.locked)return;props.onSelect?.(layer.id);const scale=Math.abs(p.x-layer.x)>layer.width*.36&&Math.abs(p.y-layer.y)>layer.height*.3;drag.current={layer,x:p.x,y:p.y,latest:layer,mode:scale?'scale':'move'};e.currentTarget.setPointerCapture(e.pointerId)};const move=(e:ReactPointerEvent<HTMLCanvasElement>)=>{if(!drag.current||!props.editing)return;const p=point(e),dragState=drag.current,next=constrainLayer(dragState.mode==='scale'?{...dragState.layer,width:Math.max(70,Math.abs(p.x-dragState.layer.x)*2),height:Math.max(50,Math.abs(p.y-dragState.layer.y)*2)}:{...dragState.layer,x:dragState.layer.x+p.x-dragState.x,y:dragState.layer.y+p.y-dragState.y},props.design.device);dragState.latest=next;props.onMove?.(next,false)};const up=(e:ReactPointerEvent<HTMLCanvasElement>)=>{if(!drag.current)return;props.onMove?.(drag.current.latest,true);drag.current=null;e.currentTarget.releasePointerCapture(e.pointerId)};return <div className="case-scene realistic-mockup" aria-label={`Realistic ${props.design.device} phone case preview`}><canvas ref={canvas} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}/>{loading&&<p className="scene-loading">Compositing your case…</p>}<span className="mockup-badge">2.5D PRODUCT PREVIEW</span></div>}
