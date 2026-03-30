import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/index.css';

// Web Vitals tracking for Core Web Vitals (Google ranking factor)
// Sends metrics to Google Analytics 4 for monitoring
// Note: Install web-vitals package for this to work: npm install web-vitals
const reportWebVitals = async () => {
  // Skip if not in browser environment
  if (typeof window === 'undefined') return;

  try {
    // Dynamic import - will fail gracefully if package not installed
    // @ts-expect-error - web-vitals is optional, will gracefully fail if not installed
    const webVitals = await import('web-vitals').catch(() => null);
    if (!webVitals) return;

    const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = webVitals;

    const sendToGA = (metric: { name: string; value: number; id: string }) => {
      // Send to Google Analytics 4 if available
      if ('gtag' in window) {
        const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
        gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_category: 'Web Vitals',
          event_label: metric.id,
          non_interaction: true,
        });
      }
      // Log to console in development
      if (import.meta.env.DEV) {
        console.log(`[Web Vitals] ${metric.name}:`, metric.value);
      }
    };

    // Core Web Vitals (Google ranking factors)
    onCLS(sendToGA);  // Cumulative Layout Shift
    onLCP(sendToGA);  // Largest Contentful Paint
    onINP(sendToGA);  // Interaction to Next Paint (replaces FID)

    // Additional metrics
    onFID(sendToGA);  // First Input Delay
    onFCP(sendToGA);  // First Contentful Paint
    onTTFB(sendToGA); // Time to First Byte
  } catch {
    // web-vitals not installed or error - silently ignore
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);

// Initialize Web Vitals tracking
reportWebVitals();
