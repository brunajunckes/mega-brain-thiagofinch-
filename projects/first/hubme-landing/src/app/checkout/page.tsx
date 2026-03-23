'use client';

import { useState } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const packages = [
  {
    name: 'Starter Website',
    oneTime: 297,
    monthly: 97,
    description: 'Perfect for small businesses and startups',
    features: [
      'Professional website (5-8 pages)',
      'Mobile responsive design',
      'Contact form & email notifications',
      'Basic SEO optimization',
      'SSL certificate included',
      'Monthly maintenance & support',
    ],
    highlighted: false,
    stripeUrl: 'https://buy.stripe.com/test_eVq28tdA803Dgiwf2Oc3m00',
  },
  {
    name: 'Pro Website',
    oneTime: 597,
    monthly: 197,
    description: 'Advanced features for growing businesses',
    features: [
      'Everything in Starter, plus:',
      'AI Chatbot integration',
      'E-commerce functionality (up to 100 products)',
      'Advanced analytics & tracking',
      'Content management system (CMS)',
      'Priority support (24h response)',
      'Monthly updates & optimization',
    ],
    highlighted: true,
    stripeUrl: 'https://buy.stripe.com/test_9B628t9jSg2B3vKg6Sc3m01',
  },
  {
    name: 'Enterprise Package',
    oneTime: 1497,
    monthly: 497,
    description: 'Custom solutions for large-scale operations',
    features: [
      'Everything in Pro, plus:',
      'Custom API development',
      'Advanced automation workflows',
      'Dedicated account manager',
      'Multi-language support',
      'Unlimited products & features',
      ' 24/7 priority support',
      'Custom integrations & scaling',
    ],
    highlighted: false,
    stripeUrl: 'https://buy.stripe.com/test_14A14pbs0bMl5DS4oac3m02',
  },
];

const trustSignals = [
  { icon: '🔒', label: 'SSL Secure', description: 'Enterprise-grade security' },
  { icon: '💰', label: '30-Day Money Back', description: 'Full refund guarantee' },
  { icon: '⚡', label: '24h Delivery', description: 'Fast deployment' },
];

