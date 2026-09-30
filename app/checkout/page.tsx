import type {Metadata} from 'next';
import {Suspense} from 'react';
import {Checkout} from '@/components/Account';
import AuthGuard from '@/components/AuthGuard';
export const metadata:Metadata={title:'Checkout',robots:{index:false,follow:false}};
export default function Page(){return <Suspense fallback={null}><AuthGuard><Checkout/></AuthGuard></Suspense>}
