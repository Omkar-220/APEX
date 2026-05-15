import React from 'react';
import { Outlet, useRouteError } from 'react-router';
import { AlertCircle, Home } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';

export function RootLayout() {
  return (
    <>
      <AnimatedBackground />
      <Outlet />
    </>
  );
}

export function RootErrorBoundary() {
  const error = useRouteError() as Error & { statusText?: string; status?: number };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #06061a 0%, #0d0d2b 40%, #12083a 100%)' }}
    >
      <div
        className="max-w-md w-full rounded-3xl p-8 text-center"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        }}
      >
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <AlertCircle className="w-8 h-8" style={{ color: '#f87171' }} />
        </div>
        <h1 className="mb-2" style={{ color: '#fff', fontSize: '1.4rem' }}>
          {error.status === 404 ? 'Page Not Found' : 'Something went wrong'}
        </h1>
        <p className="mb-6 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {error.statusText || error.message || 'An unexpected error occurred'}
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm text-white transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 20px rgba(99,102,241,0.3)',
          }}
        >
          <Home className="w-4 h-4" />
          Go to Home
        </a>
      </div>
    </div>
  );
}