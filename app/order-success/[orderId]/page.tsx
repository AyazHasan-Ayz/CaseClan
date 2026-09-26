import {OrderSuccess} from '@/components/Account';
export function generateStaticParams(){return [{orderId:'order'}]}
export const metadata={title:'Order Confirmation'};
export default function Page(){return <OrderSuccess/>}
