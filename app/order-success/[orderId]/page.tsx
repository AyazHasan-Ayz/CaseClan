import {OrderSuccess} from '@/components/Account';
import {pageMetadata} from '@/lib/seo/metadata';
export function generateStaticParams(){return [{orderId:'order'}]}
export const metadata=pageMetadata({title:'Order Confirmation | CASECLAN',description:'Review your CASECLAN order confirmation.',path:'/order-success/order/',index:false});
export default function Page(){return <OrderSuccess/>}
