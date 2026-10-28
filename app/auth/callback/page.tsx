'use client';
import {useEffect,useRef,useState} from 'react';
import {supabase} from '../../../lib/browser';
import {safeNext} from '../../../lib/return-path';
export default function Callback(){const [error,setError]=useState('');const started=useRef(false);useEffect(()=>{if(started.current)return;started.current=true;async function finish(){try{const p=new URLSearchParams(location.search);if(p.get('error'))throw Error(p.get('error_description')||'Sign-in was cancelled.');const code=p.get('code');if(!code)throw Error('Missing sign-in code. Please start again.');const {error}=await supabase().auth.exchangeCodeForSession(code);if(error)throw error;location.replace(safeNext(p.get('next')))}catch(e){setError((e as Error).message)}}finish()},[]);return <main className="wrap form-page"><h1>{error?'Unable to sign in':'Completing your sign-in…'}</h1>{error&&<><p role="alert">{error}</p><a className="btn" href="/login">Try again</a></>}</main>}
