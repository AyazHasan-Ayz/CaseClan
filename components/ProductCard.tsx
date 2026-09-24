'use client';
import Link from 'next/link';
import {Heart,ShoppingBag,ArrowRight} from 'lucide-react';
import {Product,productImage,money,deviceName,defaultDevice} from '@/lib/catalog';
import {useStore} from './StoreProvider';

export default function ProductCard({product:p,device}:{product:Product;device?:string}){
 const store=useStore(),activeDevice=device||store.selectedDevice||defaultDevice(p),href=`/product/${p.id}/?device=${activeDevice}`;
 return <article className="product-card"><div className="product-picture"><Link href={href} aria-label={`View ${p.name}`}><img src={productImage(p)} alt={`${p.name} fixed design`} loading="lazy"/></Link><span className="product-clan">READY DESIGN</span><button className={`wish-button ${store.wishlist.includes(p.id)?'saved':''}`} aria-label={`${store.wishlist.includes(p.id)?'Remove':'Save'} ${p.name} ${store.wishlist.includes(p.id)?'from':'to'} wishlist`} aria-pressed={store.wishlist.includes(p.id)} onClick={()=>store.toggleWish(p.id)}><Heart size={16} fill={store.wishlist.includes(p.id)?'currentColor':'none'}/></button><Link className="product-view" href={href}>VIEW DESIGN <ArrowRight size={13}/></Link></div><div className="product-info"><Link href={href}><h3>{p.name}</h3></Link><span className="rating"><span>☆☆☆☆☆</span><span className="muted">New · Unrated</span></span><strong>{money(p.price)}</strong><p className="compatibility">For {deviceName(activeDevice)}</p><Link className="quick-add" aria-label={`Choose ${p.name}`} href={href}><ShoppingBag size={15}/></Link></div></article>;
}
