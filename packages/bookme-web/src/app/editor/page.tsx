'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Chapter {
  id: string;
  project_id: string;
  number: number;
  title: string;
  outline: string | null;
  content: string | null;
  status: string;
}

interface Project {
  id: string;
  title: string;
  topic: string;
  genre: string;
  status: string;
  word_count: number;
}

function EditorContent() {
  const router = useRouter();
  const params = useSearchParams();
  const projectId = params.get('id');

  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return; }
    if (!projectId) { router.push('/dashboard'); return; }
    loadProject();
  }, [projectId, token, router]);

  const loadProject = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`, { headers }),
        fetch(`/api/projects/${projectId}/chapters`, { headers })
      ]);
      if (pRes.ok) setProject(await pRes.json());
      if (cRes.ok) {
        const ch = await cRes.json();
        const sorted = Array.isArray(ch) ? ch.sort((a: Chapter, b: Chapter) => a.number - b.number) : [];
        setChapters(sorted);
        if (sorted.length > 0) { setActiveChapter(sorted[0].id); setContent(sorted[0].content || ''); }
      }
    } catch {}
    setLoading(false);
  };

  const selectChapter = (ch: Chapter) => {
    setActiveChapter(ch.id);
    setContent(ch.content || '');
  };

  const saveContent = useCallback(async () => {
    if (!activeChapter || !projectId) return;
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ status: 'writing' })
      });
    } catch {}
    setSaving(false);
    setTimeout(() => setSaving(false), 1000);
  }, [activeChapter, projectId, content, headers]);

  // Auto-save debounce
  useEffect(() => {
    const timer = setTimeout(() => { if (content && activeChapter) saveContent(); }, 2000);
    return () => clearTimeout(timer);
  }, [content, activeChapter, saveContent]);

  const addChapter = async () => {
    if (!newChapterTitle.trim() || !projectId) return;
    try {
      const r = await fetch(`/api/projects/${projectId}/chapters`, {
        method: 'POST', headers,
        body: JSON.stringify({ number: chapters.length + 1, title: newChapterTitle })
      });
      if (r.ok) {
        const ch = await r.json();
        setChapters(prev => [...prev, ch]);
        setActiveChapter(ch.id);
        setContent('');
        setNewChapterTitle('');
        setShowNewChapter(false);
      }
    } catch {}
  };

  const activeChapterData = chapters.find(c => c.id === activeChapter);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#000'}}>
      <div style={{width:40,height:40,border:'3px solid transparent',borderTopColor:'#2563eb',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#000',display:'flex',flexDirection:'column'}}>
      {/* Top Bar */}
      <nav style={{background:'#111',borderBottom:'1px solid #222',padding:'10px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Link href="/dashboard" style={{textDecoration:'none'}}>
            <span style={{fontSize:20,fontWeight:800,color:'#2563eb'}}>BookMe</span>
          </Link>
          <span style={{color:'#333'}}>|</span>
          <span style={{color:'#999',fontSize:14,maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{project?.title || 'Untitled'}</span>
          {saving && <span style={{color:'#f59e0b',fontSize:12,animation:'pulse 1s infinite'}}>Saving...</span>}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{color:'#666',fontSize:12}}>{wordCount} words</span>
          <span style={{color:'#333'}}>|</span>
          <span style={{color:'#666',fontSize:12}}>{project?.genre}</span>
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{padding:'6px 12px',background:'#222',color:'#999',borderRadius:6,fontSize:12,fontWeight:600}}>
            {sidebarOpen ? 'Hide' : 'Show'} Chapters
          </button>
          <Link href="/dashboard">
            <button style={{padding:'6px 12px',background:'#222',color:'#999',borderRadius:6,fontSize:12,fontWeight:600}}>Dashboard</button>
          </Link>
        </div>
      </nav>

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {/* Sidebar - Chapter List */}
        {sidebarOpen && (
          <aside style={{width:260,background:'#0a0a0a',borderRight:'1px solid #222',display:'flex',flexDirection:'column',flexShrink:0,animation:'slideInLeft 0.3s ease'}}>
            <div style={{padding:'16px 16px 8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{fontSize:14,fontWeight:600,color:'#999',textTransform:'uppercase',letterSpacing:1}}>Chapters</h3>
              <button onClick={()=>setShowNewChapter(true)} style={{padding:'4px 10px',background:'#2563eb',color:'#fff',borderRadius:6,fontSize:12,fontWeight:600}}>+</button>
            </div>

            {showNewChapter && (
              <div style={{padding:'8px 16px',animation:'fadeInUp 0.2s ease'}}>
                <input value={newChapterTitle} onChange={e=>setNewChapterTitle(e.target.value)} placeholder="Chapter title..." onKeyDown={e=>{if(e.key==='Enter')addChapter();if(e.key==='Escape')setShowNewChapter(false)}} autoFocus style={{width:'100%',padding:'8px 12px',border:'1px solid #333',borderRadius:6,background:'#000',color:'#fff',fontSize:13,outline:'none',marginBottom:6}}/>
                <div style={{display:'flex',gap:4}}>
                  <button onClick={addChapter} style={{flex:1,padding:'6px',background:'#2563eb',color:'#fff',borderRadius:4,fontSize:12,fontWeight:600}}>Add</button>
                  <button onClick={()=>{setShowNewChapter(false);setNewChapterTitle('')}} style={{padding:'6px 10px',background:'#222',color:'#999',borderRadius:4,fontSize:12}}>X</button>
                </div>
              </div>
            )}

            <div style={{flex:1,overflow:'auto',padding:'8px 0'}}>
              {chapters.length === 0 ? (
                <p style={{padding:'16px',color:'#444',fontSize:13,textAlign:'center'}}>No chapters yet. Click + to add one.</p>
              ) : chapters.map(ch => (
                <div key={ch.id} onClick={()=>selectChapter(ch)}
                  style={{padding:'10px 16px',cursor:'pointer',borderLeft:activeChapter===ch.id?'3px solid #2563eb':'3px solid transparent',background:activeChapter===ch.id?'#111':'transparent',transition:'all 0.2s'}}
                  onMouseEnter={e=>{if(activeChapter!==ch.id)(e.currentTarget as HTMLElement).style.background='#0f0f0f'}}
                  onMouseLeave={e=>{if(activeChapter!==ch.id)(e.currentTarget as HTMLElement).style.background='transparent'}}>
                  <div style={{fontSize:11,color:'#555',marginBottom:2}}>Chapter {ch.number}</div>
                  <div style={{fontSize:14,color:activeChapter===ch.id?'#fff':'#999',fontWeight:activeChapter===ch.id?600:400}}>{ch.title}</div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Main Editor */}
        <main style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {activeChapterData ? (
            <>
              <div style={{padding:'16px 24px 8px',borderBottom:'1px solid #161616'}}>
                <h2 style={{fontSize:20,fontWeight:600,color:'#fff'}}>{activeChapterData.title}</h2>
                <p style={{fontSize:12,color:'#555'}}>Chapter {activeChapterData.number}</p>
              </div>
              <textarea
                value={content}
                onChange={e=>setContent(e.target.value)}
                placeholder="Start writing here..."
                style={{flex:1,padding:'24px',background:'#000',color:'#e2e8f0',fontSize:16,lineHeight:1.8,border:'none',outline:'none',resize:'none',fontFamily:'Georgia, serif'}}
              />
            </>
          ) : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
              <div style={{fontSize:48,marginBottom:16,opacity:0.3}}>📖</div>
              <p style={{color:'#444',fontSize:16}}>Select a chapter or create a new one to start writing</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#000'}}><div style={{width:40,height:40,border:'3px solid transparent',borderTopColor:'#2563eb',borderRadius:'50%',animation:'spin 1s linear infinite'}}/></div>}>
      <EditorContent />
    </Suspense>
  );
}
