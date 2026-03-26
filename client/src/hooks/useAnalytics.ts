/**
 * Google Analytics 4 tracking hook for MeStory
 * Provides event tracking and page view tracking functions
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export interface TrackEventParams {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

/**
 * Track a custom event in Google Analytics
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

/**
 * Track a page view in Google Analytics
 */
export function trackPageView(path: string, title?: string): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) {
    return;
  }

  window.gtag('config', measurementId, {
    page_path: path,
    page_title: title,
  });
}

// Predefined event tracking functions for common MeStory actions

/**
 * Track when a user views a book
 */
export function trackBookView(bookId: string, bookTitle?: string): void {
  trackEvent('Book', 'view', bookTitle || bookId);
}

/**
 * Track when a user purchases a book
 */
export function trackBookPurchase(
  bookId: string,
  bookTitle: string,
  price: number,
  currency: string = 'ILS'
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  // Track as ecommerce purchase event
  window.gtag('event', 'purchase', {
    transaction_id: `${bookId}_${Date.now()}`,
    value: price,
    currency: currency,
    items: [
      {
        item_id: bookId,
        item_name: bookTitle,
        category: 'Book',
        price: price,
        quantity: 1,
      },
    ],
  });

  // Also track as custom event
  trackEvent('Book', 'purchase', bookTitle, price);
}

/**
 * Track when a user signs up
 */
export function trackSignUp(method: string = 'email'): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', 'sign_up', {
    method: method,
  });

  trackEvent('User', 'sign_up', method);
}

/**
 * Track when a user upgrades their subscription
 */
export function trackSubscriptionUpgrade(
  plan: string,
  price: number,
  currency: string = 'ILS'
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  // Track as purchase event
  window.gtag('event', 'purchase', {
    transaction_id: `subscription_${plan}_${Date.now()}`,
    value: price,
    currency: currency,
    items: [
      {
        item_id: `subscription_${plan}`,
        item_name: `${plan} Subscription`,
        category: 'Subscription',
        price: price,
        quantity: 1,
      },
    ],
  });

  trackEvent('Subscription', 'upgrade', plan, price);
}

/**
 * Custom hook for analytics tracking
 */
export function useAnalytics() {
  return {
    trackEvent,
    trackPageView,
    trackBookView,
    trackBookPurchase,
    trackSignUp,
    trackSubscriptionUpgrade,
  };
}

export default useAnalytics;
