import type {Product} from './catalog';

/** Catalog prices are rupees. Conversion at provider boundaries is explicit. */
export function toPaise(rupees:number){return Math.round(rupees*100)}
export function productPrice(product:Pick<Product,'price'|'modelPrices'>,device?:string){return (device?product.modelPrices?.[device]:undefined)??product.price}
export function priceDisplay(product:Pick<Product,'price'|'modelPrices'|'compareAtPrice'>,device?:string,quantity=1){
 const selling=productPrice(product,device),compare=product.compareAtPrice;
 return{selling:toPaise(selling*quantity)/100,compare:compare!=null&&compare>selling?toPaise(compare*quantity)/100:null};
}
export type CheckoutQuote={subtotal:number;discount_amount:number;shipping_amount:number;cod_fee:number;total:number;currency:string;fingerprint:string;items:{product_slug:string;phone_model_slug:string;quantity:number;unit_price:number}[]};
