/**
 * Image diagnostic + self-healing endpoints.
 *
 * These exist because existing books may have stale AI image URLs that have
 * already expired (DALL-E) or point to ephemeral hosts. This lets the user
 * (or support) see exactly what's in the DB and, if needed, re-persist them.
 */

import { Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../types';
import { Book } from '../models/Book';
import { persistImage } from '../services/imagePersistenceService';
import { supabaseAdmin } from '../config/supabase';

const isValidUUID = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function classifyUrl(url: string): string {
  if (!url) return 'missing';
  if (url.startsWith('data:')) return 'data-url';
  if (url.startsWith('blob:')) return 'blob-url (will break on reload)';
  if (url.startsWith('/uploads/')) return 'local-uploads (dev only)';
  if (url.includes('oaidalleapiprodscus') || url.includes('openai')) return 'dalle-temp (expires in 1h)';
  if (url.includes('pollinations.ai')) return 'pollinations (regenerates each request)';
  if (url.includes('api.stability.ai')) return 'stability-temp';
  if (url.includes('supabase')) return 'supabase-storage (stable)';
  if (url.startsWith('http')) return 'external-url';
  return 'unknown';
}

async function probeUrl(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!url || url.startsWith('data:')) return { ok: true };
  try {
    const res = await axios.head(url, { timeout: 5000, validateStatus: () => true });
    return { ok: res.status < 400, status: res.status };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'unknown' };
  }
}

/**
 * GET /api/books/:id/image-diagnostic
 *
 * Walks the book's image storage locations and reports what's there and
 * whether each URL is still reachable. Intended for support/debugging — the
 * user asked "my images disappeared", and this tells us WHY.
 */
export const diagnoseBookImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    const { id } = req.params;
    if (!isValidUUID(id)) {
      res.status(400).json({ success: false, error: 'Invalid book ID' });
      return;
    }

    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({ success: false, error: 'Book not found' });
      return;
    }
    if (book.author !== req.user.id) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    // Collect every image URL that lives anywhere on this book
    type Record = {
      location: string;
      pageIndex?: number;
      url: string;
      kind: string;
      reachable?: { ok: boolean; status?: number; error?: string };
      bytesPreview?: number; // size of the URL string itself (for data URLs)
    };
    const records: Record[] = [];

    // 1) Top-level pageImages array
    (book.pageImages || []).forEach((img: any, i: number) => {
      records.push({
        location: `book.pageImages[${i}]`,
        pageIndex: img.pageIndex,
        url: img.url,
        kind: classifyUrl(img.url),
        bytesPreview: (img.url || '').length,
      });
    });

    // 2) pageLayout.pages[i].images (what the editor saves)
    const pages = (book.pageLayout as any)?.pages || [];
    pages.forEach((page: any, pageIdx: number) => {
      (page.images || []).forEach((img: any, i: number) => {
        records.push({
          location: `pageLayout.pages[${pageIdx}].images[${i}]`,
          pageIndex: pageIdx,
          url: img.url,
          kind: classifyUrl(img.url),
          bytesPreview: (img.url || '').length,
        });
      });
    });

    // 3) Cover image
    const coverUrl = (book.coverDesign as any)?.imageUrl || (book.coverDesign as any)?.front?.imageUrl;
    if (coverUrl) {
      records.push({
        location: 'book.coverDesign.imageUrl',
        url: coverUrl,
        kind: classifyUrl(coverUrl),
        bytesPreview: coverUrl.length,
      });
    }

    // 4) AI design state image placements
    const aiPlacements = (book.aiDesignState as any)?.design?.imagePlacements || [];
    aiPlacements.forEach((p: any, i: number) => {
      const url = p.generatedImageUrl || p.imageUrl;
      if (url) {
        records.push({
          location: `aiDesignState.design.imagePlacements[${i}]`,
          url,
          kind: classifyUrl(url),
          bytesPreview: url.length,
        });
      }
    });

    // Probe the first 15 external URLs in parallel (data: URLs skipped)
    const toProbe = records
      .filter((r) => r.url && !r.url.startsWith('data:'))
      .slice(0, 15);
    await Promise.all(
      toProbe.map(async (r) => {
        r.reachable = await probeUrl(r.url);
      })
    );

    res.json({
      success: true,
      data: {
        bookId: id,
        totalImages: records.length,
        byKind: records.reduce((acc: any, r) => {
          acc[r.kind] = (acc[r.kind] || 0) + 1;
          return acc;
        }, {}),
        images: records,
      },
    });
  } catch (error: any) {
    console.error('diagnoseBookImages error:', error);
    res.status(500).json({ success: false, error: error.message || 'Diagnostic failed' });
  }
};

