'use client';
import {useEffect,useState} from 'react';
import Manager from './manager';
import {supabase,configured} from '../../lib/browser';
export default function Page(){const [state,setState]=useState<'loading'|'login'|'denied'|'allowed'>('loading');useEffect(()=>{async function check(){if(!configured()){setState('denied');return}const db=supabase();const{data:{user}}=await db.auth.getUser();if(!user){setState('login');return}const{data}=await db.rpc('is_recruiter');setState(data===true?'allowed':'denied')}check().catch(()=>setState('denied'))},[]);if(state==='allowed')return <Manager/>;return <main className="wrap form-page"><h1>{state==='loading'?'Loading…':'Recruiter workspace'}</h1>{state==='login'?<a className="btn" href="/login?next=%2Fmanage">Sign in to continue</a>:state==='denied'?<><p>This area is reserved for the recruitment team.</p><a className="btn" href="/">Back to home</a></>:null}</main>}
