import CmsPreview from '@/components/CmsPreview';
import AuthGuard from '@/components/AuthGuard';
import {Suspense} from 'react';
import {isCmsEnabled} from '@/lib/cms/config';
export const metadata={title:'Content Preview',robots:{index:false,follow:false}};
export default function Page(){if(!isCmsEnabled())return <section className="prose-page"><h1>Content preview is paused</h1><p>The website continues to use its existing content.</p></section>;return <Suspense fallback={<p className="studio-loading">Loading preview…</p>}><AuthGuard><CmsPreview/></AuthGuard></Suspense>}
