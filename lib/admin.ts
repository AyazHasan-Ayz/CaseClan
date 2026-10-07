import type {Device,Product} from './catalog.ts';
import {devices as seededDevices,products as seededProducts} from './catalog.ts';
import {modelConfigs} from './mockups.ts';

export type ProductStatus='active'|'draft'|'archived';
export type Coupon={id:string;code:string;kind:'percentage'|'fixed';value:number;minimum:number;maximum?:number;usageLimit?:number;startsAt:string;endsAt:string;active:boolean};
export type Review={id:string;productId:string;customer:string;rating:number;text:string;status:'pending'|'approved'|'hidden';verified:boolean;createdAt:string};
export type MediaItem={id:string;name:string;url:string;kind:'product'|'artwork'|'mockup';createdAt:string};
export type StoreSettings={storeName:string;supportEmail:string;supportPhone:string;currency:string;codEnabled:boolean;onlinePaymentsEnabled:boolean;shippingCharge:number;freeShippingThreshold:number;codFee:number;customCasePrice:number;customizationEnabled:boolean};
export type AdminData={version:1;products:Product[];devices:Device[];coupons:Coupon[];reviews:Review[];media:MediaItem[];settings:StoreSettings};

export const defaultSettings:StoreSettings={storeName:'CASECLAN',supportEmail:'',supportPhone:'',currency:'INR',codEnabled:true,onlinePaymentsEnabled:true,shippingCharge:0,freeShippingThreshold:999,codFee:0,customCasePrice:seededProducts.find(p=>p.kind==='custom')?.price||1899,customizationEnabled:true};
const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value));
export function defaultAdminData():AdminData{return {version:1,products:clone(seededProducts),devices:clone(seededDevices.map(device=>({...device,mockup:modelConfigs[device.slug]}))),coupons:[],reviews:[],media:seededProducts.filter(p=>p.kind==='ready').map(p=>({id:`media-${p.id}`,name:p.name,url:p.image||'',kind:'product',createdAt:p.createdAt||new Date(0).toISOString()})),settings:{...defaultSettings}}}
export function normalizeAdminData(value:unknown):AdminData{const defaults=defaultAdminData(),raw=value&&typeof value==='object'?value as Partial<AdminData>:{};const incomingProducts=Array.isArray(raw.products)?raw.products:[];const products=Array.isArray(raw.products)?incomingProducts.map(item=>({...item})):defaults.products;const incomingDevices=Array.isArray(raw.devices)?raw.devices:[];const devices=Array.isArray(raw.devices)?incomingDevices.map(item=>({...item})):defaults.devices;const settings={...defaults.settings,...raw.settings};const custom=products.find(p=>p.kind==='custom');if(custom)custom.price=settings.customCasePrice;return {...defaults,...raw,version:1,products,devices,settings,coupons:Array.isArray(raw.coupons)?raw.coupons:[],reviews:Array.isArray(raw.reviews)?raw.reviews:[],media:Array.isArray(raw.media)?raw.media:defaults.media}}
export function applyAdminCatalog(data:AdminData){seededProducts.splice(0,seededProducts.length,...data.products);seededDevices.splice(0,seededDevices.length,...data.devices);for(const device of data.devices)if(device.mockup)modelConfigs[device.slug]=device.mockup}
export {productPrice} from './pricing.ts';


