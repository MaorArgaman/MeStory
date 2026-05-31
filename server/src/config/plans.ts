/**
 * MeStory subscription plans - single source of truth.
 *
 * Anything that needs plan info (pricing, credits, features, marketplace
 * commission) must import from here. Do not duplicate plan data into
 * controllers or services.
 */
import { UserRole } from '../models/User';

export type PlanId = 'free' | 'standard' | 'premium';

export interface PlanDefinition {
  id: PlanId;
  tier: UserRole;
  priceUSD: number;
  priceILS: number;
  monthlyCredits: number;
  /** Hard cap for users displayed as "unlimited". 0 means truly unlimited (legacy). */
  effectiveCreditCap: number;
  /** Used in marketplace commission split when this plan is the AUTHOR's plan. */
  authorRevenueShare: number; // 0..1
  features: string[];
  featuresHebrew: string[];
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    tier: UserRole.FREE,
    priceUSD: 0,
    priceILS: 0,
    monthlyCredits: 50,
    effectiveCreditCap: 50,
    authorRevenueShare: 0.5,
    features: [
      'Basic writing tools',
      '50 credits / month',
      '1 book',
      'PDF export with watermark',
      'Marketplace browsing only',
    ],
    featuresHebrew: [
      'כלי כתיבה בסיסיים',
      '50 קרדיטים בחודש',
      'ספר אחד',
      'ייצוא PDF עם סימון מים',
      'גלישה ב-Marketplace בלבד',
    ],
  },
  standard: {
    id: 'standard',
    tier: UserRole.STANDARD,
    priceUSD: 25,
    priceILS: 99,
    monthlyCredits: 700,
    effectiveCreditCap: 700,
    authorRevenueShare: 0.7,
    features: [
      'Full AI writing assistant',
      '700 credits / month',
      'Up to 10 books',
      'Voice writing (Whisper) + AI interview',
      'AI cover generation',
      'AI book design ("Design everything for me")',
      'Translation',
      'PDF/DOCX export, no watermark',
      'Marketplace publishing (70/30 split)',
      '3 free AI covers / month',
      '1 free quality analysis / month',
    ],
    featuresHebrew: [
      'עוזר כתיבה AI מלא',
      '700 קרדיטים בחודש',
      'עד 10 ספרים',
      'כתיבה קולית + ראיון AI קולי',
      'יצירת כריכות AI',
      'עיצוב ספר AI ("עצב לי הכל")',
      'תרגום',
      'ייצוא PDF/DOCX ללא watermark',
      'פרסום ב-Marketplace (חלוקה 70/30)',
      '3 כריכות AI חינם בחודש',
      'ניתוח איכות אחד חינם בחודש',
    ],
  },
  premium: {
    id: 'premium',
    tier: UserRole.PREMIUM,
    priceUSD: 65,
    priceILS: 250,
    monthlyCredits: 2500,
    effectiveCreditCap: 2500,
    authorRevenueShare: 0.85,
    features: [
      'Everything in Standard',
      '2500 credits / month',
      'Unlimited books',
      'Priority AI queue',
      '10 free AI covers / month',
      '3 free advanced analyses / month',
      '5 free cover variations / month',
      'Marketplace publishing (85/15 split)',
      'Priority support, 24h SLA',
      'API access (coming soon)',
    ],
    featuresHebrew: [
      'הכל מ-Standard',
      '2500 קרדיטים בחודש',
      'ספרים ללא הגבלה',
      'תור AI מועדף',
      '10 כריכות AI חינם בחודש',
      '3 ניתוחים מתקדמים חינם בחודש',
      '5 וריאציות כריכה חינם בחודש',
      'פרסום ב-Marketplace (חלוקה 85/15)',
      'תמיכה אישית עם SLA של 24 שעות',
      'גישת API (בקרוב)',
    ],
  },
};

/**
 * Top-up packages - one-time credit purchases. Credits never expire.
 */
export interface TopUpPackage {
  id: string;
  credits: number;
  priceUSD: number;
  priceILS: number;
}

export const TOP_UP_PACKAGES: TopUpPackage[] = [
  { id: 'topup-200', credits: 200, priceUSD: 8, priceILS: 29 },
  { id: 'topup-600', credits: 600, priceUSD: 22, priceILS: 79 },
  { id: 'topup-1500', credits: 1500, priceUSD: 45, priceILS: 169 },
];

export function getPlan(id: PlanId): PlanDefinition {
  return PLANS[id];
}

export function getPlanByTier(tier: UserRole): PlanDefinition {
  switch (tier) {
    case UserRole.PREMIUM:
      return PLANS.premium;
    case UserRole.STANDARD:
      return PLANS.standard;
    case UserRole.ADMIN:
      return PLANS.premium; // admins effectively have premium privileges
    case UserRole.FREE:
    default:
      return PLANS.free;
  }
}

export function getTopUpById(id: string): TopUpPackage | undefined {
  return TOP_UP_PACKAGES.find((p) => p.id === id);
}

/**
 * Marketplace commission split. Returns share that goes to the platform
 * (the rest goes to the author). Driven by the AUTHOR's plan.
 */
export function getPlatformRevenueShare(authorTier: UserRole): number {
  const plan = getPlanByTier(authorTier);
  return 1 - plan.authorRevenueShare;
}
