'use client';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
let client:SupabaseClient|undefined;
export function configured(){return !!process.env.NEXT_PUBLIC_SUPABASE_URL&&!!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
export function supabase(){if(!configured())throw Error('Sign-in is not configured yet. Please contact us.');if(!client)client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{flowType:'pkce',detectSessionInUrl:false}});return client}
export async function apiFetch(input:RequestInfo|URL,init:RequestInit={}){const {data:{session}}=await supabase().auth.getSession();const h=new Headers(init.headers);if(session)h.set('Authorization','Bearer '+session.access_token);return globalThis.fetch(input,{...init,headers:h,cache:'no-store'})}
