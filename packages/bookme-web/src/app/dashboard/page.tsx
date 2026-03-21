'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  title: string;
  topic: string;
  genre: string;
  target_audience: string;
  description: string | null;
  status: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  'draft': '#f59e0b',
  'planning': '#8b5cf6',
  'writing': '#3b82f6',
  'reviewing': '#06b6d4',
  'completed': '#22c55e',
};

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{email?: string} | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const ud = localStorage.getItem('user');
    if (!token) { router.push('/auth/login'); return; }
    if (ud) try { setUser(JSON.parse(ud)); } catch {}
    fetchProjects(token);
  }, [router]);

  const fetchProjects = async (token: string) => {
    try {
      const r = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
      if (r.ok) { const data = await r.json(); setProjects(Array.isArray(data) ? data : []); }
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    const token = localStorage.getItem('access_token');
    await fetch(`/api/projects/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div style={{minHeight:'100vh',background:'#000'}}>
      {/* Nav */}
      <nav style={{background:'#111',borderBottom:'1px solid #222',padding:'16px 32px',display:'flex',justifyContent:'space-between',alignItems:'center',animation:'fadeInDown 0.5s ease'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <Link href="/" style={{textDecoration:'none'}}><h1 style={{fontSize:24,fontWeight:800,color:'#2563eb',cursor:'pointer'}}>BookMe</h1></Link>
          <span style={{color:'#666',fontSize:14}}>Dashboard</span>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <span style={{color:'#999',fontSize:14}}>{user?.email}</span>
          <button onClick={logout} style={{padding:'8px 16px',background:'#dc2626',color:'#fff',borderRadius:8,fontWeight:600,fontSize:13}}>Logout</button>
        </div>
      </nav>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'32px 24px'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:32,animation:'fadeInUp 0.5s ease'}}>
          <div>
            <h2 style={{fontSize:28,fontWeight:700,color:'#fff',marginBottom:4}}>My Projects</h2>
            <p style={{color:'#666',fontSize:15}}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/create">
            <button style={{background:'#2563eb',color:'#fff',padding:'12px 28px',borderRadius:10,fontWeight:700,fontSize:15,display:'flex',alignItems:'center',gap:8}}>
              + New Project
            </button>
          </Link>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:'80px 0'}}>
            <div style={{width:40,height:40,border:'3px solid transparent',borderTopColor:'#2563eb',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 16px'}}/>
            <p style={{color:'#666'}}>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div style={{textAlign:'center',padding:'80px 24px',background:'#111',borderRadius:16,border:'1px solid #222',animation:'fadeInUp 0.6s ease'}}>
            <div style={{fontSize:48,marginBottom:16}}>📝</div>
            <h3 style={{fontSize:22,fontWeight:600,color:'#fff',marginBottom:8}}>No projects yet</h3>
            <p style={{color:'#666',marginBottom:24}}>Create your first book project to get started</p>
            <Link href="/create">
              <button style={{background:'#2563eb',color:'#fff',padding:'14px 32px',borderRadius:10,fontWeight:700,fontSize:16}}>
                Create First Project
              </button>
            </Link>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))',gap:24}}>
            {projects.map((p, i) => (
              <div key={p.id} style={{background:'#111',borderRadius:16,padding:24,border:'1px solid #222',animation:`fadeInUp 0.5s ease ${0.05*i}s both`,transition:'transform 0.3s, border-color 0.3s',cursor:'pointer'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.borderColor='#2563eb'}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.borderColor='#222'}}
                onClick={()=>router.push(`/editor?id=${p.id}`)}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <h3 style={{fontSize:18,fontWeight:600,color:'#fff',flex:1}}>{p.title}</h3>
                  <span style={{fontSize:11,fontWeight:600,color:statusColors[p.status] || '#666',background:`${statusColors[p.status] || '#666'}20`,padding:'4px 10px',borderRadius:12,whiteSpace:'nowrap',textTransform:'uppercase'}}>{p.status}</span>
                </div>
                <p style={{color:'#888',fontSize:13,marginBottom:4}}>{p.genre} &bull; {p.target_audience}</p>
                {p.description && <p style={{color:'#666',fontSize:13,marginBottom:12,lineHeight:1.4}}>{p.description.substring(0, 100)}{p.description.length > 100 ? '...' : ''}</p>}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12,paddingTop:12,borderTop:'1px solid #222'}}>
                  <span style={{color:'#666',fontSize:13}}>{p.word_count.toLocaleString()} words</span>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={e=>{e.stopPropagation();router.push(`/editor?id=${p.id}`)}} style={{padding:'6px 14px',background:'#1e3a5f',color:'#60a5fa',borderRadius:6,fontSize:12,fontWeight:600}}>Edit</button>
                    <button onClick={e=>{e.stopPropagation();handleDelete(p.id)}} style={{padding:'6px 14px',background:'#3f1d1d',color:'#fca5a5',borderRadius:6,fontSize:12,fontWeight:600}}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
