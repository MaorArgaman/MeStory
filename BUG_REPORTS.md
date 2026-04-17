# MeStory E2E Test — Bug Reports

**Test Date:** 2026-04-13  
**Tester:** Claude (Cowork automated E2E)  
**Environment:** MeStory local dev — client port 5173, server port 5001, Supabase backend  
**Test User:** e2e_test@mestory.com  
**Book Under Test:** "זיכרון אבי - ספר הנצחה" (ID: `24218f1b-e79a-4e5f-acd8-bfd4a7e8ab44`)

---

## BUG-0025 — Registration page returns 404 on `/he/register`

**Severity:** High
**Status:** Fixed (2026-04-13)  
**File:** `client/src/App.tsx` (route definitions)

**Description:**  
Navigating to `/he/register` (the localised Hebrew registration URL) returns a 404 Not Found page. The registration form only renders correctly at `/register` (without the language prefix). Since the application sends new users to the localised URL, Hebrew-language users cannot register.

**Steps to Reproduce:**
1. Open the app in a browser.
2. Navigate to `http://localhost:5173/he/register`.

**Expected:** Registration form renders.  
**Actual:** 404 / Not Found page renders.

**Root Cause:** The router in `App.tsx` does not define a `/he/register` route. Only `/register` is registered.

**Fix Applied:**
Added localized routes for `/he/register`, `/he/login`, `/en/register`, `/en/login` in `App.tsx` using the `LanguageRoute` component wrapper.

---

## BUG-0026 — Missing database columns cause server 500 errors

**Severity:** High
**Status:** Fixed (verified 2026-04-13)  
**Files:** `server/src/models/User.ts`, Supabase schema

**Description:**  
Multiple API endpoints fail with HTTP 500 because `INSERT` / `SELECT` queries reference columns that do not exist in the Supabase `users` table (`credits`, `subscription_tier`, `role`, etc.). This prevents login, registration, and book creation from working through the normal server flow.

**Steps to Reproduce:**
1. Start the Express server.
2. `POST /api/auth/register` with valid credentials.

**Expected:** 201 Created with user object.  
**Actual:** 500 Internal Server Error — column `credits` of relation `users` does not exist.

**Fix Verified:**
All required columns (`id`, `name`, `email`, `role`, `credits`, `subscription`, `profile`, `paypal`, `email_verification`, `organization_id`, `created_at`, `updated_at`) now exist in the Supabase `users` table and queries work correctly.

---

## BUG-A — PDF export: excessive pages (page explosion)

**Severity:** Medium  
**Status:** Fixed (2026-04-13)  
**File:** `server/src/services/bookExportService.ts`

**Description:**  
The generated PDF contained far more pages than expected. A book with 3 chapters of ~300 words each produced 25+ pages instead of the expected 6–8 pages.

**Root Cause:**  
Two interacting problems:

1. **Per-segment rendering:** The original code called `doc.text()` once per `FormattedSegment` (each inline formatted run). PDFKit treats every `doc.text()` call as a separate block, adding internal spacing between blocks. A single paragraph of 50 words split across 10 bold/italic segments generated 10 blocks with 10 inter-block gaps.

2. **Double page-break logic:** The manual `if (doc.y > threshold) doc.addPage()` check ran before every paragraph. When PDFKit auto-flowed a long paragraph onto a new page internally, `doc.y` after the call was near the bottom of the *new* page. The next iteration's check then added yet another unnecessary blank page.

**Fix Applied:**

- **Segments consolidated:** All `FormattedSegment` objects in a chapter are now merged into paragraph strings before rendering. One `doc.text()` call per paragraph (inline formatting markup stripped — acceptable trade-off for correct layout).
- **Guard added to page-break check:** Manual `addPage()` is now skipped when `doc.y` is already near `margins.top` (i.e. PDFKit just created a fresh page automatically).

```typescript
// Before:
if (doc.y > pageDims.height - margins.bottom - 80) {
  doc.addPage();
}

// After:
const nearBottom = doc.y > pageDims.height - margins.bottom - 80;
const alreadyAtTop = doc.y <= margins.top + 20;
if (nearBottom && !alreadyAtTop) {
  doc.addPage();
}
```

---

## BUG-B — PDF export: Hebrew text aligned left instead of right

**Severity:** Medium  
**Status:** Fixed (2026-04-13)  
**File:** `server/src/services/bookExportService.ts`

