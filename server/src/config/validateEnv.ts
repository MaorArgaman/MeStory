/**
 * Environment validation - runs at boot. Fails LOUD with actionable
 * messages so misconfiguration is caught before users hit a 503.
 */

interface EnvCheck {
  name: string;
  value: string | undefined;
  required: boolean;
  /** If value matches one of these, treat as unconfigured. */
  placeholders?: string[];
  /** Only required when this predicate returns true. */
  requiredWhen?: () => boolean;
  hint?: string;
}

const PAYPAL_PLACEHOLDERS = [
  'your-paypal-client-id',
  'your-paypal-client-secret',
  'your-paypal-webhook-id',
  'your-admin-paypal-email@example.com',
  '',
];

const isPaymentsRealMode = (): boolean => {
  const isMockEnabled = process.env.ENABLE_MOCK_PAYMENTS === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  // Real PayPal needed when not in mock mode OR in production
  return !isMockEnabled || isProduction;
};

const checks: EnvCheck[] = [
  {
    name: 'PAYPAL_CLIENT_ID',
    value: process.env.PAYPAL_CLIENT_ID,
    required: true,
    placeholders: PAYPAL_PLACEHOLDERS,
    requiredWhen: isPaymentsRealMode,
    hint: 'Get from https://developer.paypal.com/dashboard/applications. Use Sandbox creds for testing, Live for production.',
  },
  {
    name: 'PAYPAL_CLIENT_SECRET',
    value: process.env.PAYPAL_CLIENT_SECRET,
    required: true,
    placeholders: PAYPAL_PLACEHOLDERS,
    requiredWhen: isPaymentsRealMode,
    hint: 'Companion secret to PAYPAL_CLIENT_ID. Never commit to git.',
  },
  {
    name: 'PAYPAL_MODE',
    value: process.env.PAYPAL_MODE,
    required: true,
    placeholders: [''],
    requiredWhen: isPaymentsRealMode,
    hint: 'Either "sandbox" or "live". Sandbox for testing, live for real payments.',
  },
  {
    name: 'PAYPAL_WEBHOOK_ID',
    value: process.env.PAYPAL_WEBHOOK_ID,
    required: false,
    placeholders: PAYPAL_PLACEHOLDERS,
    hint: 'Webhook ID from PayPal Dashboard > Webhooks. Without it, webhook signatures cannot be verified and webhooks will be dropped.',
  },
  {
    name: 'ADMIN_PAYPAL_EMAIL',
    value: process.env.ADMIN_PAYPAL_EMAIL,
    required: false,
    placeholders: PAYPAL_PLACEHOLDERS,
    hint: 'Email of the PayPal account that receives the platform commission share from marketplace book sales.',
  },
  {
    name: 'CLIENT_URL',
    value: process.env.CLIENT_URL,
    required: true,
    hint: 'Frontend URL used as PayPal return_url and cancel_url base.',
  },
  {
    name: 'GEMINI_API_KEY',
    value: process.env.GEMINI_API_KEY,
    required: true,
    hint: 'Google Gemini API key. Required for all AI text/design features.',
  },
];

interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

function isPlaceholder(value: string | undefined, placeholders?: string[]): boolean {
  if (!value) return true;
  if (!placeholders) return false;
  return placeholders.includes(value);
}

export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const c of checks) {
    const isPlaceholderValue = isPlaceholder(c.value, c.placeholders);
    const skippedDueToCondition = c.requiredWhen && !c.requiredWhen();

    if (skippedDueToCondition) continue;

    if (isPlaceholderValue) {
      const message = `[ENV] ${c.name} is missing or set to placeholder value. ${c.hint || ''}`;
      if (c.required) {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function logValidationReport(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error('[ENV] CONFIGURATION ERRORS - the app may not function correctly:');
    for (const e of result.errors) console.error('  ' + e);
  }
  if (result.warnings.length > 0) {
    console.warn('[ENV] CONFIGURATION WARNINGS:');
    for (const w of result.warnings) console.warn('  ' + w);
  }
  if (result.ok && result.warnings.length === 0) {
    console.log('[ENV] All required environment variables present.');
  }
}

/**
 * Lightweight runtime check that PayPal is actually usable. Used by
 * controllers to give a clearer 503 message than the audit's generic
 * "service not configured".
 */
export function getPayPalConfigStatus(): {
  configured: boolean;
  mockEnabled: boolean;
  mode: 'sandbox' | 'live' | null;
  reasons: string[];
} {
  const reasons: string[] = [];
  const isMockEnabled = process.env.ENABLE_MOCK_PAYMENTS === 'true';

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE;

  const clientIdOk = !!clientId && !PAYPAL_PLACEHOLDERS.includes(clientId);
  const secretOk = !!secret && !PAYPAL_PLACEHOLDERS.includes(secret);
  const modeOk = mode === 'sandbox' || mode === 'live';

  if (!clientIdOk) reasons.push('PAYPAL_CLIENT_ID missing or placeholder');
  if (!secretOk) reasons.push('PAYPAL_CLIENT_SECRET missing or placeholder');
  if (!modeOk) reasons.push('PAYPAL_MODE must be "sandbox" or "live"');

  return {
    configured: clientIdOk && secretOk && modeOk,
    mockEnabled: isMockEnabled,
    mode: modeOk ? (mode as 'sandbox' | 'live') : null,
    reasons,
  };
}
