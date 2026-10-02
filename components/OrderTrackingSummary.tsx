'use client';
import {Check,ExternalLink} from 'lucide-react';
import type {Order} from './StoreProvider';
import {orderSteps} from '@/lib/commerce';
import {statusForCustomer} from '@/lib/fulfilment';

export default function OrderTrackingSummary({order,compact=false}:{order:Order;compact?:boolean}){
 const raw=String(order.shipmentStatus||order.status),status=statusForCustomer(raw),current=orderSteps.indexOf(status as typeof orderSteps[number]);
 return <section className={`tracking-summary${compact?' compact':''}`}><div className="tracking-summary-head"><span>Current status</span><strong>{status}</strong></div><ol className="order-timeline">{orderSteps.map((step,index)=><li className={current>=0&&index<=current?'complete':''} key={step}><span>{index<current?<Check size={13}/>:index+1}</span><div><strong>{step}</strong>{index===current&&<small>Current status</small>}</div></li>)}</ol>{(order.courier||order.trackingId||order.trackingUrl)&&<dl className="tracking-meta">{order.courier&&<><dt>Courier</dt><dd>{order.courier}</dd></>}{order.trackingId&&<><dt>AWB / Tracking ID</dt><dd>{order.trackingId}</dd></>}{order.trackingUrl&&<><dt>Shipment tracking</dt><dd><a className="text-link" href={order.trackingUrl} target="_blank" rel="noreferrer">TRACK SHIPMENT <ExternalLink size={12}/></a></dd></>}</dl>}</section>
}
