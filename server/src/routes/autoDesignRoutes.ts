/**
 * /api/auto-design routes — drives the multi-agent typesetting pipeline.
 *
 *   POST /api/auto-design/:bookId
 *     Run the planner+critic+optionally-revise loop, save the resulting
 *     DesignPlan onto the book, and bump auto_design_uses. Returns the
 *     plan + reasoning + remaining uses.
 *
 *   GET /api/auto-design/:bookId/export.docx
 *     Stream a .docx of the book rendered from book.autoDesignPlan.
 *     Free (no credit charge) — the design was already paid for.
 */

import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireCredits } from '../middleware/requireCredits';
import { autoDesignCap, AUTO_DESIGN_MAX_USES_PER_BOOK } from '../middleware/autoDesignCap';
import { Book } from '../models/Book';
import { AuthRequest } from '../types';
import { generateDesign } from '../services/autoDesign/orchestrator';
import { renderDesignedBookDocx } from '../services/autoDesign/renderDocx';
import { DesignPlan } from '../services/autoDesign/designPlanSchema';
import rateLimit from 'express-rate-limit';

const router = Router();

router.use(authenticate as any);

// Exports are free (the design was already paid for) but PDF runs headless
// Chrome (real compute). A generous per-user burst cap stops a runaway loop /
// script from turning a free endpoint into an unbounded cost, without getting
// in the way of a user legitimately re-exporting their book several times.
const exportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  keyGenerator: (req: any) => req.user?.id || req.ip,
  message: {
    success: false,
    error: 'Too many export requests, please wait a moment and try again',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Trigger a new auto-design pass. Charges credits, bumps the per-book
 * usage counter, and writes the resulting DesignPlan to the book row.
 *
 * Usage cap is checked BEFORE credits to avoid charging users who can't
 * proceed.
 */
router.post(
  '/:bookId',
  autoDesignCap as any,
  requireCredits('auto_design_premium') as any,
  async (req: AuthRequest, res: Response) => {
    const bookId = req.params.bookId;
    const previousUses = (req as any).autoDesignUses ?? 0;
    const attemptNumber = (previousUses + 1) as 1 | 2 | 3;

    try {
      const book = await Book.findByIdForDesign(bookId);
      if (!book) {
        // Defensive — autoDesignCap already loaded the book; if it's
        // gone now we hit a race. Block the credit charge.
        res.locals.skipCreditCharge = true;
        res.status(404).json({ success: false, error: 'Book not found' });
        return;
      }

      // Collect the design systems used on earlier attempts so the
      // planner picks a different one for variety on regenerate.
      const previousSystems: string[] = [];
      if (book.autoDesignPlan?.designSystem && previousUses > 0) {
        previousSystems.push(book.autoDesignPlan.designSystem);
      }

      const result = await generateDesign({
        book,
        attemptNumber,
        previousSystems,
      });

      // Opt the plan into genome rendering: the client composes a full style
      // genome from (designSystem, seed), so the user can roll unlimited free
      // visual variations. The planner output stays the structural source.
      (result.plan as any).genomeMode = true;

      await Book.findByIdAndUpdate(
        bookId,
        {
          $set: {
            autoDesignPlan: result.plan,
            // Mark auto-design as the active pipeline so exports/previews use
            // the designed renderer. Dot-path merges into ai_design_state JSONB.
            'aiDesignState.activeDesign': 'auto',
          },
          $inc: { autoDesignUses: 1 },
        },
        { new: false }
      );

      res.json({
        success: true,
        data: {
          plan: result.plan,
          reasoning: result.reasoning,
          passedFirstTry: result.passedFirstTry,
          usesRemaining: AUTO_DESIGN_MAX_USES_PER_BOOK - (previousUses + 1),
          designSystem: result.plan.designSystem,
        },
      });
    } catch (err: any) {
      // Don't charge for failed designs. Helps users iterate without
      // paying every time the planner / Claude has a hiccup.
      res.locals.skipCreditCharge = true;
      console.error('[autoDesign] generate failed:', err?.message, err?.stack);
      res.status(500).json({
        success: false,
        error: 'Auto-design generation failed',
        details: err?.message,
      });
    }
  }
);

/**
 * Stream the current designed book as a .docx. No credit charge — the
 * design was paid for at generation time.
 */
router.get('/:bookId/export.docx', exportLimiter, async (req: AuthRequest, res: Response) => {
  const bookId = req.params.bookId;
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  const ownerId = await Book.getOwnerId(bookId);
  if (!ownerId) {
    res.status(404).json({ success: false, error: 'Book not found' });
    return;
  }
  if (ownerId !== req.user.id) {
    res.status(403).json({ success: false, error: 'Not your book' });
    return;
  }

  const book = await Book.findByIdForDesign(bookId);
  if (!book?.autoDesignPlan) {
    res.status(404).json({
      success: false,
      error: 'No auto-design plan on this book. Generate one first.',
      errorCode: 'NO_AUTO_DESIGN_PLAN',
    });
    return;
  }

  try {
    const buffer = await renderDesignedBookDocx(book, book.autoDesignPlan as DesignPlan);
    const safeName = (book.title || 'book').replace(/[^a-zA-Z0-9֐-׿\s-]/g, '').slice(0, 60);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeName)}.docx"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('[autoDesign] docx export failed:', err?.message);
    res.status(500).json({ success: false, error: 'Export failed', details: err?.message });
  }
});

