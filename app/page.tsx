import Home from '@/components/Home';
import type {Metadata} from 'next';
import {cmsMetadata} from '@/lib/cms/metadata';
import {getHomepageContent} from '@/lib/cms/server';
export async function generateMetadata():Promise<Metadata>{return cmsMetadata((await getHomepageContent())?.seo,{title:'Personalized Phone Covers & Custom Mobile Cases | CASECLAN',description:'Shop premium ready-design phone cases or choose your model and create a custom CASECLAN case from a blank canvas.',path:'/'});}
export default function Page(){return <Home/>}
