import type {Metadata} from 'next';
import {ResetPassword} from '@/components/AuthPages';
export const metadata:Metadata={title:'Reset Password',robots:{index:false,follow:false}};
export default function Page(){return <ResetPassword/>}
