'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {useRouter,useSearchParams} from 'next/navigation';
import {safeNextPath} from '@/lib/auth';
import {useAuth} from './AuthProvider';

function GoogleIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.5-4H3.2v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.5 14.1a6 6 0 0 1 0-4.2V7.3H3.2a10 10 0 0 0 0 9.4l3.3-2.6Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 4 1.5l3-3A10 10 0 0 0 3.2 7.3l3.3 2.6A5.8 5.8 0 0 1 12 5.9Z"/></svg>}

export function AuthForm({mode,showGoogle=true}:{mode:'login'|'signup'|'forgot';showGoogle?:boolean}){
  const auth=useAuth(),router=useRouter(),params=useSearchParams();
  const next=safeNextPath(params.get('next'),'/account/');
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState('');
  const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  useEffect(()=>{if(auth.ready&&auth.user&&mode!=='forgot')router.replace(next)},[auth.ready,auth.user,mode,next,router]);
  const google=async()=>{setBusy(true);setNotice('');const error=await auth.signInWithGoogle(next);if(error){setNotice(error);setBusy(false)}};
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();setBusy(true);setNotice('');
    if(mode==='forgot'){const error=await auth.sendReset(email);setNotice(error||'Check your email for a secure password-reset link.');setBusy(false);return}
    if(mode==='signup'){const result=await auth.signUp(email,password,name,`${location.origin}/login/?next=${encodeURIComponent(next)}`);if(result.error)setNotice(result.error);else if(result.needsConfirmation)setNotice('Account created. Check your email to confirm it, then sign in.');else router.replace(next);setBusy(false);return}
    const error=await auth.signIn(email,password);if(error){setNotice(error);setBusy(false)}else router.replace(next)
  };
  const heading=mode==='login'?'Welcome back.':mode==='signup'?'Create your account.':'Reset your password.';
  return <>
    <div className="page-intro auth-intro"><p className="eyebrow">YOUR CASECLAN ACCOUNT</p><h1>{heading}</h1><p>{mode==='forgot'?'We will email you a secure reset link.':'Your cart and custom design stay on this device while you sign in.'}</p></div>
    <section className="auth-card">
      <form onSubmit={submit}>
        {mode==='signup'&&<label className="field-label">Full name<input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label>}
        <label className="field-label">Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
        {mode!=='forgot'&&<label className="field-label">Password<input required type="password" minLength={8} autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>}
        <button disabled={busy} className="button wide">{busy?'PLEASE WAIT…':mode==='login'?'LOGIN':mode==='signup'?'CREATE ACCOUNT':'SEND RESET LINK'}</button>
      </form>
      {notice&&<p className="form-note" role="status">{notice}</p>}
      {mode==='login'&&<div className="auth-links"><Link href={`/forgot-password/?next=${encodeURIComponent(next)}`}>Forgot Password</Link><Link href={`/signup/?next=${encodeURIComponent(next)}`}>Sign Up</Link></div>}
      {mode==='forgot'&&<div className="auth-links auth-links-centered"><Link href={`/login/?next=${encodeURIComponent(next)}`}>Back to login</Link></div>}
      {mode!=='forgot'&&showGoogle&&<><div className="auth-divider"><span>OR</span></div><button type="button" disabled={busy} className="button outline wide google-auth" onClick={()=>void google()}><GoogleIcon/> CONTINUE WITH GOOGLE</button></>}
      {mode==='signup'&&<div className="auth-links auth-links-centered"><Link href={`/login/?next=${encodeURIComponent(next)}`}>Already have an account? Log in</Link></div>}
    </section>
  </>
}

export function ResetPassword(){
  const auth=useAuth(),router=useRouter(),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const submit=async(e:React.FormEvent)=>{e.preventDefault();if(password!==confirm){setNotice('Passwords do not match.');return}setBusy(true);const error=await auth.updatePassword(password);setNotice(error||'Password updated. Redirecting to your account…');setBusy(false);if(!error)setTimeout(()=>router.replace('/account/'),700)};
  return <><div className="page-intro auth-intro"><p className="eyebrow">SECURE ACCOUNT RECOVERY</p><h1>Choose a new password.</h1></div><section className="auth-card"><form onSubmit={submit}><label className="field-label">New password<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label className="field-label">Confirm password<input required minLength={8} type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button disabled={busy} className="button wide">UPDATE PASSWORD</button></form>{notice&&<p className="form-note" role="status">{notice}</p>}</section></>
}
