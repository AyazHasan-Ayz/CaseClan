'use client';

import {createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode} from 'react';
import type {Session,User} from '@supabase/supabase-js';
import {createSupabaseBrowserClient} from '@/lib/supabase/client';
import type {AccountRole} from '@/lib/auth';

export type CustomerAccount={id:string;email:string;phone:string;fullName:string;role:AccountRole};
type AuthContextValue={
  ready:boolean;session:Session|null;user:User|null;customer:CustomerAccount|null;
  signIn:(email:string,password:string)=>Promise<string|null>;
  signInWithGoogle:(next:string)=>Promise<string|null>;
  signUp:(email:string,password:string,fullName:string,redirectTo:string)=>Promise<{error:string|null;needsConfirmation:boolean}>;
  signOut:()=>Promise<void>;sendReset:(email:string)=>Promise<string|null>;
  updatePassword:(password:string)=>Promise<string|null>;refreshCustomer:()=>Promise<void>;
};
const AuthContext=createContext<AuthContextValue|null>(null);

export default function AuthProvider({children}:{children:ReactNode}){
  const supabase=useMemo(()=>createSupabaseBrowserClient(),[]),[session,setSession]=useState<Session|null>(null),[customer,setCustomer]=useState<CustomerAccount|null>(null),[ready,setReady]=useState(false);
  const loadCustomer=useCallback(async(user:User|null)=>{
    if(!user){setCustomer(null);return}
    const {data}=await supabase.from('customers').select('id,email,phone,full_name,role').eq('id',user.id).maybeSingle();
    setCustomer(data?{id:data.id,email:data.email||user.email||'',phone:data.phone||'',fullName:data.full_name||'',role:(data.role||'customer') as AccountRole}:{id:user.id,email:user.email||'',phone:'',fullName:String(user.user_metadata?.full_name||''),role:'customer'});
  },[supabase]);
  const refreshCustomer=useCallback(async()=>{
    // Validate the browser session with Supabase Auth, then query the profile
    // again. Administrative access must use the current database role rather
    // than a role cached before it was changed by an owner.
    const{data,error}=await supabase.auth.getUser();
    if(error||!data.user){setCustomer(null);return}
    await loadCustomer(data.user);
  },[loadCustomer,supabase]);
  useEffect(()=>{let mounted=true;void supabase.auth.getSession().then(async({data})=>{if(!mounted)return;setSession(data.session);await loadCustomer(data.session?.user||null);if(mounted)setReady(true)});const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);void loadCustomer(next?.user||null);setReady(true)});return()=>{mounted=false;subscription.unsubscribe()}},[loadCustomer,supabase]);
  const value:AuthContextValue={ready,session,user:session?.user||null,customer,
    signIn:async(email,password)=>{const{error}=await supabase.auth.signInWithPassword({email,password});return error?.message||null},
    signInWithGoogle:async next=>{const redirectTo=`${location.origin}${next}`;const{error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo}});return error?.message||null},
    signUp:async(email,password,fullName,redirectTo)=>{const{data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName},emailRedirectTo:redirectTo}});return{error:error?.message||null,needsConfirmation:!data.session}},
    signOut:async()=>{await supabase.auth.signOut();setCustomer(null)},
    sendReset:async email=>{const redirectTo=`${location.origin}/reset-password/`;const{error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});return error?.message||null},
    updatePassword:async password=>{const{error}=await supabase.auth.updateUser({password});return error?.message||null},
    refreshCustomer};
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('Missing AuthProvider');return value}
