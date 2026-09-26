export const commerceConfig={
 freeShippingThreshold:999,
 standardShippingFee:0,
 codFee:0,
 supportEmail:'',
 deliveryEstimate:'Delivery timing will be confirmed when your order is accepted.',
} as const;

export const orderSteps=['Order Placed','Confirmed','Printing / Processing','Packed','Shipped','Out for Delivery','Delivered'] as const;
export type OrderStatus=typeof orderSteps[number];
export type PaymentMethod='Online Payment'|'Cash on Delivery';
export type PaymentStatus='Not processed'|'Pending'|'Paid'|'Failed';
export type ShippingAddress={line1:string;line2:string;landmark:string;city:string;state:string;pin:string};
export type CustomerProfile={name:string;email:string;phone:string;address:string};
export type SavedAddress=ShippingAddress&{id:string;label:string;isDefault:boolean};

export function subtotal(items:{productId:string;quantity:number}[],prices:Record<string,number>){return items.reduce((sum,item)=>sum+(prices[item.productId]||0)*item.quantity,0)}
export function shippingFor(value:number){return value>=commerceConfig.freeShippingThreshold?0:commerceConfig.standardShippingFee}
export function discountFor(){return 0}
export function codFeeFor(method:PaymentMethod){return method==='Cash on Delivery'?commerceConfig.codFee:0}
export function validIndianPhone(value:string){return /^\d{10}$/.test(value.replace(/\D/g,''))}
export function validPin(value:string){return /^\d{6}$/.test(value.trim())}
