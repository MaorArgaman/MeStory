/**
 * Analytics utility — thin wrapper around GA4 gtag
 * Only fires in production; silently no-ops in dev / when gtag is unavailable.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function track(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (!window.gtag) return;
  window.gtag('event', eventName, params);
}

export const analytics = {
  /** User signed up (new account created) */
  signup(method: 'email' | 'google' = 'email') {
    track('sign_up', { method });
  },

  /** User logged in */
  login(method: 'email' | 'google' = 'email') {
    track('login', { method });
  },

  /** New book created */
  bookCreate(genre: string) {
    track('book_create', { genre });
  },

  /** Chapter content auto-saved */
  bookSave(bookId: string) {
    track('book_save', { book_id: bookId });
  },

  /** Book exported to PDF */
  bookExport(bookId: string, format: 'pdf' | 'docx' = 'pdf') {
    track('book_export', { book_id: bookId, format });
  },

  /** Book published to marketplace */
  bookPublish(bookId: string, genre: string) {
    track('book_publish', { book_id: bookId, genre });
  },

  /** User viewed a book in marketplace */
  bookView(bookId: string) {
    track('book_view', { book_id: bookId });
  },

  /** User purchased a book */
  purchase(bookId: string, price: number, currency: string) {
    track('purchase', {
      transaction_id: bookId,
      value: price,
      currency,
      items: [{ item_id: bookId }],
    });
  },

  /** Subscription upgraded */
  subscriptionUpgrade(plan: string) {
    track('subscription_upgrade', { plan });
  },

  /** Onboarding completed */
  onboardingComplete() {
    track('onboarding_complete');
  },

  /** Generic event — use sparingly */
  event(name: string, params?: Record<string, unknown>) {
    track(name, params);
  },
};

export default analytics;
