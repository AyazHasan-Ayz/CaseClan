import type {Metadata} from 'next';
import {Suspense} from 'react';
import {AuthForm} from '@/components/AuthPages';
export const metadata:Metadata={title:'Forgot Password',robots:{index:false,follow:false}};
export default function Page(){return <Suspense fallback={null}><AuthForm mode="forgot"/></Suspense>}