export default function CheckoutPage() {
  const [customFormData, setCustomFormData] = useState({
    name: '',
    email: '',
    description: '',
    budget: 'not-specified',
  });
  const [customFormSubmitted, setCustomFormSubmitted] = useState(false);

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to backend/email service
    setCustomFormSubmitted(true);
    setTimeout(() => {
      setCustomFormData({ name: '', email: '', description: '', budget: 'not-specified' });
      setCustomFormSubmitted(false);
    }, 3000);
  };

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-dark/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold gradient-text hover:opacity-80 transition">
            HubMe AI
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="text-sm text-gray-400 hover:text-white transition">
              Back to Home
            </Link>
            <a href="#contact-custom" className="bg-primary hover:bg-primary-dark px-5 py-2 rounded-lg text-sm font-medium transition">
              Custom Project
            </a>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Choose the perfect package for your project. All plans include 24-hour support and 30-day money-back guarantee.
          </p>

          {/* Trust Signals */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {trustSignals.map((signal) => (
              <div key={signal.label} className="flex flex-col items-center gap-2">
                <div className="text-4xl">{signal.icon}</div>
                <h3 className="font-bold">{signal.label}</h3>
                <p className="text-sm text-gray-400">{signal.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`relative rounded-2xl transition ${
                  pkg.highlighted
                    ? 'bg-gradient-to-br from-primary/20 to-accent/10 border-2 border-primary/50 scale-105 md:scale-100'
                    : 'bg-dark-light/50 border border-white/5 hover:border-primary/30'
                }`}
              >
                {pkg.highlighted && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-primary px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="p-8 h-full flex flex-col">
                  {/* Package Name & Description */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                    <p className="text-sm text-gray-400">{pkg.description}</p>
                  </div>

                  {/* Pricing */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-bold">${pkg.oneTime}</span>
                      <span className="text-gray-400">one-time</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">${pkg.monthly}</span>
                      <span className="text-gray-400">/month</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Billed monthly after 1st month included</p>
                  </div>

                  {/* Features */}
                  <div className="mb-8 flex-grow">
                    <h4 className="font-bold text-sm mb-4 text-gray-300">What's Included:</h4>
                    <ul className="space-y-3">
                      {pkg.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5 shrink-0">✓</span>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <a
                    href={pkg.stripeUrl}
                    className={`w-full py-3 rounded-lg font-medium transition text-center ${
                      pkg.highlighted
                        ? 'bg-primary hover:bg-primary-dark text-white'
                        : 'border border-primary/50 text-primary hover:bg-primary/10'
                    }`}
                  >
                    Get Started
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-dark-light/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-bold mb-3">What's included in the monthly maintenance?</h3>
              <p className="text-gray-400">
                Monthly maintenance includes security updates, performance optimization, bug fixes, and up to 5 hours of minor feature additions or modifications.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-3">Can I upgrade or downgrade my plan?</h3>
              <p className="text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. We'll prorate the difference and apply it to your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-3">What's your refund policy?</h3>
              <p className="text-gray-400">
                We offer a full 30-day money-back guarantee. If you're not satisfied with our work, we'll refund your entire initial payment. No questions asked.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-3">How long does deployment take?</h3>
              <p className="text-gray-400">
                Most projects are deployed within 24 hours. We'll provide you with live access and training for your team immediately after launch.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-3">Do you offer custom packages?</h3>
              <p className="text-gray-400">
                Absolutely! If you have unique requirements or need a custom solution, scroll down to submit a custom inquiry. We'll work with you to create the perfect package.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Project Section */}
      <section id="contact-custom" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Custom Project?</h2>
            <p className="text-gray-400 text-lg">
              Have unique requirements? Tell us about your project and we'll create a custom quote just for you.
            </p>
          </div>

          {customFormSubmitted ? (
            <div className="bg-dark-light border border-primary/20 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">✓</div>
              <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
              <p className="text-gray-400">
                We've received your project details. One of our specialists will contact you within 24 hours with a custom quote.
              </p>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  required
                  value={customFormData.name}
                  onChange={(e) =>
                    setCustomFormData({ ...customFormData, name: e.target.value })
                  }
                  className="w-full px-5 py-4 bg-dark border border-white/10 rounded-xl focus:border-primary focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  required
                  value={customFormData.email}
                  onChange={(e) =>
                    setCustomFormData({ ...customFormData, email: e.target.value })
                  }
                  className="w-full px-5 py-4 bg-dark border border-white/10 rounded-xl focus:border-primary focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Project Description</label>
                <textarea
                  placeholder="Tell us about your project, requirements, and what you're trying to achieve..."
                  required
                  rows={6}
                  value={customFormData.description}
                  onChange={(e) =>
                    setCustomFormData({ ...customFormData, description: e.target.value })
                  }
                  className="w-full px-5 py-4 bg-dark border border-white/10 rounded-xl focus:border-primary focus:outline-none transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Budget Range</label>
                <select
                  value={customFormData.budget}
                  onChange={(e) =>
                    setCustomFormData({ ...customFormData, budget: e.target.value })
                  }
                  className="w-full px-5 py-4 bg-dark border border-white/10 rounded-xl focus:border-primary focus:outline-none transition"
                >
                  <option value="not-specified">Not specified</option>
                  <option value="1k-5k">$1,000 - $5,000</option>
                  <option value="5k-10k">$5,000 - $10,000</option>
                  <option value="10k-25k">$10,000 - $25,000</option>
                  <option value="25k-50k">$25,000 - $50,000</option>
                  <option value="50k-plus">$50,000+</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark py-4 rounded-xl text-lg font-medium transition"
              >
                Get Custom Quote
              </button>

              <p className="text-center text-xs text-gray-500">
                We'll respond within 24 hours with a personalized quote and project timeline.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-6 bg-dark-light/30 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-gray-400 mb-8">
            Choose a package above or tell us about your custom project. We'll build exactly what you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#stripe-starter" className="bg-primary hover:bg-primary-dark px-8 py-4 rounded-lg font-medium transition">
              View Pricing
            </a>
            <Link href="/" className="border border-white/20 hover:border-white/40 px-8 py-4 rounded-lg transition">
              Back to Home
            </Link>
          </div>
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
