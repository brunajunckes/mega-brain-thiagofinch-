'use client';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Chapter { id: string; project_id: string; number: number; title: string; outline: string | null; content: string | null; status: string; }
interface Project { id: string; title: string; topic: string; genre: string; status: string; word_count: number; description: string | null; target_word_count?: number; }
interface Material { id: string; project_id: string; filename: string; file_type: string; file_size_mb: number; extracted_text: string | null; }
interface ConsistencyEntity { name: string; type: string; appearances: number; consistent: boolean; }
interface ConsistencyContradiction { description: string; severity: 'warning' | 'error'; chapters: number[]; }
interface ConsistencyReport { entities: ConsistencyEntity[]; contradictions: ConsistencyContradiction[]; checked_at: string; }
interface BetaReviewResult { reviewer: string; persona: string; score: number; feedback: string; suggestions: string[]; }
interface StoryBibleResult { characters: Record<string, unknown>[]; settings: Record<string, unknown>[]; rules: string[]; timeline: string[]; themes: string[]; }
interface RevisionResult { passes_completed: number; total_changes: number; improved_chapters: number; details: { chapter: string; changes: string[] }[]; }

const GEN_PHASES = ['Planning', 'Writing', 'Reviewing', 'Editing'];

function chapterWordCount(ch: Chapter): number {
  return ch.content ? ch.content.split(/\s+/).filter(Boolean).length : 0;
}

