'use client';

import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowRight,Check,Heart,LockKeyhole,ShieldCheck,Truck} from 'lucide-react';
import {Product,defaultDevice,deviceName,money,productImage} from '@/lib/catalog';
import {useStore} from './StoreProvider';

export default function ProductDetail({product:p}:{product:Product}){
 const store=useStore(),router=useRouter(),initialized=useRef(false);
 const [device,setDevice]=useState(()=>store.selectedDevice&&p.devices.includes(store.selectedDevice)?store.selectedDevice:defaultDevice(p));
 useEffect(()=>{if(!store.ready||initialized.current)return;initialized.current=true;const query=new URLSearchParams(window.location.search).get('device');const next=query&&p.devices.includes(query)?query:store.selectedDevice&&p.devices.includes(store.selectedDevice)?store.selectedDevice:defaultDevice(p);setDevice(next);store.setSelectedDevice(next)},[p,store.ready]);
 const choose=(next:string)=>{initialized.current=true;setDevice(next);store.setSelectedDevice(next)};
 const add=(buy=false)=>{store.add(p,device,p.colors[0]);if(buy){store.setDrawer(false);router.push('/checkout/')}};
 return <>
  <div className="product-page">
   <p className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/ready-designs/">Ready Designs</Link><span>/</span>{p.name}</p>
   <div className="product-detail-layout">
    <div className="gallery fixed-design-gallery">
     <div className="gallery-main supplied-gallery"><img src={productImage(p)} alt={`${p.name} fixed CASECLAN phone case artwork`} width="900" height="1125"/></div>
     <p className="small muted">The artwork shown is the finished design. Your phone selection changes only the physical case fit.</p>
    </div>
    <div className="product-details fixed-product-details">
     <p className="eyebrow">READY DESIGN · FIXED ARTWORK</p>
     <h1>{p.name.toUpperCase()}</h1>
     <p className="detail-rating">☆☆☆☆☆ <span className="muted">New · Unrated</span></p>
     <p className="detail-price">{money(p.price)} <span>Inclusive of all taxes</span></p>
     <p className="product-description">A finished CASECLAN design printed exactly as shown on a premium protective case made for your selected phone.</p>
     <div className="template-lock-note"><LockKeyhole size={18}/><div><strong>Artwork locked as shown</strong><span>No names, colors, graphics, or layout elements are changed.</span></div></div>
     <label className="field-label">Phone model<select value={device} onChange={event=>choose(event.target.value)}>{p.devices.map(item=><option key={item} value={item}>{deviceName(item)}</option>)}</select></label>
     <button className="button wide" onClick={()=>add()}>ADD TO CART — {money(p.price)} <ArrowRight size={15}/></button>
     <button className="button outline wide" onClick={()=>add(true)}>BUY NOW <ArrowRight size={15}/></button>
     <div className="purchase-benefits"><span><Truck size={18}/>Free shipping above ₹999</span><span><Check size={18}/>Easy 7-day returns</span><span><ShieldCheck size={18}/>Secure payment</span></div>
     <button type="button" className="wishlist-detail" aria-label="Save to wishlist" aria-pressed={store.wishlist.includes(p.id)} onClick={()=>store.toggleWish(p.id)}><Heart size={18} fill={store.wishlist.includes(p.id)?'currentColor':'none'}/> Save this design</button>
    </div>
   </div>
  </div>
  <section className="section product-faq">
   <div><p className="eyebrow">SEE IT. CHOOSE YOUR PHONE. BUY IT.</p><h2>The exact design you selected.</h2></div>
   <div>
    <details><summary>Can I edit this artwork?<span>+</span></summary><p>No. Ready designs are sold exactly as shown so their typography, colors, spacing, and composition stay intact.</p></details>
    <details><summary>What does the phone selector change?<span>+</span></summary><p>It selects the case shape and camera cutout that fit your phone. It does not alter the artwork.</p></details>
    <details><summary>How do I create my own design?<span>+</span></summary><p>Choose your model on the homepage and start with a blank case in the custom editor.</p></details>
   </div>
  </section>
 </>;
}
