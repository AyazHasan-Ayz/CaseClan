import type {Product} from '@/lib/catalog';
import {money} from '@/lib/catalog';
import {priceDisplay} from '@/lib/pricing';
export default function ProductPrice({product,device,quantity=1}:{product:Product;device?:string;quantity?:number}){
 const price=priceDisplay(product,device,quantity);
 return <span className="product-price"><strong>{money(price.selling)}</strong>{price.compare!==null&&<del aria-label={`Original price ${money(price.compare)}`}>{money(price.compare)}</del>}</span>;
}
