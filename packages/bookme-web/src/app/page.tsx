'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{email?: string; id?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const ud = localStorage.getItem('user');
    if (token && ud) { setIsLoggedIn(true); try { setUser(JSON.parse(ud)); } catch {} }
    setLoading(false);
  }, []);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus('Thank you! You\'ll receive updates soon.');
    setNewsletterEmail('');
    setTimeout(() => setNewsletterStatus(''), 4000);
  };

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',flexDirection:'column',background:'#000'}}>
      <div style={{width:48,height:48,border:'3px solid transparent',borderTopColor:'#2563eb',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 16px'}}/>
      <p style={{color:'#94a3b8'}}>Loading...</p>
    </div>
  );

  if (isLoggedIn && user) return (
    <div style={{minHeight:'100vh',background:'#000'}}>
      <nav style={{background:'#111',borderBottom:'1px solid #222',padding:'16px 32px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <h1 style={{fontSize:24,fontWeight:800,color:'#2563eb'}}>BookMe</h1>
          <span style={{fontSize:14,color:'#666'}}>AI Writing Platform</span>
        </div>
        <button onClick={()=>{localStorage.removeItem('access_token');localStorage.removeItem('user');window.location.reload()}} style={{padding:'8px 20px',background:'#dc2626',color:'#fff',borderRadius:8,fontWeight:600}}>Logout</button>
      </nav>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'48px 24px'}}>
        <h2 style={{fontSize:30,fontWeight:700,color:'#fff',marginBottom:8}}>Welcome, {user.email}!</h2>
        <p style={{color:'#999',marginBottom:32}}>Your AI writing assistant is ready</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:24}}>
          {[{t:'New Document',d:'Start creating new content with AI assistance',bc:'#2563eb'},
            {t:'My Documents',d:'View and edit your saved documents',bc:'#7c3aed'},
            {t:'Templates',d:'Browse ready-made writing templates',bc:'#16a34a'}
          ].map((c,i)=>(
            <div key={i} style={{padding:24,borderRadius:12,border:`2px solid ${c.bc}`,background:'#111',cursor:'pointer'}}>
              <h3 style={{fontSize:18,fontWeight:600,color:'#fff',marginBottom:8}}>{c.t}</h3>
              <p style={{fontSize:14,color:'#999'}}>{c.d}</p>
            </div>
          ))}
        </div>
        <div style={{marginTop:48,background:'#111',borderRadius:12,padding:24,border:'1px solid #222'}}>
          <h3 style={{fontSize:18,fontWeight:600,color:'#fff',marginBottom:16}}>Recent Activity</h3>
          <p style={{textAlign:'center',padding:'32px 0',color:'#666'}}>No documents yet. Create your first document to get started!</p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#000',color:'#fff'}}>
      {/* Navigation */}
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 40px',maxWidth:1200,margin:'0 auto'}}>
        <h1 style={{fontSize:28,fontWeight:800,color:'#2563eb'}}>BookMe</h1>
        <div style={{display:'flex',gap:16,alignItems:'center'}}>
          <Link href="/auth/login" style={{color:'#ccc',textDecoration:'none',fontSize:15,fontWeight:500}}>Login</Link>
          <Link href="/auth/signup">
            <button style={{background:'#2563eb',color:'#fff',padding:'10px 24px',borderRadius:8,fontWeight:600,fontSize:15}}>Sign Up</button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{textAlign:'center',padding:'80px 24px 60px',maxWidth:800,margin:'0 auto'}}>
        <h2 style={{fontSize:52,fontWeight:800,lineHeight:1.1,marginBottom:24}}>
          Write Better with <span style={{color:'#2563eb'}}>AI Power</span>
        </h2>
        <p style={{fontSize:20,color:'#999',lineHeight:1.6,marginBottom:40,maxWidth:600,margin:'0 auto 40px'}}>
          BookMe is the AI-powered writing platform that helps you create professional content, books, and documents faster than ever. Let artificial intelligence enhance your creativity.
        </p>
        <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap'}}>
          <Link href="/auth/signup">
            <button style={{background:'#2563eb',color:'#fff',padding:'16px 36px',borderRadius:10,fontWeight:700,fontSize:18,boxShadow:'0 4px 20px rgba(37,99,235,0.4)'}}>
              Sign Up Free
            </button>
          </Link>
          <button onClick={()=>{const el=document.getElementById('demo');if(el)el.scrollIntoView({behavior:'smooth'})}} style={{background:'transparent',color:'#2563eb',padding:'16px 36px',borderRadius:10,fontWeight:700,fontSize:18,border:'2px solid #2563eb'}}>
            Watch Demo
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section style={{padding:'60px 24px',maxWidth:1100,margin:'0 auto'}}>
        <h3 style={{textAlign:'center',fontSize:32,fontWeight:700,marginBottom:48}}>
          Everything You Need to <span style={{color:'#2563eb'}}>Write Brilliantly</span>
        </h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',gap:32}}>
          {[
            {icon:'✍️',title:'AI Writing Assistant',desc:'Get intelligent suggestions, auto-complete paragraphs, and refine your writing style with advanced AI models.'},
            {icon:'📚',title:'Book Creator',desc:'Structure your book with chapters, organize content, and export to multiple formats including PDF and EPUB.'},
            {icon:'🎨',title:'Smart Templates',desc:'Choose from dozens of professional templates for articles, blogs, books, marketing copy, and more.'},
            {icon:'🤝',title:'Real-time Collaboration',desc:'Work together with your team. Share documents, leave comments, and track changes in real-time.'},
            {icon:'🔒',title:'Secure & Private',desc:'Your content is encrypted and protected. We never use your writing to train AI models.'},
            {icon:'⚡',title:'Lightning Fast',desc:'Generate drafts in seconds, not hours. Our AI understands context and delivers quality content instantly.'}
          ].map((f,i)=>(
            <div key={i} style={{background:'#111',borderRadius:16,padding:32,border:'1px solid #222',transition:'border-color 0.2s'}}>
              <div style={{fontSize:36,marginBottom:16}}>{f.icon}</div>
              <h4 style={{fontSize:20,fontWeight:600,marginBottom:12,color:'#fff'}}>{f.title}</h4>
              <p style={{fontSize:15,color:'#999',lineHeight:1.6}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo / How it Works Section */}
      <section id="demo" style={{padding:'80px 24px',maxWidth:900,margin:'0 auto',textAlign:'center'}}>
        <h3 style={{fontSize:32,fontWeight:700,marginBottom:16}}>How <span style={{color:'#2563eb'}}>BookMe</span> Works</h3>
        <p style={{color:'#999',fontSize:18,marginBottom:48}}>Three simple steps to transform your writing</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:32}}>
          {[
            {step:'1',title:'Create a Project',desc:'Start a new book, article, or document. Choose a template or start from scratch.'},
            {step:'2',title:'Write with AI',desc:'Let our AI assistant help you write, edit, and refine your content in real-time.'},
            {step:'3',title:'Publish & Share',desc:'Export your finished work in multiple formats or share it directly with your audience.'}
          ].map((s,i)=>(
            <div key={i} style={{textAlign:'center'}}>
              <div style={{width:64,height:64,borderRadius:'50%',background:'#2563eb',color:'#fff',fontSize:28,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px'}}>
                {s.step}
              </div>
              <h4 style={{fontSize:20,fontWeight:600,marginBottom:8}}>{s.title}</h4>
              <p style={{color:'#999',fontSize:15,lineHeight:1.5}}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{padding:'60px 24px',maxWidth:1000,margin:'0 auto'}}>
        <h3 style={{textAlign:'center',fontSize:32,fontWeight:700,marginBottom:48}}>
          What Our Users <span style={{color:'#2563eb'}}>Say</span>
        </h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:24}}>
          {[
            {quote:'BookMe completely transformed how I write. The AI suggestions are incredibly accurate and save me hours every day.',name:'Sarah M.',role:'Content Creator'},
            {quote:'I published my first book in just 2 weeks using BookMe. The templates and AI assistance made it effortless.',name:'James K.',role:'Author'},
            {quote:'The collaboration features are amazing. Our marketing team produces 3x more content since we started using BookMe.',name:'Lisa R.',role:'Marketing Director'}
          ].map((t,i)=>(
            <div key={i} style={{background:'#111',borderRadius:16,padding:28,border:'1px solid #222'}}>
              <p style={{color:'#ccc',fontSize:15,lineHeight:1.6,marginBottom:16,fontStyle:'italic'}}>&ldquo;{t.quote}&rdquo;</p>
              <div>
                <p style={{fontWeight:600,color:'#fff',fontSize:15}}>{t.name}</p>
                <p style={{color:'#2563eb',fontSize:13}}>{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section style={{padding:'80px 24px',textAlign:'center'}}>
        <div style={{maxWidth:600,margin:'0 auto',background:'#111',borderRadius:20,padding:'48px 40px',border:'1px solid #222'}}>
          <h3 style={{fontSize:28,fontWeight:700,marginBottom:12}}>Stay Updated</h3>
          <p style={{color:'#999',fontSize:16,marginBottom:32}}>
            Get the latest news, tips, and updates about BookMe delivered straight to your inbox.
          </p>
          {newsletterStatus ? (
            <p style={{color:'#22c55e',fontSize:16,fontWeight:600}}>{newsletterStatus}</p>
          ) : (
            <form onSubmit={handleNewsletter} style={{display:'flex',gap:12,maxWidth:460,margin:'0 auto',flexWrap:'wrap',justifyContent:'center'}}>
              <input
                type="email"
                value={newsletterEmail}
                onChange={e => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                style={{flex:1,minWidth:240,padding:'14px 18px',borderRadius:10,border:'1px solid #333',background:'#000',color:'#fff',fontSize:15,outline:'none'}}
              />
              <button type="submit" style={{background:'#2563eb',color:'#fff',padding:'14px 28px',borderRadius:10,fontWeight:700,fontSize:15,whiteSpace:'nowrap'}}>
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{borderTop:'1px solid #222',padding:'40px 24px',textAlign:'center'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <h4 style={{fontSize:22,fontWeight:800,color:'#2563eb',marginBottom:8}}>BookMe</h4>
          <p style={{color:'#666',fontSize:14,marginBottom:24}}>AI-Powered Writing Platform</p>
          <div style={{display:'flex',gap:24,justifyContent:'center',marginBottom:24,flexWrap:'wrap'}}>
            <Link href="/auth/signup" style={{color:'#999',textDecoration:'none',fontSize:14}}>Sign Up</Link>
            <Link href="/auth/login" style={{color:'#999',textDecoration:'none',fontSize:14}}>Login</Link>
            <a href="#demo" style={{color:'#999',textDecoration:'none',fontSize:14}}>How it Works</a>
          </div>
          <p style={{color:'#444',fontSize:13}}>&copy; 2026 BookMe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
