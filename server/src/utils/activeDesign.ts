/**
 * "Active design" tracking — which design pipeline the user last built with,
 * so exports and previews always reflect what they actually created.
 *
 *   'manual' → pageLayout + coverDesign (BookLayoutPage / "Design everything")
 *   'auto'   → autoDesignPlan (auto-design / עימוד)
 *
 * There is no dedicated DB column (and no migration path in this env), so the
 * flag is persisted inside the existing `ai_design_state` JSONB column under a
 * sibling key that doesn't affect the legacy `status` field.
 */

export type ActiveDesign = 'manual' | 'auto';

/** Read the persisted flag, or infer it from which design data exists. */
export function resolveActiveDesign(book: any): ActiveDesign {
  const stored = book?.aiDesignState?.activeDesign as ActiveDesign | undefined;
  const hasAuto = !!book?.autoDesignPlan;
  const hasManual = !!(
    (book?.pageLayout && (book.pageLayout.pages?.length || Object.keys(book.pageLayout).length > 0)) ||
    book?.coverDesign
  );

  if (stored === 'auto' && hasAuto) return 'auto';
  if (stored === 'manual' && hasManual) return 'manual';
  // No usable explicit flag — infer from what exists.
  if (hasAuto && !hasManual) return 'auto';
  return 'manual';
}

/**
 * Merge an updated activeDesign flag into an existing aiDesignState object,
 * preserving every other key. Returns the value to write to ai_design_state.
 */
export function withActiveDesign(currentAiDesignState: any, active: ActiveDesign): any {
  return { ...(currentAiDesignState || {}), activeDesign: active };
}
