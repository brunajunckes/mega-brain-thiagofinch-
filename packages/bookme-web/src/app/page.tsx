'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function useOnScreen(ref: React.RefObject<HTMLElement | null>, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{email?: string; id?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');

  const featRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const testRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);
  const featVis = useOnScreen(featRef);
  const demoVis = useOnScreen(demoRef);
  const testVis = useOnScreen(testRef);
  const newsVis = useOnScreen(newsRef);

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
      <p style={{color:'#94a3b8',animation:'pulse 1.5s ease-in-out infinite'}}>Loading...</p>
    </div>
  );

  /* ===== DASHBOARD (logged in) ===== */
  if (isLoggedIn && user) return (
    <div style={{minHeight:'100vh',background:'#000'}}>
      <nav style={{background:'#111',borderBottom:'1px solid #222',padding:'16px 32px',display:'flex',justifyContent:'space-between',alignItems:'center',animation:'fadeInDown 0.5s ease'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <h1 style={{fontSize:24,fontWeight:800,color:'#2563eb'}}>BookMe</h1>
          <span style={{fontSize:14,color:'#666'}}>AI Writing Platform</span>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <span style={{color:'#999',fontSize:14}}>{user.email}</span>
          <button onClick={()=>{localStorage.removeItem('access_token');localStorage.removeItem('user');window.location.reload()}} style={{padding:'8px 20px',background:'#dc2626',color:'#fff',borderRadius:8,fontWeight:600,fontSize:14}}>Logout</button>
        </div>
      </nav>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'48px 24px'}}>
        <div style={{animation:'fadeInUp 0.6s ease'}}>
          <h2 style={{fontSize:30,fontWeight:700,color:'#fff',marginBottom:8}}>Welcome, {user.email}!</h2>
          <p style={{color:'#999',marginBottom:32}}>Your AI writing assistant is ready</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:24}}>
          {[{t:'New Document',d:'Start creating new content with AI assistance',bc:'#2563eb',icon:'✍️'},
            {t:'My Documents',d:'View and edit your saved documents',bc:'#7c3aed',icon:'📚'},
            {t:'Templates',d:'Browse ready-made writing templates',bc:'#16a34a',icon:'🎨'}
          ].map((c,i)=>(
            <div key={i} style={{padding:24,borderRadius:12,border:`2px solid ${c.bc}`,background:'#111',cursor:'pointer',animation:`fadeInUp 0.6s ease ${0.1*(i+1)}s both`,transition:'transform 0.3s, box-shadow 0.3s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-6px)';(e.currentTarget as HTMLElement).style.boxShadow=`0 12px 30px ${c.bc}33`}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow='none'}}>
              <div style={{fontSize:32,marginBottom:12}}>{c.icon}</div>
              <h3 style={{fontSize:18,fontWeight:600,color:'#fff',marginBottom:8}}>{c.t}</h3>
              <p style={{fontSize:14,color:'#999'}}>{c.d}</p>
            </div>
          ))}
        </div>
        <div style={{marginTop:48,background:'#111',borderRadius:12,padding:24,border:'1px solid #222',animation:'fadeInUp 0.6s ease 0.5s both'}}>
          <h3 style={{fontSize:18,fontWeight:600,color:'#fff',marginBottom:16}}>Recent Activity</h3>
          <p style={{textAlign:'center',padding:'32px 0',color:'#666'}}>No documents yet. Create your first document to get started!</p>
        </div>
      </div>
    </div>
  );

  /* ===== LANDING PAGE (not logged in) ===== */
  return (
    <div style={{minHeight:'100vh',background:'#000',color:'#fff',overflowX:'hidden'}}>
      {/* Navigation */}
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 40px',maxWidth:1200,margin:'0 auto',animation:'fadeInDown 0.6s ease'}}>
        <h1 style={{fontSize:28,fontWeight:800,color:'#2563eb'}}>BookMe</h1>
        <div style={{display:'flex',gap:16,alignItems:'center'}}>
          <Link href="/auth/login" style={{color:'#ccc',textDecoration:'none',fontSize:15,fontWeight:500,transition:'color 0.2s'}}>Login</Link>
          <Link href="/auth/signup">
            <button style={{background:'#2563eb',color:'#fff',padding:'10px 24px',borderRadius:8,fontWeight:600,fontSize:15}}>Sign Up</button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{textAlign:'center',padding:'80px 24px 60px',maxWidth:800,margin:'0 auto'}}>
        <h2 style={{fontSize:52,fontWeight:800,lineHeight:1.1,marginBottom:24,animation:'fadeInUp 0.8s ease'}}>
          Write Better with{' '}
          <span style={{background:'linear-gradient(90deg, #2563eb, #06b6d4, #2563eb)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',animation:'shimmer 3s linear infinite'}}>AI Power</span>
        </h2>
        <p style={{fontSize:20,color:'#999',lineHeight:1.6,marginBottom:40,maxWidth:600,margin:'0 auto 40px',animation:'fadeInUp 0.8s ease 0.2s both'}}>
          BookMe is the AI-powered writing platform that helps you create professional content, books, and documents faster than ever. Let artificial intelligence enhance your creativity.
        </p>
        <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap',animation:'fadeInUp 0.8s ease 0.4s both'}}>
          <Link href="/auth/signup">
            <button style={{background:'linear-gradient(135deg, #2563eb, #1d4ed8)',color:'#fff',padding:'16px 36px',borderRadius:10,fontWeight:700,fontSize:18,animation:'glow 2s ease-in-out infinite'}}>
              Sign Up Free
            </button>
          </Link>
          <button onClick={()=>{const el=document.getElementById('demo');if(el)el.scrollIntoView({behavior:'smooth'})}} style={{background:'transparent',color:'#2563eb',padding:'16px 36px',borderRadius:10,fontWeight:700,fontSize:18,border:'2px solid #2563eb',transition:'background 0.3s, color 0.3s'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#2563eb';(e.currentTarget as HTMLElement).style.color='#fff'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.color='#2563eb'}}>
            Watch Demo
          </button>
        </div>
      </section>

      {/* Floating particles background effect */}
      <div style={{position:'relative'}}>
        <div style={{position:'absolute',top:-60,left:'10%',width:6,height:6,borderRadius:'50%',background:'#2563eb',opacity:0.4,animation:'float 4s ease-in-out infinite'}}/>
        <div style={{position:'absolute',top:-30,right:'15%',width:4,height:4,borderRadius:'50%',background:'#06b6d4',opacity:0.3,animation:'float 5s ease-in-out infinite 1s'}}/>
        <div style={{position:'absolute',top:20,left:'25%',width:5,height:5,borderRadius:'50%',background:'#3b82f6',opacity:0.3,animation:'float 6s ease-in-out infinite 0.5s'}}/>
        <div style={{position:'absolute',top:-10,right:'30%',width:3,height:3,borderRadius:'50%',background:'#2563eb',opacity:0.5,animation:'float 3.5s ease-in-out infinite 2s'}}/>
      </div>

      {/* Features Section */}
      <section ref={featRef} style={{padding:'60px 24px',maxWidth:1100,margin:'0 auto'}}>
        <h3 style={{textAlign:'center',fontSize:32,fontWeight:700,marginBottom:48,opacity:featVis?1:0,transform:featVis?'translateY(0)':'translateY(20px)',transition:'all 0.6s ease'}}>
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
            <div key={i} style={{background:'#111',borderRadius:16,padding:32,border:'1px solid #222',opacity:featVis?1:0,transform:featVis?'translateY(0)':'translateY(30px)',transition:`all 0.6s ease ${0.1*i}s`,cursor:'pointer'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-8px)';(e.currentTarget as HTMLElement).style.borderColor='#2563eb';(e.currentTarget as HTMLElement).style.boxShadow='0 12px 40px rgba(37,99,235,0.15)'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.borderColor='#222';(e.currentTarget as HTMLElement).style.boxShadow='none'}}>
              <div style={{fontSize:36,marginBottom:16,animation:featVis?'float 3s ease-in-out infinite':'none',animationDelay:`${0.3*i}s`}}>{f.icon}</div>
              <h4 style={{fontSize:20,fontWeight:600,marginBottom:12,color:'#fff'}}>{f.title}</h4>
              <p style={{fontSize:15,color:'#999',lineHeight:1.6}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo / How it Works Section */}
      <section id="demo" ref={demoRef} style={{padding:'80px 24px',maxWidth:900,margin:'0 auto',textAlign:'center'}}>
        <h3 style={{fontSize:32,fontWeight:700,marginBottom:16,opacity:demoVis?1:0,transform:demoVis?'translateY(0)':'translateY(20px)',transition:'all 0.6s ease'}}>
          How <span style={{background:'linear-gradient(90deg, #2563eb, #06b6d4)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>BookMe</span> Works
        </h3>
        <p style={{color:'#999',fontSize:18,marginBottom:48,opacity:demoVis?1:0,transition:'opacity 0.6s ease 0.2s'}}>Three simple steps to transform your writing</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',gap:32}}>
          {[
            {step:'1',title:'Create a Project',desc:'Start a new book, article, or document. Choose a template or start from scratch.'},
            {step:'2',title:'Write with AI',desc:'Let our AI assistant help you write, edit, and refine your content in real-time.'},
            {step:'3',title:'Publish & Share',desc:'Export your finished work in multiple formats or share it directly with your audience.'}
          ].map((s,i)=>(
            <div key={i} style={{textAlign:'center',opacity:demoVis?1:0,transform:demoVis?'translateY(0) scale(1)':'translateY(20px) scale(0.9)',transition:`all 0.6s ease ${0.2*i}s`}}>
              <div style={{width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg, #2563eb, #1d4ed8)',color:'#fff',fontSize:30,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',animation:demoVis?'float 3s ease-in-out infinite':'none',animationDelay:`${i*0.5}s`,boxShadow:'0 8px 30px rgba(37,99,235,0.3)'}}>
                {s.step}
              </div>
              <h4 style={{fontSize:20,fontWeight:600,marginBottom:8}}>{s.title}</h4>
              <p style={{color:'#999',fontSize:15,lineHeight:1.5}}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testRef} style={{padding:'60px 24px',maxWidth:1000,margin:'0 auto'}}>
        <h3 style={{textAlign:'center',fontSize:32,fontWeight:700,marginBottom:48,opacity:testVis?1:0,transform:testVis?'translateY(0)':'translateY(20px)',transition:'all 0.6s ease'}}>
          What Our Users <span style={{color:'#2563eb'}}>Say</span>
        </h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:24}}>
          {[
            {quote:'BookMe completely transformed how I write. The AI suggestions are incredibly accurate and save me hours every day.',name:'Sarah M.',role:'Content Creator'},
            {quote:'I published my first book in just 2 weeks using BookMe. The templates and AI assistance made it effortless.',name:'James K.',role:'Author'},
            {quote:'The collaboration features are amazing. Our marketing team produces 3x more content since we started using BookMe.',name:'Lisa R.',role:'Marketing Director'}
          ].map((t,i)=>(
            <div key={i} style={{background:'#111',borderRadius:16,padding:28,border:'1px solid #222',opacity:testVis?1:0,transform:testVis?'translateY(0)':'translateY(20px)',transition:`all 0.6s ease ${0.15*i}s`,cursor:'default'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLElement).style.borderColor='#333'}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.borderColor='#222'}}>
              <div style={{fontSize:32,color:'#2563eb',marginBottom:12,opacity:0.5}}>&ldquo;</div>
              <p style={{color:'#ccc',fontSize:15,lineHeight:1.6,marginBottom:16}}>{t.quote}</p>
              <div>
                <p style={{fontWeight:600,color:'#fff',fontSize:15}}>{t.name}</p>
                <p style={{color:'#2563eb',fontSize:13}}>{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section ref={newsRef} style={{padding:'80px 24px',textAlign:'center'}}>
        <div style={{maxWidth:600,margin:'0 auto',background:'linear-gradient(135deg, #111 0%, #0a0a1a 100%)',borderRadius:20,padding:'48px 40px',border:'1px solid #222',opacity:newsVis?1:0,transform:newsVis?'translateY(0) scale(1)':'translateY(20px) scale(0.95)',transition:'all 0.6s ease'}}>
          <h3 style={{fontSize:28,fontWeight:700,marginBottom:12}}>Stay Updated</h3>
          <p style={{color:'#999',fontSize:16,marginBottom:32}}>
            Get the latest news, tips, and updates about BookMe delivered straight to your inbox.
          </p>
          {newsletterStatus ? (
            <p style={{color:'#22c55e',fontSize:16,fontWeight:600,animation:'fadeInUp 0.4s ease'}}>{newsletterStatus}</p>
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
              <button type="submit" style={{background:'linear-gradient(135deg, #2563eb, #1d4ed8)',color:'#fff',padding:'14px 28px',borderRadius:10,fontWeight:700,fontSize:15,whiteSpace:'nowrap'}}>
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{padding:'60px 24px 80px',textAlign:'center'}}>
        <h3 style={{fontSize:36,fontWeight:700,marginBottom:16}}>Ready to Start Writing?</h3>
        <p style={{color:'#999',fontSize:18,marginBottom:32}}>Join thousands of writers who trust BookMe</p>
        <Link href="/auth/signup">
          <button style={{background:'linear-gradient(135deg, #2563eb, #1d4ed8)',color:'#fff',padding:'18px 48px',borderRadius:12,fontWeight:700,fontSize:20,animation:'glow 2s ease-in-out infinite'}}>
            Get Started Free
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{borderTop:'1px solid #222',padding:'40px 24px',textAlign:'center'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <h4 style={{fontSize:22,fontWeight:800,color:'#2563eb',marginBottom:8}}>BookMe</h4>
          <p style={{color:'#666',fontSize:14,marginBottom:24}}>AI-Powered Writing Platform</p>
          <div style={{display:'flex',gap:24,justifyContent:'center',marginBottom:24,flexWrap:'wrap'}}>
            <Link href="/auth/signup" style={{color:'#999',textDecoration:'none',fontSize:14,transition:'color 0.2s'}}>Sign Up</Link>
            <Link href="/auth/login" style={{color:'#999',textDecoration:'none',fontSize:14,transition:'color 0.2s'}}>Login</Link>
            <a href="#demo" style={{color:'#999',textDecoration:'none',fontSize:14,transition:'color 0.2s'}}>How it Works</a>
          </div>
          <p style={{color:'#444',fontSize:13}}>&copy; 2026 BookMe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
