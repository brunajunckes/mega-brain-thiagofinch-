'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setIsLoggedIn(true);
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoggedIn && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">BookMe</h1>
              <span className="ml-2 text-sm text-gray-600">AI Writing Platform</span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Dashboard */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome, {user.email}! 👋</h2>
            <p className="text-gray-600">Your AI writing assistant is ready</p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'New Document',
                description: 'Start creating a new piece of content',
                icon: '📝',
                color: 'bg-blue-50 border-blue-200',
              },
              {
                title: 'My Documents',
                description: 'View and edit your saved documents',
                icon: '📚',
                color: 'bg-purple-50 border-purple-200',
              },
              {
                title: 'Templates',
                description: 'Browse available writing templates',
                icon: '🎨',
                color: 'bg-green-50 border-green-200',
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`p-6 rounded-lg border-2 cursor-pointer hover:shadow-lg transition ${item.color}`}
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="mt-12 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="text-center py-8 text-gray-500">
              <p>No documents yet. Create your first document to get started! 🚀</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow-2xl p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-4">
              <h1 className="text-6xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-2">
                BookMe
              </h1>
              <p className="text-xl text-blue-200">AI-Powered Writing Platform</p>
            </div>
            <p className="text-gray-500 text-sm mt-4 max-w-md mx-auto">
              Transform your ideas into polished documents with our intelligent writing assistant
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-4 border border-blue-700 hover:border-blue-500 transition">
              <div className="text-2xl mb-2">✨</div>
              <h3 className="font-semibold text-blue-100 mb-1">AI Writing</h3>
              <p className="text-sm text-blue-300">Smart content generation</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 border border-slate-600 hover:border-blue-500 transition">
              <div className="text-2xl mb-2">📚</div>
              <h3 className="font-semibold text-slate-100 mb-1">Templates</h3>
              <p className="text-sm text-slate-400">Ready-made structures</p>
            </div>
            <div className="bg-gradient-to-br from-blue-900 to-slate-800 rounded-lg p-4 border border-blue-700 hover:border-blue-500 transition">
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="font-semibold text-blue-100 mb-1">Fast Export</h3>
              <p className="text-sm text-blue-300">PDF & multiple formats</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-600 hover:border-blue-500 transition">
              <div className="text-2xl mb-2">🔄</div>
              <h3 className="font-semibold text-slate-100 mb-1">Collaboration</h3>
              <p className="text-sm text-slate-400">Share & iterate together</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link href="/auth/login" className="block">
              <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-2xl transition transform hover:scale-105 hover:from-blue-600 hover:to-blue-700">
                Sign In to Your Account
              </button>
            </Link>
            <Link href="/auth/signup" className="block">
              <button className="w-full border-2 border-blue-500 text-blue-300 py-3 rounded-lg font-semibold hover:bg-blue-900/20 transition hover:border-blue-400">
                Create New Account
              </button>
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-8 border-t border-slate-700 text-center text-slate-400 text-xs space-y-2">
            <p>🔒 Secure • 🚀 Fast • ✨ Intuitive</p>
            <p>Join thousands of writers using BookMe today</p>
          </div>
        </div>

        {/* Testimonial */}
        <div className="mt-8 bg-white bg-opacity-10 backdrop-blur rounded-lg p-6 text-white text-center">
          <p className="italic">"The most intuitive AI writing platform I've ever used" - Sarah M.</p>
        </div>
      </div>
    </div>
  );
}
