/**
 * Unified image collection for the auto-design pipeline.
 *
 * A book's images live in TWO places:
 *   - book.pageImages              (top-level; AI-generated illustrations land here)
 *   - book.pageLayout.pages[].images  (images the user placed in the manual editor)
 *
 * The planner used to read only pageImages, so manually-placed photos never
 * reached the design. This collects BOTH into one ordered, de-duplicated list.
 * Each image's stable id is its index in this list ("img-0", "img-1", …).
 *
 * CRITICAL: the client mirror (client/src/components/autoDesign/collectImages.ts)
 * MUST produce the same order from the same book JSON, or "img-N" ids won't
 * resolve to the same image in the preview/PDF. Keep the two in sync.
 */

import { IBook } from '../../models/Book';

export interface CollectedImage {
  /** Stable id used in the design plan: `img-${index}`. */
  id: string;
  url: string;
  prompt?: string;
  isAiGenerated?: boolean;
}

export function collectBookImages(book: Partial<IBook>): CollectedImage[] {
  const out: CollectedImage[] = [];
  const seen = new Set<string>();

  const add = (url: string | undefined, meta: Omit<CollectedImage, 'id' | 'url'>) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push({ id: `img-${out.length}`, url, ...meta });
  };

  // 1) Top-level pageImages (order preserved).
  (book.pageImages || []).forEach((img: any) => {
    add(img?.url, { prompt: img?.prompt, isAiGenerated: img?.isAiGenerated });
  });

  // 2) Images placed inside the manual layout pages (page order, then within-page).
  const pages = (book.pageLayout as any)?.pages || [];
  pages.forEach((p: any) => {
    (p?.images || []).forEach((im: any) => add(im?.url, {}));
  });

  return out;
}

/** Map of id → url for quick resolution in renderers. */
export function imageUrlById(book: Partial<IBook>): Map<string, string> {
  const m = new Map<string, string>();
  for (const img of collectBookImages(book)) m.set(img.id, img.url);
  return m;
}
