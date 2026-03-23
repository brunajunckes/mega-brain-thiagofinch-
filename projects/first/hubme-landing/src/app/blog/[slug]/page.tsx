'use client';

import Link from 'next/link';
import { posts } from '@/content/posts';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  // Get related posts (same industry, different article)
  const relatedPosts = posts
    .filter((p) => p.industry === post.industry && p.id !== post.id)
    .slice(0, 3);

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-dark/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold gradient-text">
            HubMe AI
          </Link>
          <div className="hidden md:flex gap-8 text-sm text-gray-400">
            <Link href="/#services" className="hover:text-white transition">
              Services
            </Link>
            <Link href="/blog" className="hover:text-white transition">
              Blog
            </Link>
            <Link href="/#contact" className="hover:text-white transition">
              Contact
            </Link>
          </div>
          <Link href="/#contact" className="bg-primary hover:bg-primary-dark px-5 py-2 rounded-lg text-sm font-medium transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-8 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="inline-block text-primary hover:text-cyan-400 text-sm font-medium mb-6 transition">
            ← Back to Blog
          </Link>

          <div className="flex gap-3 mb-6 flex-wrap">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-medium">
              {post.category}
            </span>
            <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/20 text-gray-400 text-xs font-medium">
              {post.industry}
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{post.title}</h1>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-gray-400">
            <span className="text-sm">
              {new Date(post.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="hidden sm:block">•</span>
            <span className="text-sm">{post.readTime} min read</span>
            {post.author && (
              <>
                <span className="hidden sm:block">•</span>
                <span className="text-sm">By {post.author}</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <article className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Featured Image Placeholder */}
          <div className="w-full h-96 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-2xl mb-12 flex items-center justify-center">
            <span className="text-8xl">📝</span>
          </div>

          {/* Markdown-like content */}
          <div className="prose prose-invert max-w-none mb-12">
            <div className="text-gray-300 leading-relaxed space-y-6">
              {post.content && post.content.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('#')) {
                  const headingMatch = paragraph.match(/^(#{1,3})\s+(.+)$/);
                  if (headingMatch) {
                    const level = headingMatch[1].length;
                    const text = headingMatch[2];
                    const headingClasses = {
                      1: 'text-3xl font-bold mt-8 mb-4',
                      2: 'text-2xl font-bold mt-6 mb-3',
                      3: 'text-xl font-bold mt-4 mb-2',
                    };
                    return (
                      <h2 key={idx} className={headingClasses[level as 1 | 2 | 3] || 'text-xl font-bold'}>
                        {text}
                      </h2>
                    );
                  }
                }

                if (paragraph.startsWith('-') || paragraph.startsWith('•')) {
                  return (
                    <ul key={idx} className="space-y-2 ml-4">
                      {paragraph.split('\n').map((item, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="text-primary shrink-0">•</span>
                          <span>{item.replace(/^[-•]\s+/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }

                if (paragraph.startsWith('|')) {
                  return (
                    <div key={idx} className="overflow-x-auto mb-4">
                      <table className="w-full text-sm border-collapse">
                        <tbody>
                          {paragraph.split('\n').map((row, i) => {
                            if (row.startsWith('|')) {
                              const cells = row.split('|').filter((c) => c.trim());
                              return (
                                <tr key={i} className={i === 1 ? 'border-b border-white/10' : ''}>
                                  {cells.map((cell, j) => (
                                    <td key={j} className="px-3 py-2 border border-white/5 text-left">
                                      {cell.trim()}
                                    </td>
                                  ))}
                                </tr>
                              );
                            }
                            return null;
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                return (
                  <p key={idx} className="text-base leading-relaxed text-gray-300">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </div>

          {!post.content && (
            <div className="bg-dark-light/50 border border-white/10 rounded-xl p-8 text-center mb-12">
              <p className="text-gray-400">Full article content coming soon. Check back later for the complete story.</p>
            </div>
          )}

          {/* Keywords */}
          {post.keywords && post.keywords.length > 0 && (
            <div className="py-8 border-y border-white/5">
              <p className="text-sm text-gray-500 mb-3">Keywords:</p>
              <div className="flex flex-wrap gap-2">
                {post.keywords.map((keyword) => (
                  <span key={keyword} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author Bio */}
          {post.author && (
            <div className="py-8 bg-dark-light/30 rounded-2xl p-6 my-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center text-xl">
                  🤖
                </div>
                <div>
                  <h3 className="font-bold">{post.author}</h3>
                  <p className="text-sm text-gray-400">AI-powered content team</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                The HubMe AI team writes about business growth, marketing strategy, and how AI-powered solutions can help your company succeed online.
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/20 rounded-2xl p-8 my-12 text-center">
            <h3 className="text-2xl font-bold mb-3">Ready to Build Your Professional Website?</h3>
            <p className="text-gray-400 mb-6 max-w-xl mx-auto">
              Get a professional website built in 24 hours for just $297. No design meetings. No waiting weeks. Live tomorrow.
            </p>
            <Link
              href="/#contact"
              className="inline-block bg-primary hover:bg-primary-dark px-8 py-3 rounded-lg font-medium transition"
            >
              Get Your Website Today
            </Link>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 px-6 bg-dark-light/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">More from {post.industry}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                  <article className="group bg-dark-light/50 border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition h-full flex flex-col">
                    <div className="text-4xl mb-4">📄</div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition flex-grow">{relatedPost.title}</h3>
                    <p className="text-gray-400 text-sm mb-4">{relatedPost.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-sm text-gray-500">
                      <span>{relatedPost.readTime} min read</span>
                      <span className="text-primary group-hover:translate-x-1 transition">→</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="gradient-text font-bold text-lg">
            HubMe AI
          </Link>
          <div className="text-sm text-gray-500">
            &copy; 2026 HubMe AI. AI-powered solutions for modern businesses.
          </div>
          <div className="text-sm text-gray-500">
            contact@hubme.tech
          </div>
        </div>
      </footer>
    </main>
  );
}
