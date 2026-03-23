'use client';

import Link from 'next/link';
import { posts } from '@/content/posts';

export const dynamic = 'force-dynamic';

export default function BlogPage() {
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
            <Link href="/blog" className="hover:text-white transition text-white">
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
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Insights for <span className="gradient-text">Growing Your Business Online</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Learn how to get more leads, build professional websites, and grow your business with AI-powered solutions.
          </p>
        </div>
      </section>

      {/* Filter Tags */}
      <section className="px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            <button className="px-5 py-2 rounded-full bg-primary/20 border border-primary/50 text-primary text-sm font-medium hover:bg-primary/30 transition">
              All Articles
            </button>
            <button className="px-5 py-2 rounded-full bg-white/5 border border-white/20 text-gray-400 text-sm font-medium hover:border-primary/30 transition">
              Business Growth
            </button>
            <button className="px-5 py-2 rounded-full bg-white/5 border border-white/20 text-gray-400 text-sm font-medium hover:border-primary/30 transition">
              Marketing Strategy
            </button>
            <button className="px-5 py-2 rounded-full bg-white/5 border border-white/20 text-gray-400 text-sm font-medium hover:border-primary/30 transition">
              How It Works
            </button>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Featured Post */}
            {posts.length > 0 && (
              <div className="md:col-span-2">
                <Link href={`/blog/${posts[0].slug}`}>
                  <article className="group bg-dark-light/50 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition h-full">
                    <div className="flex flex-col md:flex-row h-full">
                      {/* Image placeholder */}
                      <div className="w-full md:w-2/5 h-64 md:h-auto bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center">
                        <span className="text-6xl">📝</span>
                      </div>
                      <div className="p-8 md:w-3/5 flex flex-col justify-between">
                        <div>
                          <div className="flex gap-3 mb-4">
                            <span className="inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-medium">
                              {posts[0].category}
                            </span>
                            <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/20 text-gray-400 text-xs font-medium">
                              {posts[0].industry}
                            </span>
                          </div>
                          <h2 className="text-3xl font-bold mb-3 group-hover:text-primary transition">
                            {posts[0].title}
                          </h2>
                          <p className="text-gray-400 text-lg mb-4">{posts[0].description}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{new Date(posts[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            <span>•</span>
                            <span>{posts[0].readTime} min read</span>
                          </div>
                          <span className="text-primary group-hover:translate-x-1 transition">→</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>
            )}
          </div>

          {/* Other Posts */}
          <div className="grid md:grid-cols-2 gap-8">
            {posts.slice(1).map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <article className="group bg-dark-light/50 border border-white/5 rounded-2xl p-8 hover:border-primary/30 transition h-full flex flex-col">
                  {/* Icon/Emoji */}
                  <div className="text-5xl mb-4">📰</div>

                  {/* Tags */}
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-medium">
                      {post.category}
                    </span>
                    <span className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/20 text-gray-400 text-xs font-medium">
                      {post.industry}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition flex-grow">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-base mb-6">{post.description}</p>

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span>{post.readTime} min</span>
                    </div>
                    <span className="text-primary group-hover:translate-x-1 transition">→</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-dark-light/30 mt-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Build Your Professional Website?</h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Stop losing leads to competitors with better websites. Get your professional website built in 24 hours for $297.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#contact" className="bg-primary hover:bg-primary-dark px-8 py-4 rounded-lg text-lg font-medium transition">
              Get Your Website
            </Link>
            <Link href="/" className="border border-white/20 hover:border-white/40 px-8 py-4 rounded-lg text-lg transition">
              View Services
            </Link>
          </div>
        </div>
      </section>

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
