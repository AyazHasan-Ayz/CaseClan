'use client';
import {NextStudio} from 'next-sanity/studio';
import config from '@/sanity.config';
export default function StudioPage(){if(process.env.NEXT_PUBLIC_CMS_ENABLED!=='true'||!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID||!process.env.NEXT_PUBLIC_SANITY_DATASET)return <section className="prose-page"><h1>Content studio is paused</h1><p>The website continues to use its existing content. CMS setup can be resumed later.</p></section>;return <NextStudio config={config}/>}
