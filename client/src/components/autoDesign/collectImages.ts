/**
 * Client mirror of server/src/services/autoDesign/collectImages.ts.
 * MUST produce the same ordered list from the same book JSON so the
 * "img-N" ids the planner wrote resolve to the same image here.
 *
 * Order: book.pageImages first (in order), then pageLayout.pages[].images
 * (page order, then within-page), de-duplicated by url.
 */

export interface CollectedImageClient {
  id: string;
  url: string;
}

export function collectBookImages(book: {
  pageImages?: Array<{ url?: string }>;
  pageLayout?: { pages?: Array<{ images?: Array<{ url?: string }> }> };
}): CollectedImageClient[] {
  const out: CollectedImageClient[] = [];
  const seen = new Set<string>();
  const add = (url?: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    out.push({ id: `img-${out.length}`, url });
  };
  (book.pageImages || []).forEach((img) => add(img?.url));
  (book.pageLayout?.pages || []).forEach((p) => (p?.images || []).forEach((im) => add(im?.url)));
  return out;
}

export function imageUrlById(book: Parameters<typeof collectBookImages>[0]): Map<string, string> {
  const m = new Map<string, string>();
  for (const img of collectBookImages(book)) m.set(img.id, img.url);
  return m;
}
