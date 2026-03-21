'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const genres = ['Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Romance', 'Thriller', 'Mystery', 'Biography', 'Self-Help', 'Business', 'Technical', 'Academic', 'Poetry', 'Children', 'Other'];
const audiences = ['Adult', 'Young Adult', 'Children', 'Academic', 'Professional', 'General'];

const inp = {width:'100%',padding:'12px 16px',border:'1px solid #333',borderRadius:10,background:'#000',color:'#fff',fontSize:15,outline:'none',transition:'border-color 0.3s'};
const lbl = {display:'block',fontSize:14,fontWeight:500 as const,color:'#999',marginBottom:8};

export default function CreatePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title:'', topic:'', genre:'Fiction', target_audience:'Adult', description:'', driveUrl:'' });
  const [file, setFile] = useState<File|null>(null);
  const [tab, setTab] = useState<'scratch'|'drive'|'upload'>('scratch');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('access_token')) router.push('/auth/login');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setErr('Title is required'); return; }
    if (!form.topic.trim()) { setErr('Topic is required'); return; }
    setBusy(true); setErr('');

    try {
      const token = localStorage.getItem('access_token');
      const r = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, topic: form.topic, genre: form.genre, target_audience: form.target_audience, description: form.description || undefined })
      });
      const data = await r.json();
      if (r.status === 401) { localStorage.removeItem('access_token'); localStorage.removeItem('user'); router.push('/auth/login'); return; }
      if (!r.ok) { setErr(data.detail || data.error || 'Failed to create project'); setBusy(false); return; }
      router.push(`/editor?id=${data.id}`);
    } catch {
      setErr('Network error'); setBusy(false);
    }
  };

  const tabStyle = (active: boolean) => ({
    padding:'10px 20px',borderRadius:8,fontWeight:600 as const,fontSize:14,
    background:active?'#2563eb':'transparent',color:active?'#fff':'#666',
    border:active?'none':'1px solid #333',cursor:'pointer' as const,transition:'all 0.2s'
  });

  return (
    <div style={{minHeight:'100vh',background:'#000'}}>
      <nav style={{background:'#111',borderBottom:'1px solid #222',padding:'16px 32px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <Link href="/" style={{textDecoration:'none'}}><h1 style={{fontSize:24,fontWeight:800,color:'#2563eb'}}>BookMe</h1></Link>
          <span style={{color:'#666',fontSize:14}}>/ New Project</span>
        </div>
        <Link href="/dashboard">
          <button style={{padding:'8px 20px',background:'#222',color:'#ccc',borderRadius:8,fontWeight:600,fontSize:14}}>Back to Dashboard</button>
        </Link>
      </nav>

      <div style={{maxWidth:700,margin:'0 auto',padding:'40px 24px'}}>
        <h2 style={{fontSize:28,fontWeight:700,color:'#fff',marginBottom:8,animation:'fadeInUp 0.5s ease'}}>Create New Project</h2>
        <p style={{color:'#666',marginBottom:32,animation:'fadeInUp 0.5s ease 0.1s both'}}>Set up your book or writing project</p>

        {err && <div style={{marginBottom:20,padding:12,background:'#7f1d1d33',border:'1px solid #991b1b',borderRadius:8,color:'#fca5a5',fontSize:14,animation:'fadeInUp 0.3s ease'}}>{err}</div>}

        <form onSubmit={handleSubmit}>
          {/* Source tabs */}
          <div style={{marginBottom:28,animation:'fadeInUp 0.5s ease 0.15s both'}}>
            <label style={lbl}>Source</label>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button type="button" onClick={()=>setTab('scratch')} style={tabStyle(tab==='scratch')}>From Scratch</button>
              <button type="button" onClick={()=>setTab('drive')} style={tabStyle(tab==='drive')}>Google Drive Link</button>
              <button type="button" onClick={()=>setTab('upload')} style={tabStyle(tab==='upload')}>Upload File</button>
            </div>
          </div>

          {/* Drive URL */}
          {tab === 'drive' && (
            <div style={{marginBottom:20,padding:20,background:'#0a0a1a',borderRadius:12,border:'1px solid #1e3a5f',animation:'fadeInUp 0.3s ease'}}>
              <label style={lbl}>Google Drive URL</label>
              <input type="url" value={form.driveUrl} onChange={e=>setForm({...form,driveUrl:e.target.value})} placeholder="https://drive.google.com/file/d/..." style={inp}/>
              <p style={{fontSize:12,color:'#4a6fa5',marginTop:6}}>Paste the share link of your document from Google Drive</p>
            </div>
          )}

          {/* File Upload */}
          {tab === 'upload' && (
            <div style={{marginBottom:20,padding:20,background:'#0a0a1a',borderRadius:12,border:'1px solid #1e3a5f',animation:'fadeInUp 0.3s ease'}}>
              <label style={lbl}>Upload Document</label>
              <div
                onClick={()=>fileRef.current?.click()}
                style={{border:'2px dashed #333',borderRadius:12,padding:'32px 20px',textAlign:'center',cursor:'pointer',transition:'border-color 0.3s'}}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor='#2563eb'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor='#333'}
              >
                {file ? (
                  <div>
                    <div style={{fontSize:32,marginBottom:8}}>📄</div>
                    <p style={{color:'#fff',fontWeight:600}}>{file.name}</p>
                    <p style={{color:'#666',fontSize:13}}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <div style={{fontSize:32,marginBottom:8}}>📁</div>
                    <p style={{color:'#999'}}>Click to upload or drag and drop</p>
                    <p style={{color:'#666',fontSize:13,marginTop:4}}>PDF, DOCX, TXT, MD (max 50MB)</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md,.doc" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])setFile(e.target.files[0])}}/>
            </div>
          )}

          {/* Title */}
          <div style={{marginBottom:20,animation:'fadeInUp 0.5s ease 0.2s both'}}>
            <label style={lbl}>Title *</label>
            <input type="text" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="My Awesome Book" required style={inp}/>
          </div>

          {/* Topic */}
          <div style={{marginBottom:20,animation:'fadeInUp 0.5s ease 0.25s both'}}>
            <label style={lbl}>Topic / Subject *</label>
            <input type="text" value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} placeholder="A thrilling adventure in space..." required style={inp}/>
          </div>

          {/* Genre & Audience */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20,animation:'fadeInUp 0.5s ease 0.3s both'}}>
            <div>
              <label style={lbl}>Genre *</label>
              <select value={form.genre} onChange={e=>setForm({...form,genre:e.target.value})} style={{...inp,cursor:'pointer',appearance:'auto' as const}}>
                {genres.map(g=><option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Target Audience</label>
              <select value={form.target_audience} onChange={e=>setForm({...form,target_audience:e.target.value})} style={{...inp,cursor:'pointer',appearance:'auto' as const}}>
                {audiences.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div style={{marginBottom:28,animation:'fadeInUp 0.5s ease 0.35s both'}}>
            <label style={lbl}>Description (optional)</label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Brief description of your project..." rows={3} style={{...inp,resize:'vertical' as const,minHeight:80}}/>
          </div>

          {/* Submit */}
          <div style={{display:'flex',gap:12,animation:'fadeInUp 0.5s ease 0.4s both'}}>
            <button type="submit" disabled={busy} style={{flex:1,background:busy?'#444':'#2563eb',color:'#fff',padding:'14px 0',borderRadius:10,fontWeight:700,fontSize:16,opacity:busy?0.6:1}}>
              {busy ? 'Creating...' : 'Create Project'}
            </button>
            <Link href="/dashboard" style={{textDecoration:'none'}}>
              <button type="button" style={{padding:'14px 24px',background:'#222',color:'#999',borderRadius:10,fontWeight:600,fontSize:15}}>Cancel</button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
