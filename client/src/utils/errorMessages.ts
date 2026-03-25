/**
 * User-Friendly Error Messages
 *
 * Maps technical error codes and messages to friendly, user-readable messages.
 * Supports both English and Hebrew.
 */

interface ErrorMapping {
  en: string;
  he: string;
}

// Technical error patterns and their friendly messages
const ERROR_MAPPINGS: Record<string, ErrorMapping> = {
  // HTTP Status Codes
  '501': {
    en: 'Payment service temporarily unavailable. Please try again later.',
    he: 'שירות התשלום לא זמין זמנית. נסה שוב מאוחר יותר.',
  },
  '500': {
    en: 'Something went wrong on our end. Please try again.',
    he: 'משהו השתבש אצלנו. נסה שוב.',
  },
  '503': {
    en: 'Service temporarily unavailable. Please try again in a few minutes.',
    he: 'השירות לא זמין זמנית. נסה שוב בעוד מספר דקות.',
  },
  '502': {
    en: 'Server is temporarily overloaded. Please try again.',
    he: 'השרת עמוס זמנית. נסה שוב.',
  },
  '504': {
    en: 'Request timed out. Please check your connection and try again.',
    he: 'הבקשה חרגה מהזמן המותר. בדוק את החיבור שלך ונסה שוב.',
  },
  '429': {
    en: 'Too many requests. Please wait a moment and try again.',
    he: 'יותר מדי בקשות. המתן רגע ונסה שוב.',
  },
  '401': {
    en: 'Session expired. Please log in again.',
    he: 'הפגישה פגה. אנא התחבר שוב.',
  },
  '403': {
    en: 'You do not have permission to perform this action.',
    he: 'אין לך הרשאה לבצע פעולה זו.',
  },
  '404': {
    en: 'The requested resource was not found.',
    he: 'המשאב המבוקש לא נמצא.',
  },

  // Database Errors (PostgreSQL/Supabase)
  'PGRST301': {
    en: 'There was an issue processing your request. Please try again.',
    he: 'הייתה בעיה בעיבוד הבקשה שלך. נסה שוב.',
  },
  'PGRST116': {
    en: 'The requested item was not found.',
    he: 'הפריט המבוקש לא נמצא.',
  },
  'PGRST204': {
    en: 'No results found.',
    he: 'לא נמצאו תוצאות.',
  },

  // Network Errors
  'Network Error': {
    en: 'Connection issue. Please check your internet connection.',
    he: 'בעיית חיבור. בדוק את חיבור האינטרנט שלך.',
  },
  'ERR_NETWORK': {
    en: 'Unable to connect. Please check your internet connection.',
    he: 'לא ניתן להתחבר. בדוק את חיבור האינטרנט שלך.',
  },
  'ECONNREFUSED': {
    en: 'Unable to reach the server. Please try again later.',
    he: 'לא ניתן להגיע לשרת. נסה שוב מאוחר יותר.',
  },
  'ETIMEDOUT': {
    en: 'Connection timed out. Please try again.',
    he: 'החיבור חרג מהזמן המותר. נסה שוב.',
  },
  'ERR_CANCELED': {
    en: 'Request was cancelled.',
    he: 'הבקשה בוטלה.',
  },

  // Payment-specific errors
  'payment_failed': {
    en: 'Payment could not be processed. Please try again or use a different payment method.',
    he: 'לא ניתן לעבד את התשלום. נסה שוב או השתמש באמצעי תשלום אחר.',
  },
  'insufficient_funds': {
    en: 'Payment declined due to insufficient funds.',
    he: 'התשלום נדחה עקב חוסר כיסוי.',
  },
  'card_declined': {
    en: 'Your card was declined. Please try a different payment method.',
    he: 'הכרטיס שלך נדחה. נסה אמצעי תשלום אחר.',
  },
  'invalid_card': {
    en: 'Invalid card details. Please check and try again.',
    he: 'פרטי כרטיס לא תקינים. בדוק ונסה שוב.',
  },
  'order_not_found': {
    en: 'Order not found. Please try again.',
    he: 'ההזמנה לא נמצאה. נסה שוב.',
  },
  'already_purchased': {
    en: 'You have already purchased this item.',
    he: 'כבר רכשת פריט זה.',
  },

  // Subscription errors
  'subscription_active': {
    en: 'You already have an active subscription.',
    he: 'כבר יש לך מנוי פעיל.',
  },
  'downgrade_not_allowed': {
    en: 'Downgrade is not available at this time.',
    he: 'שנמוך לא זמין כרגע.',
  },

  // Generic fallbacks
  'Unknown error': {
    en: 'An unexpected error occurred. Please try again.',
    he: 'אירעה שגיאה לא צפויה. נסה שוב.',
  },
};

/**
 * Get a user-friendly error message from a technical error
 *
 * @param error - The error object, string, or error response
 * @param language - Language code ('en' or 'he')
 * @returns A user-friendly error message
 */
export function getFriendlyErrorMessage(
  error: unknown,
  language: 'en' | 'he' = 'en'
): string {
  // Extract error details from various error formats
  let errorCode = '';
  let errorMessage = '';

  if (typeof error === 'string') {
    errorMessage = error;
    errorCode = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorCode = error.message;
  } else if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // Axios error format
    if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;
      const status = String(response.status || '');
      const data = response.data as Record<string, unknown> | undefined;

      if (status && ERROR_MAPPINGS[status]) {
        return ERROR_MAPPINGS[status][language];
      }

      if (data) {
        errorCode = String(data.code || data.error || data.message || '');
        errorMessage = String(data.error || data.message || '');
      }
    }

    // Direct error object
    errorCode = String(err.code || err.error || '');
    errorMessage = String(err.message || err.error || '');
  }

  // Check for matching error patterns
  for (const [pattern, messages] of Object.entries(ERROR_MAPPINGS)) {
    if (
      errorCode.includes(pattern) ||
      errorMessage.includes(pattern) ||
      errorCode === pattern
    ) {
      return messages[language];
    }
  }

  // Check if the error message already looks user-friendly (not technical)
  if (errorMessage && !errorMessage.includes('Error') && !errorMessage.includes('Exception')) {
    // If it's a readable message, use it
    if (errorMessage.length < 200 && /^[A-Za-z\s.,!?]+$/.test(errorMessage)) {
      return errorMessage;
    }
  }

  // Default fallback
  return ERROR_MAPPINGS['Unknown error'][language];
}

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  const errorStr = String(error);
  const networkPatterns = ['Network Error', 'ERR_NETWORK', 'ECONNREFUSED', 'ETIMEDOUT', 'fetch'];

  return networkPatterns.some(pattern => errorStr.includes(pattern));
}

/**
 * Check if an error is a payment-related error
 */
export function isPaymentError(error: unknown): boolean {
  if (!error) return false;

  const errorStr = String(error);
  const paymentPatterns = ['payment', 'card', 'funds', 'declined', 'PayPal', '501'];

  return paymentPatterns.some(pattern => errorStr.toLowerCase().includes(pattern.toLowerCase()));
}

export default getFriendlyErrorMessage;
