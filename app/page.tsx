import Home from '@/components/Home';
import type {Metadata} from 'next';
import {pageMetadata} from '@/lib/seo/metadata';
export const metadata:Metadata=pageMetadata({title:'Personalized Phone Covers & Custom Mobile Cases | CASECLAN',description:'Shop premium ready-design phone cases or choose your model and create a custom CASECLAN case from a blank canvas.',path:'/'});
export default function Page(){return <Home/>}
