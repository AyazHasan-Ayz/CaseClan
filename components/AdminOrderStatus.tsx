'use client';
import {useEffect,useState} from 'react';
import type {Order} from './StoreProvider';
import {manualOrderStatuses} from '@/lib/fulfilment';
import OrderTrackingSummary from './OrderTrackingSummary';
export default function AdminOrderStatus({order,update}:{order:Order;update:(id:string,patch:Partial<Order>)=>Promise<void>}){
 const current=order.shipmentStatus||order.status,[status,setStatus]=useState(String(current)),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState('');
 useEffect(()=>setStatus(String(current)),[order.id,current]);
 const save=async()=>{setBusy(true);setFeedback('');try{await update(order.id,{status:status as Order['status'],shipmentStatus:status});setFeedback('Order status updated in Supabase.')}catch(e){setFeedback(e instanceof Error?e.message:'Could not update status.')}finally{setBusy(false)}};
 return <div className="admin-order-status"><h2>Order Status</h2><label>Order Status<select value={status} onChange={e=>setStatus(e.target.value)}>{[...new Set([String(current),...manualOrderStatuses])].map(value=><option key={value}>{value}</option>)}</select></label><button className="button" disabled={busy||status===current} onClick={()=>void save()}>{busy?'UPDATING…':'UPDATE STATUS'}</button>{feedback&&<p role="status">{feedback}</p>}{order.statusUpdatedAt&&<p className="small">Status updated {new Date(order.statusUpdatedAt).toLocaleString('en-IN')}</p>}<OrderTrackingSummary order={order} compact/></div>;
}