/**
 * Stream the current designed book as a PDF, rendered from the SAME on-screen
 * page the user previews (/print/:id/designed) via headless Chrome — so the
 * file matches the preview exactly (WYSIWYG). No credit charge.
 */
router.get('/:bookId/export.pdf', exportLimiter, async (req: AuthRequest, res: Response) => {
  const bookId = req.params.bookId;
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  const ownerId = await Book.getOwnerId(bookId);
  if (!ownerId) {
    res.status(404).json({ success: false, error: 'Book not found' });
    return;
  }
  if (ownerId !== req.user.id) {
    res.status(403).json({ success: false, error: 'Not your book' });
    return;
  }
  const book = await Book.findByIdForDesign(bookId);
  if (!book?.autoDesignPlan) {
    res.status(404).json({
      success: false,
      error: 'No auto-design plan on this book. Generate one first.',
      errorCode: 'NO_AUTO_DESIGN_PLAN',
    });
    return;
  }

  try {
    const { renderBookToPdf } = await import('../services/puppeteerExportService');
    const authToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const buffer = await renderBookToPdf({ bookId, authToken, variant: 'designed' });
    const safeName = (book.title || 'book').replace(/[^a-zA-Z0-9֐-׿\s-]/g, '').slice(0, 60);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeName)}.pdf"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('[autoDesign] pdf export failed:', err?.message);
    res.status(500).json({ success: false, error: 'PDF export failed', details: err?.message });
  }
});

/**
 * Quick status check — used by the client to decide whether to show
 * "View designed preview" vs "Generate design". Cheap query.
 */
router.get('/:bookId/status', async (req: AuthRequest, res: Response) => {
  const bookId = req.params.bookId;
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  const book = await Book.findByIdLite(bookId);
  if (!book) {
    res.status(404).json({ success: false, error: 'Book not found' });
    return;
  }
  if (book.author !== req.user.id) {
    res.status(403).json({ success: false, error: 'Not your book' });
    return;
  }
  // findByIdLite doesn't include autoDesignPlan, only autoDesignUses.
  // Fetch the design slice if needed.
  const designBook = await Book.findByIdForDesign(bookId);
  res.json({
    success: true,
    data: {
      hasPlan: !!designBook?.autoDesignPlan,
      designSystem: designBook?.autoDesignPlan?.designSystem || null,
      usesRemaining: AUTO_DESIGN_MAX_USES_PER_BOOK - (book.autoDesignUses ?? 0),
      maxUses: AUTO_DESIGN_MAX_USES_PER_BOOK,
    },
  });
});

/**
 * Persist a chosen visual variation seed. The client lets the user roll
 * unlimited free design variations (each is just a new genome seed rendered
 * client-side); this saves the one they like so exports + the editor pick it
 * up. No credit charge, and it does NOT count against the 3-generate cap —
 * it changes only the look, not the structure, and runs no LLM.
 */
router.patch('/:bookId/seed', async (req: AuthRequest, res: Response) => {
  const bookId = req.params.bookId;
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }
  const seed = Number((req.body || {}).seed);
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647) {
    res.status(400).json({ success: false, error: 'Invalid seed', errorCode: 'INVALID_SEED' });
    return;
  }
  const ownerId = await Book.getOwnerId(bookId);
  if (!ownerId) {
    res.status(404).json({ success: false, error: 'Book not found' });
    return;
  }
  if (ownerId !== req.user.id) {
    res.status(403).json({ success: false, error: 'Not your book' });
    return;
  }
  const book = await Book.findByIdForDesign(bookId);
  if (!book?.autoDesignPlan) {
    res.status(404).json({
      success: false,
      error: 'No auto-design plan on this book. Generate one first.',
      errorCode: 'NO_AUTO_DESIGN_PLAN',
    });
    return;
  }

  try {
    // Dot-path merge into the autoDesignPlan JSONB — only seed + genomeMode.
    await Book.findByIdAndUpdate(
      bookId,
      { $set: { 'autoDesignPlan.seed': seed, 'autoDesignPlan.genomeMode': true } },
      { new: false }
    );
    res.json({ success: true, data: { seed } });
  } catch (err: any) {
    console.error('[autoDesign] save seed failed:', err?.message);
    res.status(500).json({ success: false, error: 'Failed to save variation', details: err?.message });
  }
});

export default router;