function statusColor(status: string): string {
  switch (status) {
    case 'complete': return '#22c55e';
    case 'reviewed': return '#f59e0b';
    case 'writing': return '#2563eb';
    default: return '#555';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'complete': return 'Complete';
    case 'reviewed': return 'Reviewed';
    case 'writing': return 'Writing';
    default: return 'Draft';
  }
}

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
  const [genPhaseIndex, setGenPhaseIndex] = useState(0);
  const [genChapterCurrent, setGenChapterCurrent] = useState(0);
  const [genChapterTotal, setGenChapterTotal] = useState(0);
  const [genStartTime, setGenStartTime] = useState<number | null>(null);
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showMaterials, setShowMaterials] = useState(false);
  const [editMode, setEditMode] = useState<'manual' | 'ai'>('manual');
  const [aiPrompt, setAiPrompt] = useState('');

  // Export state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Consistency state
  const [showConsistency, setShowConsistency] = useState(false);
  const [consistencyReport, setConsistencyReport] = useState<ConsistencyReport | null>(null);
  const [loadingConsistency, setLoadingConsistency] = useState(false);

  // God Mode v3 state
  const [showStoryBible, setShowStoryBible] = useState(false);
  const [storyBible, setStoryBible] = useState<StoryBibleResult | null>(null);
  const [loadingBible, setLoadingBible] = useState(false);
  const [showBetaReview, setShowBetaReview] = useState(false);
  const [betaReview, setBetaReview] = useState<BetaReviewResult[] | null>(null);
  const [loadingBeta, setLoadingBeta] = useState(false);
  const [showRevision, setShowRevision] = useState(false);
  const [revisionReport, setRevisionReport] = useState<RevisionResult | null>(null);
  const [loadingRevision, setLoadingRevision] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const hdrs: Record<string, string> = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Inject keyframe animations
  useEffect(() => {
    const styleId = 'bookme-editor-keyframes';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      @keyframes glow { 0%,100% { box-shadow: 0 0 8px rgba(37,99,235,0.4); } 50% { box-shadow: 0 0 20px rgba(37,99,235,0.8); } }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes progressPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
      @keyframes slideIn { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
    `;
    document.head.appendChild(style);
  }, []);

  // Close export menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    } catch { /* silent */ }
    setLoading(false);
  };

  const selectChapter = (ch: Chapter) => { setActiveChapter(ch.id); setContent(ch.content || ''); };

  const saveContent = useCallback(async () => {
    if (!activeChapter || !projectId) return;
    setSaving(true);
    try { await fetch(`/api/projects/${projectId}`, { method: 'PUT', headers: hdrs, body: JSON.stringify({ status: 'writing' }) }); } catch { /* silent */ }
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
    } catch { /* silent */ }
  };

  // Generate outline based on genre/topic
  const generateOutline = (p: Project): string[] => {
    const genre = p.genre.toLowerCase();
    if (genre.includes('fiction') || genre.includes('novel') || genre.includes('fantasy') || genre.includes('romance') || genre.includes('thriller') || genre.includes('mystery') || genre.includes('sci')) {
      return ['The Beginning', 'Setting the Stage', 'The Inciting Incident', 'Rising Action', 'New Alliances', 'The First Test', 'Complications', 'The Midpoint Twist', 'Falling Action', 'The Dark Moment', 'Climax', 'Resolution'];
    }
    if (genre.includes('self-help') || genre.includes('business') || genre.includes('technical') || genre.includes('academic')) {
      return ['Introduction', 'The Foundation', 'Core Concepts', 'Deep Dive: Key Principles', 'Practical Applications', 'Case Studies', 'Common Mistakes to Avoid', 'Advanced Strategies', 'Implementation Guide', 'Conclusion & Next Steps'];
    }
    return ['Introduction', 'Background & Context', 'Chapter 1: The Core', 'Chapter 2: Building Blocks', 'Chapter 3: Going Deeper', 'Chapter 4: Practical Aspects', 'Chapter 5: Challenges', 'Chapter 6: Solutions', 'Looking Ahead', 'Conclusion'];
  };

  // Estimate time remaining
  const estimateTimeRemaining = (chaptersCompleted: number, total: number, startTime: number): string => {
    if (chaptersCompleted === 0) return 'Calculating...';
    const elapsed = Date.now() - startTime;
    const msPerChapter = elapsed / chaptersCompleted;
    const remaining = msPerChapter * (total - chaptersCompleted);
    const minutes = Math.ceil(remaining / 60000);
    if (minutes < 1) return 'Less than a minute';
    return `~${minutes} min remaining`;
  };

  // God Mode v3: Generate ALL chapters via backend pipeline
  const generateAllV3 = async () => {
    if (!projectId || !project) return;
    setGeneratingAll(true);
    setGenPhaseIndex(0);
    setGenProgress('God Mode v3: Initializing multi-agent pipeline...');
    const start = Date.now();
    setGenStartTime(start);

    try {
      setGenPhaseIndex(0);
      setGenProgress('Planning book structure with AI agents...');

      const r = await fetch(`/api/projects/${projectId}/generate-all`, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({ mode: 'parallel', target_words_per_chapter: 3500 })
      });

      if (r.ok) {
        const data = await r.json();
        setGenPhaseIndex(3);
        setGenProgress(`Done! ${data.chapters_generated || 0} chapters, ${data.total_words?.toLocaleString() || '?'} words`);
        // Reload project to get new chapters
        await loadProject();
      } else {
        // Fallback to local generation
        setGenProgress('V3 unavailable, using local generation...');
        await generateAllChaptersLocal();
      }
    } catch {
      // Fallback to local generation
      setGenProgress('V3 unavailable, using local generation...');
      await generateAllChaptersLocal();
    }

    setGeneratingAll(false);
    setGenStartTime(null);
  };

  // Local fallback: Generate ALL chapters at once
  const generateAllChaptersLocal = async () => {
    if (!projectId || !project) return;
    const start = Date.now();
    setGenStartTime(start);

    // Phase 0: Planning
    setGenPhaseIndex(0);
    setGenProgress('Creating book outline...');
    const chapterPlan = generateOutline(project);
    setGenChapterTotal(chapterPlan.length);

    // Phase 1: Writing — create chapters
    setGenPhaseIndex(1);
    const newChapters: Chapter[] = [];
    for (let i = 0; i < chapterPlan.length; i++) {
      setGenChapterCurrent(i + 1);
      setGenProgress(`Creating chapter ${i + 1}/${chapterPlan.length}: ${chapterPlan[i]}...`);
      try {
        const r = await fetch(`/api/projects/${projectId}/chapters`, {
          method: 'POST', headers: hdrs,
          body: JSON.stringify({ number: i + 1, title: chapterPlan[i] })
        });
        if (r.ok) { const ch = await r.json(); newChapters.push(ch); }
      } catch { /* silent */ }
    }

    // Phase 2: Reviewing — generate content
    setGenPhaseIndex(2);
    for (let i = 0; i < newChapters.length; i++) {
      setGenChapterCurrent(i + 1);
      setGenProgress(`Writing chapter ${i + 1}/${newChapters.length}: ${newChapters[i].title}...`);
      try {
        const r = await fetch(`/api/projects/${projectId}/chapters/${newChapters[i].id}/generate`, {
          method: 'POST', headers: hdrs,
          body: JSON.stringify({ agent_type: 'writer', instructions: `Write detailed content for "${newChapters[i].title}" in a ${project.genre} book about ${project.topic}. Make it engaging and well-structured. Minimum 3000 words.` })
        });
        if (r.ok) {
          const data = await r.json();
          newChapters[i] = { ...newChapters[i], content: data.generated_text, status: 'writing' };
        }
      } catch { /* silent */ }
    }

    // Phase 3: Editing
    setGenPhaseIndex(3);
    setGenProgress('Finalizing your book...');

    setChapters(newChapters);
    if (newChapters.length > 0) { setActiveChapter(newChapters[0].id); setContent(newChapters[0].content || ''); }
    setGenProgress('');
    setGenChapterCurrent(0);
    setGenChapterTotal(0);
  };

  // Generate ALL chapters (tries v3 first, falls back to local)
  const generateAllChapters = async () => {
    setGeneratingAll(true);
    await generateAllV3();
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
    } catch { /* silent */ }
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
        body: JSON.stringify({ agent_type: 'writer', instructions: `Write detailed content for "${ch?.title}" in a ${project?.genre} book about ${project?.topic}. Make it engaging, detailed, and well-structured with multiple paragraphs. Minimum 3000 words.` })
      });
      if (r.ok) { const data = await r.json(); setContent(prev => prev ? prev + '\n\n' + data.generated_text : data.generated_text); }
    } catch { /* silent */ }
    setGeneratingChapter(false);
  };

  // Export book (pdf, txt, html, epub)
  const exportBook = async (format: 'pdf' | 'txt' | 'html' | 'epub') => {
    if (!projectId || exporting) return;
    setExporting(true);
    setShowExportMenu(false);
    try {
      const url = format === 'epub' ? `/api/projects/${projectId}/export-epub` : `/api/projects/${projectId}/export`;
      const r = await fetch(url, {
        method: 'POST', headers: hdrs,
        body: JSON.stringify({ format })
      });
      if (r.ok) {
        const blob = await r.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${project?.title || 'book'}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } catch { /* silent */ }
    setExporting(false);
  };

  // Load consistency report
  const loadConsistency = async () => {
    if (!projectId) return;
    setLoadingConsistency(true);
    setConsistencyReport(null);
    try {
      const r = await fetch(`/api/projects/${projectId}/consistency`, { headers: hdrs });
      if (r.ok) { setConsistencyReport(await r.json()); }
    } catch { /* silent */ }
    setLoadingConsistency(false);
  };

  const toggleConsistency = () => {
    const next = !showConsistency;
    setShowConsistency(next);
    if (next && !consistencyReport) loadConsistency();
  };

  // God Mode v3: Story Bible
  const loadStoryBible = async () => {
    if (!projectId) return;
    setLoadingBible(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/story-bible`, {
        method: 'POST', headers: hdrs, body: JSON.stringify({})
      });
      if (r.ok) { setStoryBible(await r.json()); }
    } catch { /* silent */ }
    setLoadingBible(false);
  };

  const toggleStoryBible = () => {
    const next = !showStoryBible;
    setShowStoryBible(next);
    if (next && !storyBible) loadStoryBible();
  };

  // God Mode v3: Beta Review
  const loadBetaReview = async () => {
    if (!projectId) return;
    setLoadingBeta(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/beta-review`, {
        method: 'POST', headers: hdrs, body: JSON.stringify({})
      });
      if (r.ok) {
        const data = await r.json();
        setBetaReview(data.reviews || data);
      }
    } catch { /* silent */ }
    setLoadingBeta(false);
  };

  const toggleBetaReview = () => {
    const next = !showBetaReview;
    setShowBetaReview(next);
    if (next && !betaReview) loadBetaReview();
  };

  // God Mode v3: Deep Revision
  const loadDeepRevision = async () => {
    if (!projectId) return;
    setLoadingRevision(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/deep-revision`, {
        method: 'POST', headers: hdrs, body: JSON.stringify({ passes: 3 })
      });
      if (r.ok) {
        setRevisionReport(await r.json());
        // Reload chapters after revision
        await loadProject();
      }
    } catch { /* silent */ }
    setLoadingRevision(false);
  };

  const toggleRevision = () => {
    const next = !showRevision;
    setShowRevision(next);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !projectId) return;
    const fd = new FormData();
    fd.append('file', f);
    try {
      const r = await fetch(`/api/projects/${projectId}/materials`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd });
      if (r.ok) { const m = await r.json(); setMaterials(prev => [...prev, m]); }
    } catch { /* silent */ }
  };

  const activeChapterData = chapters.find(c => c.id === activeChapter);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const totalWords = chapters.reduce((sum, ch) => {
    const wc = ch.id === activeChapter ? wordCount : chapterWordCount(ch);
    return sum + wc;
  }, 0);
  const estimatedPages = Math.ceil(totalWords / 250);
  const targetWords = project?.target_word_count || 35000;
  const completedChapters = chapters.filter(c => c.status === 'complete').length;
  const overallCompletion = chapters.length > 0 ? Math.round((completedChapters / chapters.length) * 100) : 0;
  const maxChapterWords = Math.max(...chapters.map(chapterWordCount), 1);

  // Progress bar percentage for generation
  const genProgressPct = genChapterTotal > 0 ? Math.round((genChapterCurrent / genChapterTotal) * 100) : 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#000' }}>
      <div style={{ width: 40, height: 40, border: '3px solid transparent', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar */}
      <nav style={{ background: '#111', borderBottom: '1px solid #222', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, position: 'relative', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}><span style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>BookMe</span></Link>
          <span style={{ color: '#333' }}>|</span>
          <span style={{ color: '#999', fontSize: 14, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project?.title}</span>
          {saving && <span style={{ color: '#f59e0b', fontSize: 12, animation: 'pulse 1s infinite' }}>Saving...</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#666', fontSize: 12 }}>{totalWords.toLocaleString()} words</span>
          <span style={{ color: '#333' }}>|</span>
          <span style={{ color: '#666', fontSize: 12 }}>{chapters.length} ch.</span>

          {/* Story Bible Button */}
          <button
            onClick={toggleStoryBible}
            style={{ padding: '5px 10px', background: showStoryBible ? '#1e2a3f' : '#222', color: showStoryBible ? '#a78bfa' : '#999', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Bible
          </button>

          {/* Beta Review Button */}
          <button
            onClick={toggleBetaReview}
            style={{ padding: '5px 10px', background: showBetaReview ? '#2a1e3f' : '#222', color: showBetaReview ? '#c084fc' : '#999', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Beta
          </button>

          {/* Revision Button */}
          <button
            onClick={toggleRevision}
            style={{ padding: '5px 10px', background: showRevision ? '#3f1e1e' : '#222', color: showRevision ? '#fb923c' : '#999', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Revision
          </button>

          {/* Consistency Button */}
          <button
            onClick={toggleConsistency}
            style={{ padding: '5px 10px', background: showConsistency ? '#1e3a2f' : '#222', color: showConsistency ? '#4ade80' : '#999', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            Consistency
          </button>

          {/* Export Dropdown */}
          <div ref={exportMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(v => !v)}
              disabled={exporting}
              style={{ padding: '5px 10px', background: showExportMenu ? '#1e3a5f' : '#222', color: showExportMenu ? '#60a5fa' : '#999', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: exporting ? 0.5 : 1 }}
            >
              {exporting ? 'Exporting...' : 'Export'}
            </button>
            {showExportMenu && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#111', border: '1px solid #333', borderRadius: 8, padding: '4px 0', minWidth: 150, animation: 'slideIn 0.15s ease', zIndex: 200 }}>
                {(['pdf', 'txt', 'html', 'epub'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => exportBook(fmt)}
                    style={{ display: 'block', width: '100%', padding: '8px 14px', background: 'transparent', color: '#ccc', fontSize: 12, textAlign: 'left', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1e1e1e')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {fmt === 'pdf' ? 'PDF Download' : fmt === 'txt' ? 'TXT Download' : fmt === 'html' ? 'HTML Download' : 'EPUB Download'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setShowMaterials(!showMaterials)} style={{ padding: '5px 10px', background: showMaterials ? '#1e3a5f' : '#222', color: showMaterials ? '#60a5fa' : '#999', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Files ({materials.length})
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: '5px 10px', background: '#222', color: '#999', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Chapters</button>
          <Link href="/dashboard"><button style={{ padding: '5px 10px', background: '#222', color: '#999', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Exit</button></Link>
        </div>
      </nav>

      {/* Generation Progress Banner */}
      {generatingAll && (
        <div style={{ background: '#050518', borderBottom: '1px solid #1e3a5f', padding: '16px 24px', animation: 'fadeInDown 0.3s ease' }}>
          {/* Phase tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
            {GEN_PHASES.map((phase, i) => (
              <div key={phase} style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: i === genPhaseIndex ? '#2563eb' : i < genPhaseIndex ? '#1e3a5f' : '#111', color: i === genPhaseIndex ? '#fff' : i < genPhaseIndex ? '#60a5fa' : '#444', border: `1px solid ${i === genPhaseIndex ? '#2563eb' : i < genPhaseIndex ? '#1e3a5f' : '#333'}`, transition: 'all 0.3s' }}>
                {i < genPhaseIndex ? '+ ' : i === genPhaseIndex ? '> ' : ''}{phase}
              </div>
            ))}
          </div>
          {/* Progress bar */}
          {genChapterTotal > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ height: 6, background: '#1a1a2e', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${genProgressPct}%`, background: 'linear-gradient(90deg, #2563eb, #7c3aed)', borderRadius: 3, transition: 'width 0.5s ease', animation: 'progressPulse 1.5s infinite' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: '#4a6fa5', fontSize: 11 }}>{genProgressPct}% complete</span>
                <span style={{ color: '#4a6fa5', fontSize: 11 }}>
                  {genStartTime && genChapterCurrent > 0 ? estimateTimeRemaining(genChapterCurrent, genChapterTotal, genStartTime) : ''}
                </span>
              </div>
            </div>
          )}
          {/* Status line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 16, height: 16, border: '2px solid transparent', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <span style={{ color: '#60a5fa', fontSize: 14, fontWeight: 600 }}>
              {genChapterTotal > 0 ? `Chapter ${genChapterCurrent}/${genChapterTotal}: ${genProgress.replace(/^(Creating|Writing) chapter \d+\/\d+:\s?/, '')}` : genProgress}
            </span>
          </div>
        </div>
      )}

      {/* Story Bible Panel */}
      {showStoryBible && !generatingAll && (
        <div style={{ background: '#0a0a18', borderBottom: '1px solid #2e1e5f', padding: '14px 20px', animation: 'fadeInDown 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa' }}>Story Bible</h3>
            <button onClick={loadStoryBible} disabled={loadingBible} style={{ padding: '4px 10px', background: '#2e1e5f', color: '#a78bfa', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: loadingBible ? 0.5 : 1 }}>
              {loadingBible ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
          {loadingBible && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7c5aad', fontSize: 13 }}>
              <div style={{ width: 14, height: 14, border: '2px solid transparent', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Analyzing your book to build the Story Bible...
            </div>
          )}
          {!loadingBible && storyBible && (
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {storyBible.characters && storyBible.characters.length > 0 && (
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: 11, color: '#7c5aad', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Characters ({storyBible.characters.length})</p>
                  {storyBible.characters.map((c: Record<string, unknown>, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>{String(c.name || c.character || JSON.stringify(c))}</div>
                  ))}
                </div>
              )}
              {storyBible.themes && storyBible.themes.length > 0 && (
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: 11, color: '#7c5aad', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Themes</p>
                  {storyBible.themes.map((t: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>{t}</div>
                  ))}
                </div>
              )}
              {storyBible.rules && storyBible.rules.length > 0 && (
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontSize: 11, color: '#7c5aad', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>World Rules</p>
                  {storyBible.rules.map((r: string, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>{r}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!loadingBible && !storyBible && (
            <p style={{ color: '#5a4a7a', fontSize: 13 }}>Click Regenerate to create a Story Bible from your chapters.</p>
          )}
        </div>
      )}

      {/* Beta Review Panel */}
      {showBetaReview && !generatingAll && (
        <div style={{ background: '#0f0a18', borderBottom: '1px solid #3e1e5f', padding: '14px 20px', animation: 'fadeInDown 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#c084fc' }}>AI Beta Readers</h3>
            <button onClick={loadBetaReview} disabled={loadingBeta} style={{ padding: '4px 10px', background: '#3e1e5f', color: '#c084fc', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: loadingBeta ? 0.5 : 1 }}>
              {loadingBeta ? 'Reviewing...' : 'Run Review'}
            </button>
          </div>
          {loadingBeta && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9a6acd', fontSize: 13 }}>
              <div style={{ width: 14, height: 14, border: '2px solid transparent', borderTopColor: '#c084fc', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              3 AI beta readers are analyzing your book...
            </div>
          )}
          {!loadingBeta && betaReview && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {(Array.isArray(betaReview) ? betaReview : []).map((review, i) => (
                <div key={i} style={{ flex: 1, minWidth: 220, background: '#111', borderRadius: 8, padding: 12, border: '1px solid #2a1a3f' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#c084fc' }}>{review.reviewer || review.persona}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: review.score >= 8 ? '#4ade80' : review.score >= 6 ? '#f59e0b' : '#ef4444' }}>{review.score}/10</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#aaa', marginBottom: 8, lineHeight: 1.5 }}>{review.feedback}</p>
                  {review.suggestions && review.suggestions.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, color: '#7a5aad', fontWeight: 600, marginBottom: 4 }}>SUGGESTIONS:</p>
                      {review.suggestions.map((s: string, j: number) => (
                        <div key={j} style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>- {s}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {!loadingBeta && !betaReview && (
            <p style={{ color: '#6a4a8a', fontSize: 13 }}>Click Run Review to get feedback from 3 AI beta readers.</p>
          )}
        </div>
      )}

      {/* Deep Revision Panel */}
      {showRevision && !generatingAll && (
        <div style={{ background: '#180a0a', borderBottom: '1px solid #5f2e1e', padding: '14px 20px', animation: 'fadeInDown 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fb923c' }}>Deep Revision (3-Pass)</h3>
            <button onClick={loadDeepRevision} disabled={loadingRevision} style={{ padding: '4px 10px', background: '#5f2e1e', color: '#fb923c', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: loadingRevision ? 0.5 : 1 }}>
              {loadingRevision ? 'Revising...' : 'Start Revision'}
            </button>
          </div>
          {loadingRevision && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ad7a5a', fontSize: 13 }}>
              <div style={{ width: 14, height: 14, border: '2px solid transparent', borderTopColor: '#fb923c', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Running 3-pass deep revision on all chapters... This may take a few minutes.
            </div>
          )}
          {!loadingRevision && revisionReport && (
            <div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <div style={{ background: '#111', borderRadius: 8, padding: '8px 14px', border: '1px solid #3f1e1e' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fb923c' }}>{revisionReport.passes_completed}</div>
                  <div style={{ fontSize: 10, color: '#ad7a5a' }}>Passes</div>
                </div>
                <div style={{ background: '#111', borderRadius: 8, padding: '8px 14px', border: '1px solid #3f1e1e' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fb923c' }}>{revisionReport.total_changes}</div>
                  <div style={{ fontSize: 10, color: '#ad7a5a' }}>Changes</div>
                </div>
                <div style={{ background: '#111', borderRadius: 8, padding: '8px 14px', border: '1px solid #3f1e1e' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fb923c' }}>{revisionReport.improved_chapters}</div>
                  <div style={{ fontSize: 10, color: '#ad7a5a' }}>Improved</div>
                </div>
              </div>
              {revisionReport.details && revisionReport.details.length > 0 && (
                <div style={{ maxHeight: 120, overflow: 'auto' }}>
                  {revisionReport.details.map((d, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#ccc', marginBottom: 4 }}>
                      <span style={{ color: '#fb923c', fontWeight: 600 }}>{d.chapter}:</span> {d.changes.join(', ')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!loadingRevision && !revisionReport && (
            <p style={{ color: '#8a5a4a', fontSize: 13 }}>Deep Revision performs 3 passes: Grammar, Style, and Coherence. Click Start to begin.</p>
          )}
        </div>
      )}

      {/* Consistency Panel */}
      {showConsistency && !generatingAll && (
        <div style={{ background: '#030f07', borderBottom: '1px solid #14532d', padding: '14px 20px', animation: 'fadeInDown 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>Consistency Report</h3>
            <button onClick={loadConsistency} disabled={loadingConsistency} style={{ padding: '4px 10px', background: '#14532d', color: '#4ade80', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: loadingConsistency ? 0.5 : 1 }}>
              {loadingConsistency ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>
          {loadingConsistency && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4a8a5a', fontSize: 13 }}>
              <div style={{ width: 14, height: 14, border: '2px solid transparent', borderTopColor: '#4ade80', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Analyzing your book for consistency...
            </div>
          )}
          {!loadingConsistency && consistencyReport && (
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {/* Entities */}
              <div style={{ flex: 1, minWidth: 220 }}>
                <p style={{ fontSize: 11, color: '#4a8a5a', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>Entities ({consistencyReport.entities.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflow: 'auto' }}>
                  {consistencyReport.entities.map((e, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.consistent ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
                      <span style={{ color: '#ccc' }}>{e.name}</span>
                      <span style={{ color: '#555', fontSize: 10 }}>{e.type}</span>
                      <span style={{ color: '#444', fontSize: 10, marginLeft: 'auto' }}>{e.appearances}x</span>
                    </div>
                  ))}
                  {consistencyReport.entities.length === 0 && <p style={{ color: '#3d6b4f', fontSize: 12 }}>No entities detected yet.</p>}
                </div>
              </div>
              {/* Contradictions */}
              <div style={{ flex: 1, minWidth: 220 }}>
                <p style={{ fontSize: 11, color: '#4a8a5a', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Issues ({consistencyReport.contradictions.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 140, overflow: 'auto' }}>
                  {consistencyReport.contradictions.map((c, i) => (
                    <div key={i} style={{ padding: '6px 8px', borderRadius: 6, background: c.severity === 'error' ? '#1f0a0a' : '#1a140a', border: `1px solid ${c.severity === 'error' ? '#7f1d1d' : '#713f12'}` }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: c.severity === 'error' ? '#ef4444' : '#f59e0b', marginRight: 6 }}>
                        {c.severity === 'error' ? 'CONTRADICTION' : 'WARNING'}
                      </span>
                      <span style={{ fontSize: 12, color: '#ccc' }}>{c.description}</span>
                      {c.chapters.length > 0 && <span style={{ fontSize: 10, color: '#555', marginLeft: 6 }}>Ch. {c.chapters.join(', ')}</span>}
                    </div>
                  ))}
                  {consistencyReport.contradictions.length === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80', fontSize: 12 }}>
                      <span>+</span> No contradictions found
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {!loadingConsistency && !consistencyReport && (
            <p style={{ color: '#3d6b4f', fontSize: 13 }}>Could not load consistency report. The backend endpoint may not be available yet.</p>
          )}
        </div>
      )}

      {/* Materials Panel */}
      {showMaterials && !generatingAll && (
        <div style={{ background: '#0a0a1a', borderBottom: '1px solid #1e3a5f', padding: '14px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa' }}>Source Materials</h3>
            <label style={{ padding: '5px 12px', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              + Upload <input type="file" accept=".pdf,.docx,.txt,.md,.doc,.mp3,.wav,.m4a" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>
          {materials.length === 0 ? (
            <p style={{ color: '#4a6fa5', fontSize: 12 }}>No source files yet. Upload PDFs, DOCX, TXT, or audio files.</p>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {materials.map(m => (
                <div key={m.id} style={{ background: '#111', borderRadius: 6, padding: '8px 12px', border: '1px solid #222', fontSize: 12 }}>
                  <span style={{ color: '#fff' }}>{m.filename}</span>
                  <span style={{ color: '#555', marginLeft: 8 }}>{m.file_size_mb.toFixed(1)}MB</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <aside style={{ width: 260, background: '#0a0a0a', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '14px 14px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>Chapters</h3>
              <button onClick={() => setShowNewChapter(true)} style={{ padding: '3px 8px', background: '#2563eb', color: '#fff', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}>+</button>
            </div>
            {showNewChapter && (
              <div style={{ padding: '6px 14px' }}>
                <input value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)} placeholder="Title..." onKeyDown={e => { if (e.key === 'Enter') addChapter(); if (e.key === 'Escape') setShowNewChapter(false); }} autoFocus style={{ width: '100%', padding: '6px 10px', border: '1px solid #333', borderRadius: 4, background: '#000', color: '#fff', fontSize: 12, outline: 'none', marginBottom: 4, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={addChapter} style={{ flex: 1, padding: '4px', background: '#2563eb', color: '#fff', borderRadius: 4, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Add</button>
                  <button onClick={() => { setShowNewChapter(false); setNewChapterTitle(''); }} style={{ padding: '4px 8px', background: '#222', color: '#999', borderRadius: 4, fontSize: 11, border: 'none', cursor: 'pointer' }}>X</button>
                </div>
              </div>
            )}
            <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
              {chapters.length === 0 ? (
                <div style={{ padding: '24px 14px', textAlign: 'center' }}>
                  <p style={{ color: '#444', fontSize: 12, marginBottom: 16 }}>No chapters yet</p>
                  <button onClick={generateAllChapters} disabled={generatingAll} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    Generate Entire Book
                  </button>
                </div>
              ) : chapters.map(ch => {
                const wc = ch.id === activeChapter ? wordCount : chapterWordCount(ch);
                const barWidth = maxChapterWords > 0 ? Math.round((wc / maxChapterWords) * 100) : 0;
                const sc = statusColor(ch.status);
                return (
                  <div key={ch.id} onClick={() => selectChapter(ch)}
                    style={{ padding: '8px 14px 10px', cursor: 'pointer', borderLeft: activeChapter === ch.id ? '3px solid #2563eb' : '3px solid transparent', background: activeChapter === ch.id ? '#111' : 'transparent', transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (activeChapter !== ch.id) (e.currentTarget as HTMLElement).style.background = '#0f0f0f'; }}
                    onMouseLeave={e => { if (activeChapter !== ch.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 10, color: '#555' }}>Ch. {ch.number}</span>
                      <span style={{ fontSize: 9, color: sc, fontWeight: 600 }}>{statusLabel(ch.status)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: activeChapter === ch.id ? '#fff' : '#999', fontWeight: activeChapter === ch.id ? 600 : 400, marginBottom: 4 }}>{ch.title}</div>
                    {/* Word count + bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, color: '#444' }}>{wc > 0 ? `${wc.toLocaleString()} w` : 'empty'}</span>
                      <div style={{ flex: 1, height: 3, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barWidth}%`, background: sc, borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {chapters.length > 0 && (
              <div style={{ padding: '10px 14px', borderTop: '1px solid #222' }}>
                <button onClick={generateAllChapters} disabled={generatingAll} style={{ width: '100%', padding: '8px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, opacity: generatingAll ? 0.5 : 1, border: 'none', cursor: 'pointer' }}>
                  Regenerate All (God Mode)
                </button>
              </div>
            )}
          </aside>
        )}

        {/* Main Editor */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeChapterData ? (
            <>
              {/* Chapter header + mode toggle */}
              <div style={{ padding: '10px 20px', borderBottom: '1px solid #161616', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{activeChapterData.title}</h2>
                  <p style={{ fontSize: 11, color: '#555' }}>Chapter {activeChapterData.number} &bull; {wordCount.toLocaleString()} words &bull; <span style={{ color: statusColor(activeChapterData.status) }}>{statusLabel(activeChapterData.status)}</span></p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditMode('manual')} style={{ padding: '6px 12px', background: editMode === 'manual' ? '#222' : 'transparent', color: editMode === 'manual' ? '#fff' : '#666', borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid #333', cursor: 'pointer' }}>
                    Manual Edit
                  </button>
                  <button onClick={() => setEditMode('ai')} style={{ padding: '6px 12px', background: editMode === 'ai' ? '#1e3a5f' : 'transparent', color: editMode === 'ai' ? '#60a5fa' : '#666', borderRadius: 6, fontSize: 12, fontWeight: 600, border: '1px solid #333', cursor: 'pointer' }}>
                    AI Edit
                  </button>
                  <button onClick={generateSingleChapter} disabled={generatingChapter} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 600, opacity: generatingChapter ? 0.5 : 1, border: 'none', cursor: 'pointer' }}>
                    {generatingChapter ? '...' : 'Generate'}
                  </button>
                </div>
              </div>

              {/* AI Edit bar */}
              {editMode === 'ai' && (
                <div style={{ padding: '10px 20px', background: '#0a0a1a', borderBottom: '1px solid #1e3a5f', display: 'flex', gap: 8 }}>
                  <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') aiEditContent(); }} placeholder="Tell AI what to change... e.g. 'Make it more dramatic' or 'Add more dialogue'" style={{ flex: 1, padding: '8px 14px', border: '1px solid #333', borderRadius: 6, background: '#000', color: '#fff', fontSize: 13, outline: 'none' }} />
                  <button onClick={aiEditContent} disabled={generatingChapter || !aiPrompt.trim()} style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', opacity: generatingChapter ? 0.5 : 1, border: 'none', cursor: 'pointer' }}>
                    {generatingChapter ? 'Editing...' : 'Apply'}
                  </button>
                </div>
              )}

              {/* Text editor */}
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={editMode === 'manual' ? 'Start writing here...' : 'Content will appear here. Use the AI bar above to request changes.'}
                readOnly={editMode === 'ai' && generatingChapter}
                style={{ flex: 1, padding: '24px', background: '#000', color: '#e2e8f0', fontSize: 16, lineHeight: 1.8, border: 'none', outline: 'none', resize: 'none', fontFamily: 'Georgia, serif', opacity: generatingChapter ? 0.6 : 1 }}
              />
            </>
          ) : (
            /* No chapter selected */
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 32 }}>
              {chapters.length === 0 ? (
                /* Empty state */
                <>
                  <div style={{ fontSize: 56, marginBottom: 20 }}>&#x1F4D6;</div>
                  <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Ready to write your book?</h3>
                  <p style={{ color: '#666', fontSize: 15, marginBottom: 8, textAlign: 'center', maxWidth: 400 }}>
                    Click the button below and AI will generate a complete book with all chapters using God Mode v3 multi-agent pipeline.
                  </p>
                  <p style={{ color: '#555', fontSize: 13, marginBottom: 24 }}>Genre: {project?.genre} &bull; Topic: {project?.topic}</p>
                  <button onClick={generateAllChapters} disabled={generatingAll}
                    style={{ padding: '16px 40px', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', borderRadius: 12, fontSize: 18, fontWeight: 700, animation: 'glow 2s ease-in-out infinite', border: 'none', cursor: 'pointer' }}>
                    Generate Entire Book (God Mode)
                  </button>
                  <p style={{ color: '#444', fontSize: 12, marginTop: 16 }}>You can edit everything after generation</p>
                </>
              ) : (
                /* Book Overview Panel */
                <div style={{ width: '100%', maxWidth: 680, animation: 'fadeInUp 0.4s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                      <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>{project?.title}</h2>
                      <p style={{ color: '#666', fontSize: 13 }}>{project?.genre} &bull; {project?.topic}</p>
                    </div>
                    {/* Export from overview */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowExportMenu(v => !v)}
                        style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                      >
                        Export Book
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                      { label: 'Total Words', value: totalWords.toLocaleString() },
                      { label: 'Est. Pages', value: `~${estimatedPages}` },
                      { label: 'Chapters', value: chapters.length },
                      { label: 'Complete', value: `${overallCompletion}%` },
                    ].map(stat => (
                      <div key={stat.label} style={{ background: '#0f0f0f', borderRadius: 10, padding: '14px 16px', border: '1px solid #222', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{stat.value}</div>
                        <div style={{ fontSize: 11, color: '#555' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Overall progress bar */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#666' }}>Overall completion</span>
                      <span style={{ fontSize: 12, color: '#999' }}>{totalWords.toLocaleString()} / {targetWords.toLocaleString()} words</span>
                    </div>
                    <div style={{ height: 8, background: '#111', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, Math.round((totalWords / targetWords) * 100))}%`, background: 'linear-gradient(90deg, #2563eb, #7c3aed)', borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                  </div>

                  {/* Chapter list */}
                  <div style={{ background: '#0a0a0a', borderRadius: 10, border: '1px solid #1a1a1a', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.8 }}>Chapters</span>
                      <span style={{ fontSize: 12, color: '#444' }}>Words</span>
                    </div>
                    {chapters.map(ch => {
                      const wc = chapterWordCount(ch);
                      const sc = statusColor(ch.status);
                      return (
                        <div key={ch.id} onClick={() => selectChapter(ch)} style={{ padding: '10px 16px', borderBottom: '1px solid #111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#0f0f0f')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#444', width: 32 }}>Ch.{ch.number}</span>
                          <span style={{ flex: 1, fontSize: 13, color: '#ccc' }}>{ch.title}</span>
                          <span style={{ fontSize: 12, color: '#555' }}>{wc > 0 ? wc.toLocaleString() : '—'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#000' }}><div style={{ width: 40, height: 40, border: '3px solid transparent', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>}>
      <EditorContent />
    </Suspense>
  );
}
