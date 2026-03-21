'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Chapter { id: string; project_id: string; number: number; title: string; outline: string | null; content: string | null; status: string; }
interface Project { id: string; title: string; topic: string; genre: string; status: string; word_count: number; description: string | null; }
interface Material { id: string; project_id: string; filename: string; file_type: string; file_size_mb: number; extracted_text: string | null; }

function EditorContent() {
  const router = useRouter();
  const params = useSearchParams();
  const projectId = params.get('id');

  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingChapter, setGeneratingChapter] = useState(false);
  const [genProgress, setGenProgress] = useState('');
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMaterials, setShowMaterials] = useState(false);
  const [editMode, setEditMode] = useState<'manual'|'ai'>('manual');
  const [aiPrompt, setAiPrompt] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const hdrs: Record<string,string> = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return; }
    if (!projectId) { router.push('/dashboard'); return; }
    loadProject();
  }, [projectId, token, router]);

  const loadProject = async () => {
    try {
      const [pRes, cRes, mRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`, { headers: hdrs }),
        fetch(`/api/projects/${projectId}/chapters`, { headers: hdrs }),
        fetch(`/api/projects/${projectId}/materials`, { headers: hdrs })
      ]);
      if (pRes.status === 401) { localStorage.removeItem('access_token'); router.push('/auth/login'); return; }
      if (pRes.ok) setProject(await pRes.json());
      if (cRes.ok) {
        const ch = await cRes.json();
        const sorted = Array.isArray(ch) ? ch.sort((a: Chapter, b: Chapter) => a.number - b.number) : [];
        setChapters(sorted);
        if (sorted.length > 0) { setActiveChapter(sorted[0].id); setContent(sorted[0].content || ''); }
      }
      if (mRes.ok) { const m = await mRes.json(); setMaterials(Array.isArray(m) ? m : []); }
    } catch {}
    setLoading(false);
  };

  const selectChapter = (ch: Chapter) => { setActiveChapter(ch.id); setContent(ch.content || ''); };

  const saveContent = useCallback(async () => {
    if (!activeChapter || !projectId) return;
    setSaving(true);
    try { await fetch(`/api/projects/${projectId}`, { method: 'PUT', headers: hdrs, body: JSON.stringify({ status: 'writing' }) }); } catch {}
    setSaving(false);
  }, [activeChapter, projectId]);

  useEffect(() => {
    const timer = setTimeout(() => { if (content && activeChapter) saveContent(); }, 2000);
    return () => clearTimeout(timer);
  }, [content, activeChapter, saveContent]);

  const addChapter = async () => {
    if (!newChapterTitle.trim() || !projectId) return;
    try {
      const r = await fetch(`/api/projects/${projectId}/chapters`, { method: 'POST', headers: hdrs, body: JSON.stringify({ number: chapters.length + 1, title: newChapterTitle }) });
      if (r.ok) { const ch = await r.json(); setChapters(prev => [...prev, ch]); setActiveChapter(ch.id); setContent(''); setNewChapterTitle(''); setShowNewChapter(false); }
    } catch {}
  };

  // Generate ALL chapters at once
  const generateAllChapters = async () => {
    if (!projectId || !project) return;
    setGeneratingAll(true);

    // Step 1: Generate outline (chapter titles)
    setGenProgress('Creating book outline...');
    const chapterPlan = generateOutline(project);

    // Step 2: Create chapters in backend
    const newChapters: Chapter[] = [];
    for (let i = 0; i < chapterPlan.length; i++) {
      setGenProgress(`Creating chapter ${i + 1}/${chapterPlan.length}: ${chapterPlan[i]}...`);
      try {
        const r = await fetch(`/api/projects/${projectId}/chapters`, {
          method: 'POST', headers: hdrs,
          body: JSON.stringify({ number: i + 1, title: chapterPlan[i] })
        });
        if (r.ok) { const ch = await r.json(); newChapters.push(ch); }
      } catch {}
    }

    // Step 3: Generate content for each chapter
    for (let i = 0; i < newChapters.length; i++) {
      setGenProgress(`Writing chapter ${i + 1}/${newChapters.length}: ${newChapters[i].title}...`);
      try {
        const r = await fetch(`/api/projects/${projectId}/chapters/${newChapters[i].id}/generate`, {
          method: 'POST', headers: hdrs,
          body: JSON.stringify({ agent_type: 'writer', instructions: `Write detailed content for "${newChapters[i].title}" in a ${project.genre} book about ${project.topic}. Make it engaging and well-structured.` })
        });
        if (r.ok) {
          const data = await r.json();
          newChapters[i] = { ...newChapters[i], content: data.generated_text, status: 'writing' };
        }
      } catch {}
    }

    setChapters(newChapters);
    if (newChapters.length > 0) { setActiveChapter(newChapters[0].id); setContent(newChapters[0].content || ''); }
    setGenProgress('');
    setGeneratingAll(false);
  };

  // Generate outline based on genre/topic
  const generateOutline = (p: Project): string[] => {
    const topicLC = p.topic.toLowerCase();
    const genre = p.genre.toLowerCase();

    if (genre.includes('fiction') || genre.includes('novel') || genre.includes('fantasy') || genre.includes('romance') || genre.includes('thriller') || genre.includes('mystery') || genre.includes('sci')) {
      return [
        'The Beginning',
        'Setting the Stage',
        'The Inciting Incident',
        'Rising Action',
        'New Alliances',
        'The First Test',
        'Complications',
        'The Midpoint Twist',
        'Falling Action',
        'The Dark Moment',
        'Climax',
        'Resolution',
      ];
    }
    if (genre.includes('self-help') || genre.includes('business') || genre.includes('technical') || genre.includes('academic')) {
      return [
        'Introduction',
        'The Foundation',
        'Core Concepts',
        'Deep Dive: Key Principles',
        'Practical Applications',
        'Case Studies',
        'Common Mistakes to Avoid',
        'Advanced Strategies',
        'Implementation Guide',
        'Conclusion & Next Steps',
      ];
    }
    return [
      'Introduction',
      'Background & Context',
      'Chapter 1: The Core',
      'Chapter 2: Building Blocks',
      'Chapter 3: Going Deeper',
      'Chapter 4: Practical Aspects',
      'Chapter 5: Challenges',
      'Chapter 6: Solutions',
      'Looking Ahead',
      'Conclusion',
    ];
  };

  // AI edit existing content
  const aiEditContent = async () => {
    if (!activeChapter || !projectId || !aiPrompt.trim()) return;
    setGeneratingChapter(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/chapters/${activeChapter}/generate`, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({ agent_type: 'editor', instructions: `Current content:\n${content}\n\nUser request: ${aiPrompt}\n\nRewrite/edit the content following the user's instructions.` })
      });
      if (r.ok) { const data = await r.json(); setContent(data.generated_text); }
    } catch {}
    setGeneratingChapter(false);
    setAiPrompt('');
  };

  // Generate single chapter content
  const generateSingleChapter = async () => {
    if (!activeChapter || !projectId) return;
    setGeneratingChapter(true);
    try {
      const ch = chapters.find(c => c.id === activeChapter);
      const r = await fetch(`/api/projects/${projectId}/chapters/${activeChapter}/generate`, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({ agent_type: 'writer', instructions: `Write detailed content for "${ch?.title}" in a ${project?.genre} book about ${project?.topic}. Make it engaging, detailed, and well-structured with multiple paragraphs.` })
      });
      if (r.ok) { const data = await r.json(); setContent(prev => prev ? prev + '\n\n' + data.generated_text : data.generated_text); }
    } catch {}
    setGeneratingChapter(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !projectId) return;
    const fd = new FormData();
    fd.append('file', f);
    try {
      const r = await fetch(`/api/projects/${projectId}/materials`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
      if (r.ok) { const m = await r.json(); setMaterials(prev => [...prev, m]); }
    } catch {}
  };

  const activeChapterData = chapters.find(c => c.id === activeChapter);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.content?.split(/\s+/).filter(Boolean).length || 0), 0) + wordCount;

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
          <Link href="/dashboard" style={{textDecoration:'none'}}><span style={{fontSize:20,fontWeight:800,color:'#2563eb'}}>BookMe</span></Link>
          <span style={{color:'#333'}}>|</span>
          <span style={{color:'#999',fontSize:14,maxWidth:250,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{project?.title}</span>
          {saving && <span style={{color:'#f59e0b',fontSize:12,animation:'pulse 1s infinite'}}>Saving...</span>}
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{color:'#666',fontSize:12}}>{totalWords.toLocaleString()} words</span>
          <span style={{color:'#333'}}>|</span>
          <span style={{color:'#666',fontSize:12}}>{chapters.length} ch.</span>
          <button onClick={()=>setShowMaterials(!showMaterials)} style={{padding:'5px 10px',background:showMaterials?'#1e3a5f':'#222',color:showMaterials?'#60a5fa':'#999',borderRadius:6,fontSize:11,fontWeight:600}}>
            Files ({materials.length})
          </button>
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{padding:'5px 10px',background:'#222',color:'#999',borderRadius:6,fontSize:11,fontWeight:600}}>Chapters</button>
          <Link href="/dashboard"><button style={{padding:'5px 10px',background:'#222',color:'#999',borderRadius:6,fontSize:11,fontWeight:600}}>Exit</button></Link>
        </div>
      </nav>

      {/* Generating All overlay */}
      {generatingAll && (
        <div style={{background:'#0a0a2a',borderBottom:'1px solid #1e3a5f',padding:'20px 24px',textAlign:'center',animation:'fadeInDown 0.3s ease'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginBottom:8}}>
            <div style={{width:20,height:20,border:'3px solid transparent',borderTopColor:'#2563eb',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
            <span style={{color:'#60a5fa',fontSize:16,fontWeight:600}}>Generating your book...</span>
          </div>
          <p style={{color:'#4a6fa5',fontSize:14}}>{genProgress}</p>
        </div>
      )}

      {/* Materials Panel */}
      {showMaterials && !generatingAll && (
        <div style={{background:'#0a0a1a',borderBottom:'1px solid #1e3a5f',padding:'14px 20px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <h3 style={{fontSize:13,fontWeight:600,color:'#60a5fa'}}>Source Materials</h3>
            <label style={{padding:'5px 12px',background:'#2563eb',color:'#fff',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>
              + Upload <input type="file" accept=".pdf,.docx,.txt,.md,.doc" style={{display:'none'}} onChange={handleFileUpload}/>
            </label>
          </div>
          {materials.length === 0 ? (
            <p style={{color:'#4a6fa5',fontSize:12}}>No source files yet.</p>
          ) : (
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {materials.map(m => (
                <div key={m.id} style={{background:'#111',borderRadius:6,padding:'8px 12px',border:'1px solid #222',fontSize:12}}>
                  <span style={{color:'#fff'}}>📄 {m.filename}</span>
                  <span style={{color:'#555',marginLeft:8}}>{m.file_size_mb.toFixed(1)}MB</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {/* Sidebar */}
        {sidebarOpen && (
          <aside style={{width:250,background:'#0a0a0a',borderRight:'1px solid #222',display:'flex',flexDirection:'column',flexShrink:0}}>
            <div style={{padding:'14px 14px 8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{fontSize:12,fontWeight:600,color:'#666',textTransform:'uppercase',letterSpacing:1}}>Chapters</h3>
              <button onClick={()=>setShowNewChapter(true)} style={{padding:'3px 8px',background:'#2563eb',color:'#fff',borderRadius:4,fontSize:11,fontWeight:600}}>+</button>
            </div>
            {showNewChapter && (
              <div style={{padding:'6px 14px'}}>
                <input value={newChapterTitle} onChange={e=>setNewChapterTitle(e.target.value)} placeholder="Title..." onKeyDown={e=>{if(e.key==='Enter')addChapter();if(e.key==='Escape')setShowNewChapter(false)}} autoFocus style={{width:'100%',padding:'6px 10px',border:'1px solid #333',borderRadius:4,background:'#000',color:'#fff',fontSize:12,outline:'none',marginBottom:4}}/>
                <div style={{display:'flex',gap:4}}>
                  <button onClick={addChapter} style={{flex:1,padding:'4px',background:'#2563eb',color:'#fff',borderRadius:4,fontSize:11,fontWeight:600}}>Add</button>
                  <button onClick={()=>{setShowNewChapter(false);setNewChapterTitle('')}} style={{padding:'4px 8px',background:'#222',color:'#999',borderRadius:4,fontSize:11}}>X</button>
                </div>
              </div>
            )}
            <div style={{flex:1,overflow:'auto',padding:'4px 0'}}>
              {chapters.length === 0 ? (
                <div style={{padding:'24px 14px',textAlign:'center'}}>
                  <p style={{color:'#444',fontSize:12,marginBottom:16}}>No chapters yet</p>
                  <button onClick={generateAllChapters} disabled={generatingAll} style={{width:'100%',padding:'10px',background:'linear-gradient(135deg,#2563eb,#7c3aed)',color:'#fff',borderRadius:8,fontSize:13,fontWeight:700}}>
                    ✨ Generate Entire Book
                  </button>
                </div>
              ) : chapters.map(ch => (
                <div key={ch.id} onClick={()=>selectChapter(ch)}
                  style={{padding:'8px 14px',cursor:'pointer',borderLeft:activeChapter===ch.id?'3px solid #2563eb':'3px solid transparent',background:activeChapter===ch.id?'#111':'transparent',transition:'all 0.15s'}}
                  onMouseEnter={e=>{if(activeChapter!==ch.id)(e.currentTarget as HTMLElement).style.background='#0f0f0f'}}
                  onMouseLeave={e=>{if(activeChapter!==ch.id)(e.currentTarget as HTMLElement).style.background='transparent'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span style={{fontSize:10,color:'#555'}}>Ch. {ch.number}</span>
                    {ch.content ? <span style={{fontSize:8,color:'#22c55e'}}>●</span> : <span style={{fontSize:8,color:'#444'}}>○</span>}
                  </div>
                  <div style={{fontSize:13,color:activeChapter===ch.id?'#fff':'#999',fontWeight:activeChapter===ch.id?600:400}}>{ch.title}</div>
                </div>
              ))}
            </div>
            {chapters.length > 0 && (
              <div style={{padding:'10px 14px',borderTop:'1px solid #222'}}>
                <button onClick={generateAllChapters} disabled={generatingAll} style={{width:'100%',padding:'8px',background:'linear-gradient(135deg,#2563eb,#7c3aed)',color:'#fff',borderRadius:6,fontSize:12,fontWeight:600,opacity:generatingAll?0.5:1}}>
                  ✨ Regenerate All
                </button>
              </div>
            )}
          </aside>
        )}

        {/* Main Editor */}
        <main style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {activeChapterData ? (
            <>
              {/* Chapter header + mode toggle */}
              <div style={{padding:'10px 20px',borderBottom:'1px solid #161616',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <h2 style={{fontSize:18,fontWeight:600,color:'#fff'}}>{activeChapterData.title}</h2>
                  <p style={{fontSize:11,color:'#555'}}>Chapter {activeChapterData.number} &bull; {wordCount} words</p>
                </div>
                <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>setEditMode('manual')} style={{padding:'6px 12px',background:editMode==='manual'?'#222':'transparent',color:editMode==='manual'?'#fff':'#666',borderRadius:6,fontSize:12,fontWeight:600,border:'1px solid #333'}}>
                    ✏️ Manual Edit
                  </button>
                  <button onClick={()=>setEditMode('ai')} style={{padding:'6px 12px',background:editMode==='ai'?'#1e3a5f':'transparent',color:editMode==='ai'?'#60a5fa':'#666',borderRadius:6,fontSize:12,fontWeight:600,border:'1px solid #333'}}>
                    ✨ AI Edit
                  </button>
                  <button onClick={generateSingleChapter} disabled={generatingChapter} style={{padding:'6px 12px',background:'#2563eb',color:'#fff',borderRadius:6,fontSize:12,fontWeight:600,opacity:generatingChapter?0.5:1}}>
                    {generatingChapter ? '...' : '⚡ Generate'}
                  </button>
                </div>
              </div>

              {/* AI Edit bar */}
              {editMode === 'ai' && (
                <div style={{padding:'10px 20px',background:'#0a0a1a',borderBottom:'1px solid #1e3a5f',display:'flex',gap:8}}>
                  <input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')aiEditContent()}} placeholder="Tell AI what to change... e.g. 'Make it more dramatic' or 'Add more dialogue'" style={{flex:1,padding:'8px 14px',border:'1px solid #333',borderRadius:6,background:'#000',color:'#fff',fontSize:13,outline:'none'}}/>
                  <button onClick={aiEditContent} disabled={generatingChapter || !aiPrompt.trim()} style={{padding:'8px 18px',background:'#2563eb',color:'#fff',borderRadius:6,fontSize:13,fontWeight:600,whiteSpace:'nowrap',opacity:generatingChapter?0.5:1}}>
                    {generatingChapter ? 'Editing...' : 'Apply'}
                  </button>
                </div>
              )}

              {/* Text editor */}
              <textarea
                value={content}
                onChange={e=>setContent(e.target.value)}
                placeholder={editMode === 'manual' ? "Start writing here..." : "Content will appear here. Use the AI bar above to request changes."}
                readOnly={editMode === 'ai' && generatingChapter}
                style={{flex:1,padding:'24px',background:'#000',color:'#e2e8f0',fontSize:16,lineHeight:1.8,border:'none',outline:'none',resize:'none',fontFamily:'Georgia, serif',opacity:generatingChapter?0.6:1}}
              />
            </>
          ) : (
            <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',padding:32}}>
              {chapters.length === 0 ? (
                <>
                  <div style={{fontSize:56,marginBottom:20}}>📖</div>
                  <h3 style={{color:'#fff',fontSize:22,fontWeight:600,marginBottom:8}}>Ready to write your book?</h3>
                  <p style={{color:'#666',fontSize:15,marginBottom:8,textAlign:'center',maxWidth:400}}>
                    Click the button below and AI will generate a complete book outline with all chapters and content for &ldquo;{project?.title}&rdquo;.
                  </p>
                  <p style={{color:'#555',fontSize:13,marginBottom:24}}>Genre: {project?.genre} &bull; Topic: {project?.topic}</p>
                  <button onClick={generateAllChapters} disabled={generatingAll}
                    style={{padding:'16px 40px',background:'linear-gradient(135deg,#2563eb,#7c3aed)',color:'#fff',borderRadius:12,fontSize:18,fontWeight:700,animation:'glow 2s ease-in-out infinite'}}>
                    ✨ Generate Entire Book
                  </button>
                  <p style={{color:'#444',fontSize:12,marginTop:16}}>You can edit everything after generation</p>
                </>
              ) : (
                <>
                  <div style={{fontSize:48,marginBottom:16,opacity:0.3}}>📖</div>
                  <p style={{color:'#444',fontSize:16}}>Select a chapter from the sidebar</p>
                </>
              )}
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
