'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import ProductDetail from './ProductDetail';
import {useStore} from './StoreProvider';
export default function ProductRuntime(){const store=useStore(),[id,setId]=useState('');useEffect(()=>setId(new URLSearchParams(location.search).get('id')||''),[]);const product=store.adminData.products.find(item=>item.id===id&&item.kind==='ready'&&item.status==='active');if(!store.ready)return <div className="studio-loading">Loading case…</div>;return product?<ProductDetail product={product}/>:<section className="empty-state"><h1>Case unavailable</h1><p>This design is inactive or no longer available.</p><Link className="button" href="/shop/">SHOP CASES</Link></section>}
