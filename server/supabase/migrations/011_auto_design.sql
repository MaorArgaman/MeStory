-- =====================================================================
-- Auto-design feature (multi-agent typesetting)
-- =====================================================================
-- Adds two columns to `books`:
--   auto_design_plan  JSONB  - the design plan produced by the planner
--                              agent (see designPlanSchema.ts). Single
--                              source of truth for both the HTML/PDF
--                              preview and the DOCX export.
--   auto_design_uses  INT    - how many times the user has run the
--                              auto-design flow on this book. Hard cap
--                              of 3 enforced in middleware before LLM
--                              calls are made.
--
-- Separate from the older ai_design_state column which holds the legacy
-- single-shot Gemini design output. We keep both to allow rolling
-- migration of users to the new pipeline without losing existing books.
-- =====================================================================

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS auto_design_plan JSONB,
  ADD COLUMN IF NOT EXISTS auto_design_uses INT NOT NULL DEFAULT 0;

-- No index needed: auto_design_plan is only fetched by primary key
-- (when rendering a specific book), never queried by content.

-- Backfill: existing rows get auto_design_uses = 0 via the default.

GRANT SELECT, UPDATE ON books TO service_role;
