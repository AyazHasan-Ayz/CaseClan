import Customizer from '@/components/Customizer';
import {pageMetadata} from '@/lib/seo/metadata';
export const metadata=pageMetadata({title:'Custom Case Editor | CASECLAN',description:'Create a custom CASECLAN case from a blank model-specific canvas.',path:'/customize/',index:false});
export default function Page(){return <Customizer/>}
