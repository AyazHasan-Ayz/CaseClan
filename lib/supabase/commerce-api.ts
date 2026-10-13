'use client';
import {createSupabaseBrowserClient} from './client';
import type {CommerceAction} from '@/lib/commerce-proxy';

export async function invokeCommerce(name: CommerceAction, body: unknown): Promise<{data: any; error: {message: string; context?: Response} | null}> {
  const {data: {session}, error} = await createSupabaseBrowserClient().auth.getSession();
  if (error || !session) return {data: null, error: {message: error?.message || 'Please sign in to continue.'}};
  try {
    const response = await fetch(`/api/commerce/${name}/`, {
      method: 'POST', headers: {'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`},
      body: JSON.stringify(body), cache: 'no-store',
    });
    const data = await response.clone().json();
    if (!response.ok) return {data: null, error: {message: data.error || 'Commerce request failed.', context: response}};
    return {data, error: null};
  } catch { return {data: null, error: {message: 'Unable to reach checkout. Check your connection and retry.'}}; }
}
