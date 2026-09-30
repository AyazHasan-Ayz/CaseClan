'use client';
import {useEffect,type ReactNode} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {loginHref,safeNextPath} from '@/lib/auth';
import {useAuth} from './AuthProvider';

export default function AuthGuard({children}:{children:ReactNode}){const{ready,user}=useAuth(),router=useRouter(),pathname=usePathname(),params=useSearchParams();useEffect(()=>{if(ready&&!user){const query=params.toString(),next=safeNextPath(`${pathname}${query?`?${query}`:''}`,'/');router.replace(loginHref(next))}},[ready,user,router,pathname,params]);if(!ready||!user)return <main className="auth-loading" aria-live="polite">Checking your secure session…</main>;return <>{children}</>}
