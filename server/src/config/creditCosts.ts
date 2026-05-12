/**
 * Credit costs per AI feature - single source of truth.
 *
 * 1 credit = ~$0.01-$0.015 of platform compute cost. Costs sized to leave
 * roughly 60-90% margin across all packages.
 *
 * When adding a new AI-powered feature, add its cost here AND wire the
 * `requireCredits()` middleware on its route. Never charge credits ad-hoc
 * in a controller.
 */

import { PlanId } from './plans';

export type FeatureKey =
  // Voice & audio
  | 'voice_transcribe_per_minute'
  | 'voice_interview_session'
  | 'tts_chapter'
  | 'tts_full_book'
  // Image
  | 'ai_cover_single'
  | 'ai_cover_variations'
  | 'ai_illustration'
  | 'ai_character_portrait'
  // Design
  | 'design_quick_preview'
  | 'design_premium_full'
  | 'design_typography'
  | 'design_layout'
  | 'auto_design_premium'
  // Writing assist
  | 'text_enhance'
  | 'text_continue'
  | 'writing_guidance'
  | 'title_generation'
  | 'synopsis'
  | 'color_scheme'
  // Story creation
  | 'chat_interview_full'
  | 'book_generation_full'
  | 'chapter_generation'
  | 'character_enhance'
  // Translation
  | 'translate_chapter'
  | 'translate_book'
  // Analysis
  | 'analyze_quality'
  | 'analyze_plot'
  | 'analyze_techniques'
  | 'analyze_tension'
  | 'analyze_coverage'
  // Marketplace
  | 'marketplace_publish';

export const CREDIT_COSTS: Record<FeatureKey, number> = {
  // Voice & audio
  voice_transcribe_per_minute: 1,
  voice_interview_session: 8,
  tts_chapter: 12,
  tts_full_book: 60,

  // Image
  ai_cover_single: 15,
  ai_cover_variations: 35,
  ai_illustration: 15,
  ai_character_portrait: 10,

  // Design
  design_quick_preview: 5,
  design_premium_full: 40,
  design_typography: 8,
  design_layout: 8,
  // Multi-agent typesetting (planner + critic + revision). Capped to 3 uses
  // per book by autoDesignCap middleware on top of credit charging.
  auto_design_premium: 70,

  // Writing assist
  text_enhance: 2,
  text_continue: 3,
  // Real-time guidance fires on every keystroke (debounced by client). Cost
  // per call is small ($0.005-$0.02) and the feature is core to the writing
  // experience - charging would drain Free users in minutes. Kept free,
  // logged for analytics.
  writing_guidance: 0,
  title_generation: 2,
  synopsis: 3,
  color_scheme: 1,

  // Story creation
  chat_interview_full: 15,
  book_generation_full: 80,
  chapter_generation: 10,
  character_enhance: 3,

  // Translation
  translate_chapter: 12,
  translate_book: 60,

  // Analysis
  analyze_quality: 8,
  analyze_plot: 10,
  analyze_techniques: 25,
  analyze_tension: 15,
  analyze_coverage: 8,

  // Marketplace
  marketplace_publish: 50,
};

/**
 * Plan-level feature gating. `false` blocks the feature outright with an
 * "upgrade required" response.
 */
export interface PlanFeatureGate {
  voice: boolean;
  tts: boolean;
  images: boolean;
  premium_design: boolean;
  analysis: boolean;
  marketplace: boolean;
  watermark: boolean;
  priority_queue: boolean;
  max_books: number; // -1 = unlimited
}

export const PLAN_FEATURES: Record<PlanId, PlanFeatureGate> = {
  free: {
    voice: false,
    tts: false,
    images: false,
    premium_design: false,
    analysis: false,
    marketplace: false,
    watermark: true,
    priority_queue: false,
    max_books: 1,
  },
  standard: {
    voice: true,
    tts: true,
    images: true,
    premium_design: true,
    analysis: true,
    marketplace: true,
    watermark: false,
    priority_queue: false,
    max_books: 10,
  },
  premium: {
    voice: true,
    tts: true,
    images: true,
    premium_design: true,
    analysis: true,
    marketplace: true,
    watermark: false,
    priority_queue: true,
    max_books: -1,
  },
};

/**
 * Monthly bonus pools - free uses of expensive features that are consumed
 * BEFORE deducting credits. Resets on subscription renewal date.
 */
export interface PlanBonuses {
  ai_cover_single: number;
  ai_cover_variations: number;
  tts_full_book: number;
  analyze_quality: number;
  analyze_plot: number;
  analyze_techniques: number;
}

export const PLAN_BONUSES: Record<PlanId, PlanBonuses> = {
  free: {
    ai_cover_single: 0,
    ai_cover_variations: 0,
    tts_full_book: 0,
    analyze_quality: 0,
    analyze_plot: 0,
    analyze_techniques: 0,
  },
  standard: {
    ai_cover_single: 3,
    ai_cover_variations: 0,
    tts_full_book: 0,
    analyze_quality: 1,
    analyze_plot: 0,
    analyze_techniques: 0,
  },
  premium: {
    ai_cover_single: 10,
    ai_cover_variations: 5,
    tts_full_book: 1,
    analyze_quality: 1,
    analyze_plot: 1,
    analyze_techniques: 1,
  },
};

/**
 * Maps a feature to which gate must be on for the user's plan to access it.
 * If `null`, no plan gating - feature is available to all (still costs
 * credits).
 */
export const FEATURE_GATES: Record<FeatureKey, keyof PlanFeatureGate | null> = {
  voice_transcribe_per_minute: 'voice',
  voice_interview_session: 'voice',
  tts_chapter: 'tts',
  tts_full_book: 'tts',

  ai_cover_single: 'images',
  ai_cover_variations: 'images',
  ai_illustration: 'images',
  ai_character_portrait: 'images',

  design_quick_preview: null,
  design_premium_full: 'premium_design',
  design_typography: 'premium_design',
  design_layout: 'premium_design',
  auto_design_premium: 'premium_design',

  text_enhance: null,
  text_continue: null,
  writing_guidance: null,
  title_generation: null,
  synopsis: null,
  color_scheme: null,

  chat_interview_full: null,
  book_generation_full: null,
  chapter_generation: null,
  character_enhance: null,

  translate_chapter: 'images', // translation gated to standard+ via images flag would be wrong; use null for now
  translate_book: 'images',

  analyze_quality: 'analysis',
  analyze_plot: 'analysis',
  analyze_techniques: 'analysis',
  analyze_tension: 'analysis',
  analyze_coverage: 'analysis',

  marketplace_publish: 'marketplace',
};

// Translation should be its own gate - fix to null so it's not blocked by
// images. Standard+ gets it because cost makes Free unaffordable anyway.
FEATURE_GATES.translate_chapter = null;
FEATURE_GATES.translate_book = null;

export function getCreditCost(feature: FeatureKey): number {
  return CREDIT_COSTS[feature];
}

export function getFeatureGate(feature: FeatureKey): keyof PlanFeatureGate | null {
  return FEATURE_GATES[feature];
}

export function getPlanFeatures(planId: PlanId): PlanFeatureGate {
  return PLAN_FEATURES[planId];
}

export function getPlanBonuses(planId: PlanId): PlanBonuses {
  return PLAN_BONUSES[planId];
}
