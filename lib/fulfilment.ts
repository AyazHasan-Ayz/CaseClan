import type {Json} from '@/lib/supabase/types';
import type {Order,StatusHistoryItem} from '@/components/StoreProvider';

export const manualOrderStatuses = ['Pending','Confirmed','Processing','Printing','Printed','Packed','Shipped','Out for Delivery','Delivered','Cancelled','RTO','On Hold'] as const;
export const fulfilmentStatuses = ['Pending','Submitted','In Production','Fulfilled','On Hold','Cancelled'] as const;

export function jsonRecord(value:Json|undefined):Record<string,Json|undefined>{
  return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
}

export function manualFulfilmentFromMetadata(value:Json):Partial<Order>{
  const metadata=jsonRecord(value),history=Array.isArray(metadata.status_history)?metadata.status_history:[];
  return {
    couponCode:typeof metadata.coupon_code==='string'?metadata.coupon_code:undefined,
    confirmedAt:typeof metadata.confirmed_at==='string'?metadata.confirmed_at:undefined,
    fulfilmentProvider:typeof metadata.fulfilment_provider==='string'?metadata.fulfilment_provider:'Qikink',
    qikinkOrderId:typeof metadata.qikink_order_id==='string'?metadata.qikink_order_id:undefined,
    fulfilmentStatus:typeof metadata.fulfilment_status==='string'?metadata.fulfilment_status:'Pending',
    shipmentStatus:typeof metadata.shipment_status==='string'?metadata.shipment_status:undefined,
    trackingUrl:typeof metadata.tracking_url==='string'?metadata.tracking_url:undefined,
    statusHistory:history.flatMap(item=>{
      const row=jsonRecord(item);
      return typeof row.status==='string'&&typeof row.at==='string'?[{status:row.status,at:row.at} as StatusHistoryItem]:[];
    }),
  };
}

export function statusForCustomer(status:string){
  if(status==='new'||status==='New')return 'Order Placed';
  return status;
}
