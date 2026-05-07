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

function boot() {
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
