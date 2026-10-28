'use client';
import {useState} from 'react';
import {supabase} from '../../../lib/browser';
import {safeNext} from '../../../lib/return-path';
export default function Confirm(){const[error,setError]=useState(''),[busy,setBusy]=useState(false);async function verify(){setBusy(true);try{const p=new URLSearchParams(location.search);const token=p.get('token_hash');if(!token)throw Error('This sign-in link is incomplete. Request a new one.');const{error}=await supabase().auth.verifyOtp({token_hash:token,type:'email'});if(error)throw error;location.replace(safeNext(p.get('next')))}catch(e){setError((e as Error).message);setBusy(false)}}return <main className="wrap form-page"><section className="login-card"><h1>Continue to your workspace.</h1><p>Confirm to securely sign in with this email link.</p><button className="btn" onClick={verify} disabled={busy}>{busy?'Verifying…':'Complete sign-in'}</button>{error&&<p className="error" role="alert">{error}</p>}</section></main>}
