import type {Metadata} from 'next';
import {Suspense} from 'react';
import Account from '@/components/Account';
import AuthGuard from '@/components/AuthGuard';
export const metadata:Metadata={title:'My Account',robots:{index:false,follow:false}};
export default function Page(){return <Suspense fallback={null}><AuthGuard><Account/></AuthGuard></Suspense>}
