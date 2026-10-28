'use client';
import {useEffect} from 'react';
import {supabase} from '../../lib/browser';
export default function Logout(){useEffect(()=>{supabase().auth.signOut().finally(()=>location.replace('/'))},[]);return <main className="wrap form-page">Signing out…</main>}
