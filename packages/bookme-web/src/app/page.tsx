'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{email?: string} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const ud = localStorage.getItem('user');
    if (token && ud) { setIsLoggedIn(true); try { setUser(JSON.parse(ud)); } catch {} }
    setLoading(false);
  }, []);

  if (loading) return (
    <div style={center}>
      <div style={{width:48,height:48,border:'3px solid transparent',borderTopColor:'#3b82f6',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 16px'}}/>
      <p style={{color:'#94a3b8'}}>Loading...</p>
    </div>
  );

  if (isLoggedIn && user) return (
    <div style={{minHeight:'100vh',background:'#0f172a'}}>
      <nav style={{background:'#1e293b',borderBottom:'1px solid #334155',padding:'16px 32px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <h1 style={{fontSize:24,fontWeight:800,color:'#3b82f6'}}>BookMe</h1>
          <span style={{fontSize:14,color:'#64748b'}}>AI Writing Platform</span>
        </div>
        <button onClick={()=>{localStorage.removeItem('access_token');localStorage.removeItem('user');window.location.reload()}} style={{padding:'8px 20px',background:'#dc2626',color:'#fff',borderRadius:8,fontWeight:600}}>Logout</button>
      </nav>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'48px 24px'}}>
        <h2 style={{fontSize:30,fontWeight:700,color:'#f1f5f9',marginBottom:8}}>Welcome, {user.email}!</h2>
        <p style={{color:'#94a3b8',marginBottom:32}}>Your AI writing assistant is ready</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:24}}>
          {[{t:'New Document',d:'Start creating new content',bg:'#1e3a5f',bc:'#2563eb'},
            {t:'My Documents',d:'View and edit saved documents',bg:'#2d1b4e',bc:'#7c3aed'},
            {t:'Templates',d:'Browse writing templates',bg:'#1a3a2a',bc:'#16a34a'}
          ].map((c,i)=>(
            <div key={i} style={{padding:24,borderRadius:12,border:`2px solid ${c.bc}`,background:c.bg,cursor:'pointer'}}>
              <h3 style={{fontSize:18,fontWeight:600,color:'#f1f5f9',marginBottom:8}}>{c.t}</h3>
              <p style={{fontSize:14,color:'#94a3b8'}}>{c.d}</p>
            </div>
          ))}
        </div>
        <div style={{marginTop:48,background:'#1e293b',borderRadius:12,padding:24,border:'1px solid #334155'}}>
          <h3 style={{fontSize:18,fontWeight:600,color:'#f1f5f9',marginBottom:16}}>Recent Activity</h3>
          <p style={{textAlign:'center',padding:'32px 0',color:'#64748b'}}>No documents yet. Create your first document to get started!</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg, #020617 0%, #0c1445 50%, #0f172a 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{width:'100%',maxWidth:600}}>
        <div style={{background:'#0f172a',borderRadius:16,boxShadow:'0 25px 50px -12px rgba(0,0,0,0.7)',padding:'48px 40px',border:'1px solid #1e293b'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <h1 style={{fontSize:56,fontWeight:900,background:'linear-gradient(90deg, #3b82f6, #06b6d4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:8}}>BookMe</h1>
            <p style={{fontSize:18,color:'#60a5fa'}}>AI-Powered Writing Platform</p>
            <p style={{fontSize:14,color:'#64748b',marginTop:16}}>Transform your ideas into polished documents with our intelligent writing assistant</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:40}}>
            {[{i:'&#10024;',t:'AI Writing',d:'Smart content generation',bg:'linear-gradient(135deg,#1e3a5f,#1e40af)',bc:'#2563eb',tc:'#dbeafe',dc:'#93c5fd'},
              {i:'&#128218;',t:'Templates',d:'Ready-made structures',bg:'linear-gradient(135deg,#1e293b,#334155)',bc:'#475569',tc:'#f1f5f9',dc:'#94a3b8'},
              {i:'&#128640;',t:'Fast Export',d:'PDF & multiple formats',bg:'linear-gradient(135deg,#1e3a5f,#1e293b)',bc:'#2563eb',tc:'#dbeafe',dc:'#93c5fd'},
              {i:'&#128260;',t:'Collaboration',d:'Share & iterate together',bg:'linear-gradient(135deg,#1e293b,#0f172a)',bc:'#475569',tc:'#f1f5f9',dc:'#94a3b8'}
            ].map((f,i)=>(
              <div key={i} style={{background:f.bg,borderRadius:12,padding:16,border:`1px solid ${f.bc}`}}>
                <div style={{fontSize:24,marginBottom:8}} dangerouslySetInnerHTML={{__html:f.i}}/>
                <h3 style={{fontWeight:600,color:f.tc,marginBottom:4,fontSize:15}}>{f.t}</h3>
                <p style={{fontSize:13,color:f.dc}}>{f.d}</p>
              </div>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <Link href="/auth/login" style={{textDecoration:'none'}}>
              <button style={{width:'100%',background:'linear-gradient(90deg,#2563eb,#3b82f6)',color:'#fff',padding:'14px 0',borderRadius:10,fontWeight:700,fontSize:16}}>Sign In to Your Account</button>
            </Link>
            <Link href="/auth/signup" style={{textDecoration:'none'}}>
              <button style={{width:'100%',background:'transparent',color:'#3b82f6',padding:'14px 0',borderRadius:10,fontWeight:700,fontSize:16,border:'2px solid #3b82f6'}}>Create New Account</button>
            </Link>
          </div>
          <div style={{marginTop:40,paddingTop:24,borderTop:'1px solid #1e293b',textAlign:'center',color:'#475569',fontSize:12}}>
            <p>Secure &bull; Fast &bull; Intuitive</p>
          </div>
        </div>
        <div style={{marginTop:32,background:'rgba(255,255,255,0.05)',backdropFilter:'blur(10px)',borderRadius:12,padding:24,textAlign:'center',color:'#94a3b8'}}>
          <p style={{fontStyle:'italic'}}>&ldquo;The most intuitive AI writing platform I&apos;ve ever used&rdquo; - Sarah M.</p>
        </div>
      </div>
    </div>
  );
}

const center = {display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',flexDirection:'column' as const};