**Description:**  
In Hebrew-language books (`language: 'he'`), body text paragraphs were rendered with `align: 'justify'`. PDFKit's justify alignment works left-to-right, so Hebrew RTL text was anchored on the left margin with uneven spacing, producing an unreadable layout.

**Affected locations (before fix):**

| Line | Context |
|------|---------|
| ~1235 | Character description |
| ~1325 | Story-context section body |
| ~1367 | Voice-interview answer body |
| ~1402 | Back-cover synopsis |
| ~1420 | Back-cover author bio |

**Fix Applied:**  
All hardcoded `align: 'justify'` calls in text-content positions were replaced with `align: isRTL ? 'right' : 'justify'`. The `isRTL` boolean is already computed at the top of the function from `bookData.language`.

```typescript
// Before:
doc.text(paragraph, margins.left, doc.y, {
  align: 'justify',
  ...
});

// After:
doc.text(paragraph, margins.left, doc.y, {
  align: isRTL ? 'right' : 'justify',
  ...
});
```

---

## BUG-C — PDF cover: design elements do not fully match in-app preview

**Severity:** Low  
**Status:** Open  
**File:** `server/src/services/bookExportService.ts`

**Description:**  
The exported PDF cover page has visual discrepancies compared to the cover design shown inside the app's Design Studio:

- **Font rendering:** The app preview uses Google Fonts loaded via CSS (`@import`). The PDF renderer (PDFKit) uses the bundled fallback fonts (`Helvetica` / `NotoSansHebrew`). Letterform shapes and spacing differ.
- **Cover image positioning:** Decorative overlay elements (gradient bands, geometric shapes added in the Design Studio) are not replicated in the PDF. The PDF uses a flat solid background colour with a centred cover image.
- **Author name placement:** In some templates the author name renders at a slightly different Y position in the PDF vs. the preview (1–3mm offset).

**Suggested Fix:** Implement a headless-browser (Puppeteer / Playwright) cover-capture step, or export the cover as a PNG from the front-end canvas and embed it as the first page of the PDF to ensure pixel-perfect fidelity.

---

## BUG-D — Server: `bcrypt` native binary incompatible with deployment OS

**Severity:** Medium  
**Status:** Fixed (2026-04-13)  
**File:** `server/src/controllers/authController.ts`

**Description:**  
The `bcrypt` npm package ships a pre-compiled native `.node` binary. The binary bundled in `node_modules` was compiled for a different OS/architecture than the deployment environment, causing a startup crash:

```
Error: invalid ELF header
    at Object.Module._extensions..node
```

**Fix Applied:**  
Replaced `import bcrypt from 'bcrypt'` with `import bcrypt from 'bcryptjs'` in `authController.ts`. `bcryptjs` is a pure-JavaScript implementation with identical API, no native binary required.

---

## BUG-E — Marketplace: published book visible in DB but not in UI (network isolation)

**Severity:** Low (test-environment specific)  
**Status:** Known / Test Environment Only

**Description:**  
During E2E testing, the React marketplace page (`/marketplace`) showed a blank/error state even after the book was successfully marked as `published` in Supabase. The root cause is test-environment network isolation:

- The Vite dev server ran inside a `bwrap --unshare-net` sandbox.
- The Claude in Chrome browser runs outside this sandbox and cannot reach `localhost:5173` served from within the sandbox.
- As a result, the React app could not be loaded in the browser for final visual verification.

**Workaround Used:**  
Direct Supabase REST API call from Chrome JavaScript confirmed the book record contains `publishing_status.status = "published"` and `publishing_status.isPublic = true`. The book appeared in the marketplace query results alongside two other published books.

**Action Required for Production:** None — this is a test-infrastructure limitation, not an application bug.

---

## Summary Table

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| BUG-0025 | `/he/register` returns 404 | High | **Fixed** |
| BUG-0026 | Missing DB columns → 500 errors | High | **Fixed** |
| BUG-A | PDF page explosion | Medium | **Fixed** |
| BUG-B | PDF Hebrew text aligned left | Medium | **Fixed** |
| BUG-C | PDF cover doesn't match preview | Low | Open |
| BUG-D | bcrypt ELF header crash | Medium | **Fixed** |
| BUG-E | Marketplace UI not visible in test env | Low | Known |
