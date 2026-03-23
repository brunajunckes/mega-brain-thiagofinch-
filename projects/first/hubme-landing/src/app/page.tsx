'use client';

import { useState } from 'react';

export const dynamic = 'force-dynamic';

const services = [
  {
    icon: '🤖',
    title: 'AI Chatbots',
    description: 'Custom chatbots trained on YOUR data. Answer customer questions 24/7 with accuracy.',
    features: ['Trained on your documents & FAQs', 'Website widget (1 line of code)', 'Multi-language support', 'Lead capture & analytics'],
    price: 'From $150',
  },
  {
    icon: '⚡',
    title: 'AI Automation',
    description: 'Replace repetitive tasks with intelligent automation. Save 20+ hours per week.',
    features: ['Document processing & OCR', 'Email classification', 'Data extraction & entry', 'Custom API integrations'],
    price: 'From $250',
  },
  {
    icon: '🚀',
    title: 'Web Applications',
    description: 'Production-ready full-stack apps. SaaS platforms, dashboards, and APIs built fast.',
    features: ['Next.js, React, Node.js, Python', 'Database & authentication', 'Payment integration (Stripe)', 'Deployed & production-ready'],
    price: 'From $200',
  },
  {
    icon: '🔧',
    title: 'API & Backend',
    description: 'Solid REST APIs and backend systems that handle real traffic.',
    features: ['RESTful API design', 'PostgreSQL & Redis', 'Authentication & rate limiting', 'Full documentation (Swagger)'],
    price: 'From $150',
  },
];

const results = [
  { metric: '24h', label: 'Average Delivery Time' },
  { metric: '20+', label: 'Hours Saved Per Week' },
  { metric: '99.9%', label: 'Infrastructure Uptime' },
  { metric: '10x', label: 'Faster Than Traditional Dev' },
];

const process_steps = [
  { step: '01', title: 'Tell Us Your Problem', description: 'Describe the process that wastes your time or the tool you need built.' },
  { step: '02', title: 'We Build It Fast', description: 'Our AI-powered development process delivers in days, not months.' },
  { step: '03', title: 'You Save Time & Money', description: 'Start seeing measurable results from day one. Real ROI, not promises.' },
];

export default function Home() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-dark/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold gradient-text">HubMe AI</div>
          <div className="hidden md:flex gap-8 text-sm text-gray-400">
            <a href="#services" className="hover:text-white transition">Services</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
          </div>
          <a href="#contact" className="bg-primary hover:bg-primary-dark px-5 py-2 rounded-lg text-sm font-medium transition">
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
            AI-Powered Development Agency
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            We Build <span className="gradient-text">AI Solutions</span> That Save You{' '}
            <span className="gradient-text">20+ Hours</span> Per Week
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Custom chatbots, automation workflows, and full-stack applications.
            Delivered in days, not months. Built on our own infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#contact" className="bg-primary hover:bg-primary-dark px-8 py-4 rounded-lg text-lg font-medium transition animate-pulse-glow">
              Start Your Project
            </a>
            <a href="#services" className="border border-white/20 hover:border-white/40 px-8 py-4 rounded-lg text-lg transition">
              View Services
            </a>
          </div>
        </div>
      </section>

      {/* Results Bar */}
      <section className="py-12 border-y border-white/5 bg-dark-light/50">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {results.map((r) => (
            <div key={r.label} className="text-center">
              <div className="text-4xl font-bold gradient-text mb-1">{r.metric}</div>
              <div className="text-sm text-gray-400">{r.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What We Build</h2>
            <p className="text-gray-400 text-lg">AI-powered solutions tailored to your business needs</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service) => (
              <div key={service.title} className="bg-dark-light/50 border border-white/5 rounded-2xl p-8 hover:border-primary/30 transition group">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                <p className="text-gray-400 mb-6">{service.description}</p>
                <ul className="space-y-2 mb-6">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-primary">&#10003;</span> {f}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold gradient-text">{service.price}</span>
                  <a href="#contact" className="text-primary hover:text-accent text-sm transition">
                    Get Quote &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-dark-light/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-400 text-lg">Three simple steps to transform your business</p>
          </div>
          <div className="space-y-12">
            {process_steps.map((s) => (
              <div key={s.step} className="flex gap-6 items-start">
                <div className="text-5xl font-bold text-primary/20 shrink-0">{s.step}</div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-lg">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why HubMe AI</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-3xl mb-3">&#9889;</div>
              <h3 className="text-lg font-bold mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-400">Most projects delivered in 24-48 hours. Not weeks, not months.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-3xl mb-3">&#128274;</div>
              <h3 className="text-lg font-bold mb-2">Own Infrastructure</h3>
              <p className="text-sm text-gray-400">Dedicated servers, not shared hosting. Your data stays private and fast.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-3xl mb-3">&#128176;</div>
              <h3 className="text-lg font-bold mb-2">Real ROI</h3>
              <p className="text-sm text-gray-400">We measure success by hours saved and revenue generated, not features shipped.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-6 bg-dark-light/30">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Start Your Project</h2>
            <p className="text-gray-400 text-lg">Tell us what you need. We will get back to you within 24 hours.</p>
          </div>
          {submitted ? (
            <div className="text-center py-12 bg-dark-light border border-primary/20 rounded-2xl">
              <div className="text-5xl mb-4">&#10003;</div>
              <h3 className="text-2xl font-bold mb-2">Message Received!</h3>
              <p className="text-gray-400">We will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-5 py-4 bg-dark border border-white/10 rounded-xl focus:border-primary focus:outline-none transition"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Your Email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-5 py-4 bg-dark border border-white/10 rounded-xl focus:border-primary focus:outline-none transition"
                />
              </div>
              <div>
                <textarea
                  placeholder="Describe your project or the problem you want to solve..."
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-5 py-4 bg-dark border border-white/10 rounded-xl focus:border-primary focus:outline-none transition resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark py-4 rounded-xl text-lg font-medium transition"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="gradient-text font-bold text-lg">HubMe AI</div>
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
