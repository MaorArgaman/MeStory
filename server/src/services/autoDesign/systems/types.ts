/**
 * Shared shape for a server-side design-system module. A system module
 * describes the CHOICES a planner can make within a system (palette
 * variants, opener templates, scale ratio, preferred image treatments)
 * plus DOCX-side fallbacks (glyph ornaments). The rich visual rendering
 * lives in the matching client module under
 * client/src/components/autoDesign/systems/.
 *
 * The planner reads this to know what's available; it writes the chosen
 * ids (variant, per-opener template) into the DesignPlan. Renderers then
 * look the system up to resolve visuals.
 */

import { DesignSystemId, ImageTreatment, ChapterOpenerTemplate } from '../designPlanSchema';
import { ScaleRatioName } from '../tokens';

export interface SystemVariant {
  /** Stable id written into the plan (plan.variant). */
  id: string;
  /** Hebrew label for UI. */
  labelHe: string;
  /** One-line mood, fed to the planner so it picks the right variant. */
  mood: string;
  palette: { text: string; background: string; accent: string; muted: string };
}

export interface SystemModule {
  id: DesignSystemId;
  labelHe: string;
  descriptionHe: string;
  /** When the planner should pick this system (English, fed to Claude). */
  bestFor: string;
  /** Palette + mood variants. Planner picks one per generate; seed can
   *  also rotate among them on regenerate. */
  variants: SystemVariant[];
  /** Default modular-scale ratio; planner may override within allowed set. */
  defaultScaleRatio: ScaleRatioName;
  /** Ratios that suit this system (planner chooses among these). */
  allowedScaleRatios: ScaleRatioName[];
  /** Body / heading / display font families (Hebrew-supporting). */
  fonts: { body: string; heading: string; display: string };
  /** Base body size in pt — anchor for the modular scale. */
  baseSizePt: number;
  /** Line height multiplier for body. */
  leading: number;
  /** Page margins in mm. RTL: start = right, end = left. */
  marginsMm: { top: number; bottom: number; start: number; end: number };
  /** Opener templates this system supports, in planner-preference order. */
  openerTemplates: ChapterOpenerTemplate[];
  /** Image treatments this system supports, preferred first. */
  imageTreatments: ImageTreatment[];
  /** DOCX-side ornament glyphs (the HTML side draws real SVG). */
  docxOrnaments: { rule: string; ornament: string; stars: string };
  /** DOCX-side decorative initial behavior. */
  dropCapMultiplier: number;
}
