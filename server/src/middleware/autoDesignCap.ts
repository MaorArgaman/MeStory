/**
 * autoDesignCap — middleware that enforces the per-book usage cap on the
 * auto-design feature, BEFORE requireCredits runs. Runs LLM-call-side so
 * we never burn Claude tokens for a user who has already maxed out their
 * 3 uses on a given book.
 *
 * Order:   authenticate → autoDesignCap → requireCredits → controller
 *
 * The cap is "uses per book", not "uses per user" — a user with many
 * books gets 3 generates on each. This is by design: we don't want to
 * punish a prolific writer.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { Book } from '../models/Book';

export const AUTO_DESIGN_MAX_USES_PER_BOOK = 3;

export async function autoDesignCap(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const bookId = req.params.bookId || req.params.id;
  if (!bookId) {
    res.status(400).json({ success: false, error: 'bookId param required' });
    return;
  }
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  // Ownership check first — also avoids leaking whether a book exists.
  const ownerId = await Book.getOwnerId(bookId);
  if (!ownerId) {
    res.status(404).json({ success: false, error: 'Book not found' });
    return;
  }
  if (ownerId !== req.user.id) {
    res.status(403).json({ success: false, error: 'Not your book' });
    return;
  }

  // Load just the counter — no need for the full book.
  const book = await Book.findByIdLite(bookId);
  const uses = book?.autoDesignUses ?? 0;

  if (uses >= AUTO_DESIGN_MAX_USES_PER_BOOK) {
    res.status(429).json({
      success: false,
      error: 'Auto-design usage cap reached for this book',
      errorCode: 'AUTO_DESIGN_CAP_REACHED',
      used: uses,
      max: AUTO_DESIGN_MAX_USES_PER_BOOK,
    });
    return;
  }

  // Stash so the controller can read remaining count without re-querying.
  (req as any).autoDesignUses = uses;
  next();
}
