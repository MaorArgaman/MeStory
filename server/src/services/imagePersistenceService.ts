/**
 * Image persistence helper.
 *
 * The image generation providers return URLs in very different formats:
 *   - **Gemini (Imagen)**          → `data:image/png;base64,....` (persistent but bloats DB)
 *   - **DALL-E 3 (OpenAI)**        → `https://oaidalleapiprodscus.blob.core.windows.net/...`
 *                                    → EXPIRES AFTER ~1 HOUR 🚨
 *   - **Pollinations.ai**          → `https://pollinations.ai/p/...` (regenerates each time)
 *   - **Stability AI**             → `https://api.stability.ai/...` (temporary)
 *
 * Any of these that aren't uploaded to our own storage will break: the URL
 * stops working, or the base64 payload bloats the `books.page_images` JSONB
 * column until queries slow to a crawl.
 *
 * This module normalizes every generated image by:
 *   1. Fetching the bytes (decoding base64 or downloading the URL).
 *   2. Uploading them to the `book-images` Supabase Storage bucket.
 *   3. Returning a long-lived public URL the app can safely save.
 *
 * Usage:
 *   const persistentUrl = await persistImage(rawImageUrl, { userId, bookId });
 */

import { supabaseAdmin } from '../config/supabase';
import axios from 'axios';
import crypto from 'crypto';

const BUCKET = 'book-images';

export interface PersistImageOptions {
  userId: string;
  bookId?: string;
  /** Optional hint for the file extension/content-type (png, jpg, webp). */
  mimeTypeHint?: string;
}

/**
 * Download or decode an image and upload it to Supabase Storage.
 * Returns a stable public URL. If anything fails the original URL is
 * returned so the caller's flow isn't broken — worst case, the behavior
 * stays the same as before.
 */
export async function persistImage(
  sourceUrl: string,
  opts: PersistImageOptions
): Promise<string> {
  if (!sourceUrl) return sourceUrl;

  try {
    const { buffer, contentType } = await fetchImageBytes(sourceUrl, opts.mimeTypeHint);
    const ext = extensionFromMime(contentType);
    const rand = crypto.randomBytes(6).toString('hex');
    const path = `${opts.userId}/${opts.bookId || 'misc'}/${Date.now()}_${rand}.${ext}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: false });

    if (uploadErr) {
      console.warn(`[persistImage] upload failed, returning original URL:`, uploadErr.message);
      return sourceUrl;
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl || sourceUrl;
  } catch (err: any) {
    console.warn(`[persistImage] could not persist image, returning original URL:`, err?.message);
    return sourceUrl;
  }
}

/**
 * Same as persistImage but handles an array, with concurrency = 3 so we
 * don't hammer OpenAI / Gemini when a batch of images is saved at once.
 */
export async function persistImages(
  sourceUrls: string[],
  opts: PersistImageOptions
): Promise<string[]> {
  const results: string[] = new Array(sourceUrls.length);
  const concurrency = 3;
  let idx = 0;
  async function worker() {
    while (idx < sourceUrls.length) {
      const i = idx++;
      results[i] = await persistImage(sourceUrls[i], opts);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ---------- internals ------------------------------------------------------

async function fetchImageBytes(
  sourceUrl: string,
  mimeTypeHint?: string
): Promise<{ buffer: Buffer; contentType: string }> {
  // 1. data: URLs — decode in place, no network round-trip
  if (sourceUrl.startsWith('data:')) {
    const match = sourceUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid data URL');
    }
    return {
      buffer: Buffer.from(match[2], 'base64'),
      contentType: match[1] || mimeTypeHint || 'image/png',
    };
  }

  // 2. http(s): URLs — download the bytes. Use a short timeout so a dead
  //    upstream can't stall the request.
  const res = await axios.get<ArrayBuffer>(sourceUrl, {
    responseType: 'arraybuffer',
    timeout: 30_000,
    maxContentLength: 20 * 1024 * 1024, // 20 MB hard cap
  });

  const contentType =
    (res.headers['content-type'] as string | undefined) ||
    mimeTypeHint ||
    'image/png';

  return { buffer: Buffer.from(res.data as any), contentType };
}

function extensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[mime] || 'png';
}
