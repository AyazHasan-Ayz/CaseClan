'use client';
import JsonLd from './seo/JsonLd';
import {faqSchema} from '@/lib/seo/schemas';
import ProductPrice from './ProductPrice';
import {productPrice as catalogPrice} from '@/lib/pricing';

import Link from 'next/link';
import ProductGallery from './ProductGallery';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowRight,Check,Heart,LockKeyhole,Minus,Plus,ShieldCheck,Truck} from 'lucide-react';
import {Product,defaultDevice,deviceName,money,productImage} from '@/lib/catalog';
import {productPrice} from '@/lib/admin';
import {useStore} from './StoreProvider';
import {useAuth} from './AuthProvider';
import {useCms} from './CmsProvider';
import {loginHref} from '@/lib/auth';

export default function ProductDetail({product:initialProduct,preview=false}:{product:Product;preview?:boolean}){
 const faqs=useCms().faqs.filter(f=>f.placements?.includes('product')&&(!f.productSlugs?.length||f.productSlugs.includes(initialProduct.id)));const store=useStore(),auth=useAuth(),router=useRouter(),initialized=useRef(false),p=preview?initialProduct:store.adminData.products.find(item=>item.id===initialProduct.id)||initialProduct;
 const [device,setDevice]=useState(()=>store.selectedDevice&&p.devices.includes(store.selectedDevice)?store.selectedDevice:defaultDevice(p)),[quantity,setQuantity]=useState(1),[modelError,setModelError]=useState(false);
 const modelSelect=useRef<HTMLSelectElement>(null);
 useEffect(()=>{if(!store.ready||initialized.current)return;initialized.current=true;const query=new URLSearchParams(window.location.search).get('device');const next=query&&p.devices.includes(query)?query:store.selectedDevice&&p.devices.includes(store.selectedDevice)?store.selectedDevice:defaultDevice(p);setDevice(next);store.setSelectedDevice(next)},[p,store.ready]);
 const choose=(next:string)=>{initialized.current=true;setDevice(next);store.setSelectedDevice(next);setModelError(false)};
 const price=productPrice(p,device),supportedDevices=p.devices.filter(slug=>store.adminData.devices.some(item=>item.slug===slug&&item.active!==false&&item.available!==false));
 const add=(buy=false)=>{
  if(preview||!store.ready)return;
  if(!device||!supportedDevices.includes(device)){
   setModelError(true);
   requestAnimationFrame(()=>{modelSelect.current?.scrollIntoView({behavior:'smooth',block:'center'});modelSelect.current?.focus({preventScroll:true})});
   return;
  }
  setModelError(false);
  const existing=store.bag.some(item=>item.productId===p.id&&item.device===device&&item.color===p.colors[0]&&!item.design);
  if(!buy||!existing)store.add(p,device,p.colors[0],undefined,quantity);
  if(buy){store.setDrawer(false);router.push(auth.user?'/checkout/':loginHref('/checkout/'))}
 };
 if(!preview&&p.status&&p.status!=='active')return <section className="empty-state"><h1>Case unavailable</h1><p>This design is inactive or no longer available.</p><Link className="button" href="/shop/">SHOP CASES</Link></section>;
 return <>
  <div className="product-page">
   <p className="breadcrumbs"><Link href="/">Home</Link><span>/</span><Link href="/ready-designs/">Ready Designs</Link><span>/</span>{p.name}</p>
   <div className="product-detail-layout">
    <div className="gallery fixed-design-gallery">
     <ProductGallery key={p.id} product={p}/>
     <p className="small muted">The artwork shown is the finished design. Your phone selection changes only the physical case fit.</p>
    </div>
    <div className="product-details fixed-product-details">
     <p className="eyebrow">READY DESIGN · FIXED ARTWORK</p>
     <div className="ready-design-purchase" aria-label="Purchase this ready design">
      <button type="button" disabled={preview||!store.ready} className="button outline wide" onClick={()=>add()}>ADD TO CART — {money(price)} <ArrowRight size={15}/></button>
      <button type="button" disabled={preview||!store.ready} className="button wide" onClick={()=>add(true)}>BUY NOW <ArrowRight size={15}/></button>
     </div>
     <h1>{p.name.toUpperCase()}</h1>
     <p className="detail-rating">☆☆☆☆☆ <span className="muted">New · Unrated</span></p>
     <p className="detail-price"><ProductPrice product={p} device={device}/> <span>Inclusive of all taxes</span></p>
     <p className="product-description">{p.description||p.shortDescription||"A finished CASECLAN design printed exactly as shown on a premium protective case made for your selected phone."}</p>{preview&&<p role="status">Draft preview — purchasing is disabled.</p>}
     <div className="template-lock-note"><LockKeyhole size={18}/><div><strong>Artwork locked as shown</strong><span>No names, colors, graphics, or layout elements are changed.</span></div></div>
     <label className="field-label">Phone model<select ref={modelSelect} value={supportedDevices.includes(device)?device:''} aria-invalid={modelError||undefined} aria-describedby={modelError?'phone-model-error':undefined} onChange={event=>choose(event.target.value)}><option value="">Select your phone model</option>{supportedDevices.map(item=><option key={item} value={item}>{deviceName(item)}</option>)}</select></label>
     {modelError&&<p id="phone-model-error" className="purchase-validation" role="alert">Please select your phone model.</p>}
     <div className="product-quantity"><span>Quantity</span><div className="quantity"><button type="button" aria-label="Decrease quantity" disabled={quantity<=1} onClick={()=>setQuantity(value=>Math.max(1,value-1))}><Minus size={15}/></button><output aria-live="polite">{quantity}</output><button type="button" aria-label="Increase quantity" disabled={quantity>=10} onClick={()=>setQuantity(value=>Math.min(10,value+1))}><Plus size={15}/></button></div></div>
     <div className="purchase-benefits"><span><Truck size={18}/>Free shipping above ₹999</span><span><Check size={18}/>Easy 7-day returns</span><span><ShieldCheck size={18}/>Secure payment</span></div>
     <button type="button" className="wishlist-detail" aria-label="Save to wishlist" aria-pressed={store.wishlist.includes(p.id)} onClick={()=>store.toggleWish(p.id)}><Heart size={18} fill={store.wishlist.includes(p.id)?'currentColor':'none'}/> Save this design</button>
    </div>
   </div>
  </div>
  <section className="section product-faq">{faqs.length>0&&<JsonLd data={faqSchema([{title:"Product FAQs",items:faqs.map(f=>[f.question,f.answer] as const)}])}/> }
   <div><p className="eyebrow">SEE IT. CHOOSE YOUR PHONE. BUY IT.</p><h2>The exact design you selected.</h2></div>
   <div>
    {faqs.map(f=><details key={f._id}><summary>{f.question}<span>+</span></summary><p>{f.answer}</p></details>)}
    {!faqs.length&&<><details><summary>Can I edit this artwork?<span>+</span></summary><p>No. Ready designs are sold exactly as shown so their typography, colors, spacing, and composition stay intact.</p></details>
    <details><summary>What does the phone selector change?<span>+</span></summary><p>It selects the case shape and camera cutout that fit your phone. It does not alter the artwork.</p></details>
    <details><summary>How do I create my own design?<span>+</span></summary><p>Choose your model on the homepage and start with a blank case in the custom editor.</p></details></>}
   </div>
  </section>
 </>;
}
