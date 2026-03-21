'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const inp = {width:'100%',padding:'10px 16px',border:'1px solid #334155',borderRadius:8,background:'#0f172a',color:'#e2e8f0',fontSize:15,outline:'none'};
const lbl = {display:'block',fontSize:14,fontWeight:500,color:'#94a3b8',marginBottom:8};

export default function LoginPage() {
  const router = useRouter();
  const [f, setF] = useState({email:'',password:''});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)});
      const d = await r.json();
      if(!r.ok){setErr(d.error||d.detail||'Login failed');setBusy(false);return;}
      localStorage.setItem('access_token',d.access_token);
      localStorage.setItem('user',JSON.stringify({id:d.user_id,email:d.email}));
      router.push('/dashboard');
    } catch{setErr('Network error');setBusy(false);}
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#020617,#0c1445,#0f172a)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{width:'100%',maxWidth:440}}>
        <div style={{background:'#1e293b',borderRadius:16,boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)',padding:'40px 32px',border:'1px solid #334155'}}>
          <div style={{textAlign:'center',marginBottom:32}}>
            <h1 style={{fontSize:28,fontWeight:700,color:'#f1f5f9',marginBottom:8}}>Welcome Back</h1>
            <p style={{color:'#94a3b8'}}>Login to your BookMe account</p>
          </div>
          {err&&<div style={{marginBottom:20,padding:12,background:'#7f1d1d33',border:'1px solid #991b1b',borderRadius:8,color:'#fca5a5',fontSize:14}}>{err}</div>}
          <form onSubmit={go}>
            <div style={{marginBottom:16}}><label style={lbl}>Email Address</label><input type="email" name="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} required placeholder="you@example.com" style={inp}/></div>
            <div style={{marginBottom:24}}><label style={lbl}>Password</label><input type="password" name="password" value={f.password} onChange={e=>setF({...f,password:e.target.value})} required placeholder="********" style={inp}/></div>
            <button type="submit" disabled={busy} style={{width:'100%',background:busy?'#475569':'linear-gradient(90deg,#2563eb,#3b82f6)',color:'#fff',padding:'14px 0',borderRadius:10,fontWeight:700,fontSize:16,opacity:busy?0.6:1}}>{busy?'Logging in...':'Login'}</button>
          </form>
          <div style={{marginTop:24,textAlign:'center',color:'#94a3b8',fontSize:14}}>
            Don&apos;t have an account? <Link href="/auth/signup" style={{color:'#3b82f6',fontWeight:600}}>Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