/**
 * POST /api/books/:id/repersist-images
 *
 * Walks the book's saved image URLs and tries to re-upload any that are
 * still reachable into the permanent `book-images` Supabase bucket. URLs
 * that are already permanent (data:, supabase:) are left alone. Dead URLs
 * (DALL-E expired, 404) are reported but cannot be recovered.
 */
export const repersistBookImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    const { id } = req.params;
    if (!isValidUUID(id)) {
      res.status(400).json({ success: false, error: 'Invalid book ID' });
      return;
    }

    const book = await Book.findById(id);
    if (!book || book.author !== req.user.id) {
      res.status(404).json({ success: false, error: 'Book not found' });
      return;
    }

    let migrated = 0;
    let skipped = 0;
    let failed = 0;

    // Helper: attempt to move a single URL to permanent storage
    const tryPersist = async (url: string): Promise<string> => {
      if (!url) return url;
      // Already permanent
      if (url.includes('supabase') && url.includes('book-images')) {
        skipped++;
        return url;
      }
      if (url.startsWith('data:')) {
        // Data URLs work but bloat the row — migrate them
      }
      try {
        const newUrl = await persistImage(url, { userId: req.user!.id, bookId: id });
        if (newUrl !== url) {
          migrated++;
          return newUrl;
        }
        failed++;
        return url;
      } catch {
        failed++;
        return url;
      }
    };

    // ---- PHASE 0: Migrate AI design imagePlacements into pageLayout.pages ----
    // Images generated via "design everything" are stored in
    // aiDesignState.design.imagePlacements — a location the PageRenderer
    // doesn't reliably display. Copy them into the matching chapter page's
    // `images` array so they render as regular page images.
    let aiImagesMigrated = 0;
    const layout = (book.pageLayout as any) || {};
    const aiPlacements = (book.aiDesignState as any)?.design?.imagePlacements || [];

    if (aiPlacements.length > 0 && layout.pages) {
      for (const placement of aiPlacements) {
        const imgUrl = placement.generatedImageUrl || placement.imageUrl;
        if (!imgUrl) continue;

        // Find the chapter page(s) matching this placement's chapterIndex
        const chapterIdx = placement.chapterIndex ?? 0;
        const targetPage = layout.pages.find(
          (p: any) => p.type === 'chapter' && p.chapterIndex === chapterIdx
        );
        if (!targetPage) continue;

        // Skip if this image URL is already on the page (prevent duplicates)
        if (!targetPage.images) targetPage.images = [];
        const alreadyExists = targetPage.images.some(
          (img: any) => img.url === imgUrl
        );
        if (alreadyExists) continue;

        // Add the image to the page — positioned at top center
        targetPage.images.push({
          id: `ai-migrated-${Date.now()}-${aiImagesMigrated}`,
          url: imgUrl,
          x: 10,
          y: 5,
          width: 80,
          height: 35,
          rotation: 0,
        });
        aiImagesMigrated++;
      }
    }

    // ---- PHASE 1: Persist pageImages to Supabase Storage -----------------
    const newPageImages = await Promise.all(
      (book.pageImages || []).map(async (img: any) => ({
        ...img,
        url: await tryPersist(img.url),
      }))
    );

    // ---- PHASE 2: Persist pageLayout.pages[*].images ---------------------
    if (layout.pages) {
      for (const page of layout.pages) {
        if (page.images) {
          for (const img of page.images) {
            img.url = await tryPersist(img.url);
          }
        }
      }
    }

    // 3. Cover image
    const cover = (book.coverDesign as any) || {};
    if (cover.imageUrl) cover.imageUrl = await tryPersist(cover.imageUrl);
    if (cover.front?.imageUrl) cover.front.imageUrl = await tryPersist(cover.front.imageUrl);
    if (cover.back?.imageUrl) cover.back.imageUrl = await tryPersist(cover.back.imageUrl);

    // Persist the updated book atomically
    const { error: updateError } = await supabaseAdmin
      .from('books')
      .update({
        page_images: newPageImages,
        page_layout: layout,
        cover_design: cover,
      })
      .eq('id', id);

    if (updateError) {
      throw new Error(`Failed to save updated book: ${updateError.message}`);
    }

    res.json({
      success: true,
      data: {
        aiImagesMigrated,
        migrated,
        skipped,
        failed,
        total: migrated + skipped + failed,
      },
    });
  } catch (error: any) {
    console.error('repersistBookImages error:', error);
    res.status(500).json({ success: false, error: error.message || 'Repersist failed' });
  }
};
