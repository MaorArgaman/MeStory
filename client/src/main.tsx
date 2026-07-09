import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { queryClient } from './lib/queryClient';
import './styles/index.css';
import { isNative } from './platform';
import { initNative } from './platform/nativeInit';
import { reportWebVitals } from './lib/webVitals';

// Suppress WebSocket / Socket.IO connection errors in production to avoid
// cluttering the browser console when the real-time server is unreachable.
if (import.meta.env.PROD) {
  const _origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const msg = args[0];
    if (typeof msg === 'string' && /websocket|socket\.io|ws:\/\/|wss:\/\//i.test(msg)) return;
    _origError(...args);
  };
}

// ============================================
// EMERGENCY LOCKDOWN — activated 2026-07-09 at the owner's request.
// The entire site is offline for users: the app never mounts, so no
// page, purchase flow, or payment button is reachable. The server is
// locked down in parallel (server.ts EMERGENCY_LOCKDOWN).
// To restore service: set EMERGENCY_LOCKDOWN = false and redeploy.
// ============================================
const EMERGENCY_LOCKDOWN = true;

function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
        background: '#0f1117',
        color: '#e8e8ee',
      }}
    >
      <div dir="rtl" lang="he">
        <h1 style={{ fontSize: '1.75rem', margin: 0 }}>האתר סגור זמנית לתחזוקה</h1>
        <p style={{ marginTop: '0.75rem', opacity: 0.85 }}>
          לא ניתן כרגע להשתמש בשירות או לבצע תשלומים. נשוב בקרוב.
        </p>
      </div>
      <div dir="ltr" lang="en" style={{ opacity: 0.7, fontSize: '0.9rem' }}>
        <p style={{ margin: 0 }}>The site is temporarily closed for maintenance.</p>
        <p style={{ margin: '0.25rem 0 0' }}>No purchases or payments can be made at this time.</p>
      </div>
    </div>
  );
}

function boot() {
  if (EMERGENCY_LOCKDOWN) {
    ReactDOM.createRoot(document.getElementById('root')!).render(<MaintenancePage />);
    return;
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}

if (isNative) {
  initNative((path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  })
    .catch((err) => console.warn('[native] init failed', err))
    .finally(boot);
} else {
  boot();
}

// Stream Core Web Vitals into Google Analytics so the GSC "Page experience"
// report has fresh field data and we can correlate slow pages to user drop-off.
// Runs after boot to avoid interfering with paint timing.
reportWebVitals();
