'use client';
import {useEffect,useState} from 'react';
import Portal from './portal';
import {supabase,configured} from '../lib/browser';
export default function Home(){const [user,setUser]=useState<{name:string;email:string}|null>(null),[ready,setReady]=useState(false);useEffect(()=>{if(!configured()){setReady(true);return}const db=supabase();db.auth.getUser().then(({data})=>{setUser(data.user?{name:data.user.user_metadata.full_name||data.user.email,email:data.user.email||''}:null);setReady(true)});const {data:{subscription}}=db.auth.onAuthStateChange((_e,s)=>{setUser(s?{name:s.user.user_metadata.full_name||s.user.email,email:s.user.email||''}:null)});return()=>subscription.unsubscribe()},[]);if(!ready)return <main className="wrap form-page">Loading your workspace…</main>;return <Portal user={user}/>}
