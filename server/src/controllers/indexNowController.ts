/**
 * IndexNow Controller
 *
 * IndexNow is an open protocol (https://www.indexnow.org/) supported by Bing,
 * Yandex, Seznam, Naver, and Yep that lets a site instantly notify those
 * search engines when a URL is published, updated, or deleted — instead of
 * waiting for the next crawl.
 *
 * How it works:
 *   1. We host a key file at /<KEY>.txt that contains the same key.
 *   2. We POST URLs to https://api.indexnow.org/IndexNow with the key in the body.
 *   3. The receiving engine fetches /<KEY>.txt to verify ownership, then queues
 *      the submitted URLs for immediate crawl.
 *
 * Setup steps for the operator (one-time):
 *   1. Generate a hex key (we do this once — env var INDEXNOW_KEY).
 *   2. Add the key file at client/public/<INDEXNOW_KEY>.txt with the key as content.
 *      (Alternatively, GET /indexnow-key/:key on this server returns the key,
 *      and the IndexNow verifier accepts that path as the keyLocation.)
 *   3. Set INDEXNOW_KEY in your environment.
 *
 * Usage from app code:
 *   await pingIndexNow(['https://mestory-ai.com/book/abc123']);
 */

import { Request, Response } from 'express';

const INDEXNOW_HOST = 'mestory-ai.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';

const getKey = (): string | null => {
  return process.env.INDEXNOW_KEY || null;
};

const getKeyLocation = (key: string): string => {
  // The verifier expects the key to be reachable at this URL and to return
  // the key as plain text. We expose it via GET /indexnow-key/:key below.
  return `https://${INDEXNOW_HOST}/indexnow-key/${key}`;
};

/**
 * Notify IndexNow of one or more URLs that have been added/updated/removed.
 * Returns true on success, false otherwise. Failures are logged but never throw —
 * search-engine notification is best-effort and should not break app flows.
 */
export const pingIndexNow = async (urls: string[]): Promise<boolean> => {
  const key = getKey();
  if (!key) {
    // Quietly skip if not configured — common in local dev.
    return false;
  }
  if (!urls.length) return false;

  // Filter to canonical host only — IndexNow rejects mixed-host submissions.
  const canonical = urls.filter((u) => {
    try {
      return new URL(u).host === INDEXNOW_HOST;
    } catch {
      return false;
    }
  });
  if (!canonical.length) return false;

  const body = {
    host: INDEXNOW_HOST,
    key,
    keyLocation: getKeyLocation(key),
    urlList: canonical,
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });

    // 200 = accepted, 202 = received and queued. Both are success.
    if (response.status === 200 || response.status === 202) {
      console.log(`[IndexNow] submitted ${canonical.length} URL(s)`);
      return true;
    }
    console.warn(`[IndexNow] unexpected status ${response.status} for ${canonical.length} URL(s)`);
    return false;
  } catch (error) {
    console.warn('[IndexNow] submission failed:', error);
    return false;
  }
};

/**
 * GET /indexnow-key/:key
 * Verifier endpoint. Returns the key in plain text if it matches the configured one.
 */
export const serveIndexNowKey = (req: Request, res: Response): void => {
  const configured = getKey();
  if (!configured) {
    res.status(404).type('text/plain').send('IndexNow not configured');
    return;
  }
  const requested = req.params.key;
  if (requested !== configured) {
    res.status(404).type('text/plain').send('Key mismatch');
    return;
  }
  res.status(200).type('text/plain').send(configured);
};

/**
 * POST /api/indexnow/submit
 * Admin-only endpoint to manually submit URLs (e.g., from the dashboard or a
 * cron job). Body: { urls: string[] }.
 */
export const submitToIndexNow = async (req: Request, res: Response): Promise<void> => {
  const urls: unknown = req.body?.urls;
  if (!Array.isArray(urls) || urls.some((u) => typeof u !== 'string')) {
    res.status(400).json({ success: false, error: 'urls must be an array of strings' });
    return;
  }
  const ok = await pingIndexNow(urls as string[]);
  res.status(ok ? 200 : 202).json({ success: ok, submitted: urls.length });
};

export default {
  pingIndexNow,
  serveIndexNowKey,
  submitToIndexNow,
};
