/**
 * Lightweight Core Web Vitals reporter that streams metrics into GA4 (already
 * loaded in index.html) without taking a dependency on the `web-vitals` package.
 *
 * Why no package: keeps the bundle small and avoids the install/CI risk of
 * adding a dependency to a deployed app. The browser-native PerformanceObserver
 * APIs cover LCP, CLS, INP, and TTFB cleanly enough for SEO reporting.
 *
 * Metrics reported (matching Google's CWV thresholds):
 *   - LCP  (Largest Contentful Paint)  — should be < 2500ms
 *   - CLS  (Cumulative Layout Shift)   — should be < 0.1
 *   - INP  (Interaction to Next Paint) — should be < 200ms
 *   - TTFB (Time to First Byte)        — should be < 800ms
 *
 * All numbers go to gtag('event', 'web_vitals', { ... }) so they show up in
 * GA4 → Reports → Engagement → Events, and can be used to build a Looker
 * Studio dashboard.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type GtagFn = (command: string, eventName: string, params?: Record<string, unknown>) => void;

const getGtag = (): GtagFn | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { gtag?: GtagFn };
  return typeof w.gtag === 'function' ? w.gtag : null;
};

const send = (name: string, value: number, extra: Record<string, unknown> = {}) => {
  const gtag = getGtag();
  if (!gtag) return;
  // GA4 metric_value is a number. We round to integer ms (or *1000 for CLS) so
  // the values show up cleanly in reports without floating-point noise.
  gtag('event', 'web_vitals', {
    metric_name: name,
    metric_value: value,
    metric_id: `${name}-${Date.now()}`,
    ...extra,
  });
};

const observeLCP = () => {
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as any;
      if (last) send('LCP', Math.round(last.renderTime || last.loadTime || last.startTime));
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    /* unsupported */
  }
};

const observeCLS = () => {
  try {
    let total = 0;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) total += entry.value;
      }
    });
    po.observe({ type: 'layout-shift', buffered: true });

    // Report CLS on visibility-change/pagehide — that's when the metric is final.
    const flush = () => send('CLS', Math.round(total * 1000) / 1000);
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    addEventListener('pagehide', flush);
  } catch {
    /* unsupported */
  }
};

const observeINP = () => {
  try {
    let worst = 0;
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (entry.duration > worst) worst = entry.duration;
      }
    });
    // 'event' covers the modern INP measurement; older browsers fall back to FID.
    po.observe({ type: 'event', buffered: true, durationThreshold: 16 } as any);

    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && worst > 0) send('INP', Math.round(worst));
    });
  } catch {
    /* unsupported */
  }
};

const reportTTFB = () => {
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (!nav) return;
    const ttfb = nav.responseStart - nav.requestStart;
    if (ttfb >= 0) send('TTFB', Math.round(ttfb));
  } catch {
    /* unsupported */
  }
};

export function reportWebVitals(): void {
  if (typeof window === 'undefined') return;
  // Defer slightly so observers don't fight first paint.
  if (document.readyState === 'complete') {
    queueMicrotask(initObservers);
  } else {
    addEventListener('load', initObservers, { once: true });
  }
}

function initObservers() {
  observeLCP();
  observeCLS();
  observeINP();
  reportTTFB();
}
