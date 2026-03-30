# Book Creation & Publishing Flow - Issue Report

## Date: 2026-03-30

---

## CRITICAL ISSUES (Must Fix)

### 1. Invalid Date Format in Publish Endpoint
**Location:** `server/src/controllers/bookController.ts`, line ~1083
**Issue:** `publishedAt` is set as JavaScript Date object instead of ISO string
```typescript
// WRONG:
publishedAt: new Date()
// SHOULD BE:
publishedAt: new Date().toISOString()
```
**Impact:** Data corruption in PostgreSQL JSONB, serialization issues

---

### 2. Missing Fields in allowedUpdates Array
**Location:** `server/src/controllers/bookController.ts`, line ~766-777
**Issue:** Several important fields are NOT in the `allowedUpdates` array:
- `aiDesignState` - AI design wizard progress lost on reload
- `templateId` - Template selection lost on reload
- `storyContext` - Story context from interviews lost

```typescript
const allowedUpdates = [
  'title', 'genre', 'description', 'synopsis', 'language',
  'chapters', 'characters', 'plotStructure', 'coverDesign',
  'pageLayout', 'pageImages', 'tags', 'ageRating',
  'publishingStatus',
  // MISSING: 'aiDesignState', 'templateId', 'storyContext'
];
```
**Impact:** Design progress and story context cannot be saved

---

### 3. Missing Response Fields in updateBook Endpoint
**Location:** `server/src/controllers/bookController.ts`, line ~809-823
**Issue:** Update response doesn't return all book fields:
```typescript
// MISSING in response:
// coverDesign, pageLayout, pageImages, publishingStatus,
// language, ageRating, tags, qualityScore, aiDesignState,
// templateId, storyContext, plotStructure
```
**Impact:** Client UI becomes inconsistent after save

---

### 4. No Cover Design Validation Before Publish
**Location:** `server/src/controllers/bookController.ts`, line ~1041-1075
**Issue:** Books can be published without cover design
**Expected:**
```typescript
if (!book.coverDesign || !book.coverDesign.front) {
  return res.status(400).json({
    error: 'Please design a cover before publishing'
  });
}
```
**Impact:** Books appear in marketplace without cover images

---

## MAJOR ISSUES

### 5. Translation/Audio Generation Has No Error Feedback
**Location:** `server/src/controllers/bookController.ts`, line ~1095-1097
**Issue:** Fire-and-forget pattern with no user notification
```typescript
generateTranslationsAndAudio(...).catch((err) =>
  console.error('Failed:', err) // Only logs, user doesn't know
);
```
**Impact:** Users don't know if translation/audio generation failed

---

### 6. Statistics Fields Not Fully Initialized
**Location:** `server/src/controllers/bookController.ts`, line ~461-471
**Issue:** Missing fields in statistics initialization:
```typescript
// MISSING:
// averageRating: 0, completionRate: 0,
// readingTime: 0, shares: 0, comments: 0
```
**Impact:** Undefined errors when accessing these fields

---

### 7. Price Validation Logic Bug
**Location:** `server/src/controllers/bookController.ts`, line ~1068-1076
**Issue:**
```typescript
if (!isFree && price) {  // Bug: price=0 bypasses validation
```
**Should be:**
```typescript
if (!isFree) {
  if (!price || price < 0.01 || price > 25) {
    // Error
  }
}
```
**Impact:** Paid books could have $0 price

---

### 8. Publish Response Missing Critical Fields
**Location:** `server/src/controllers/bookController.ts`, line ~1113-1122
**Issue:** Response only returns id, title, publishingStatus
```typescript
// MISSING: chapters, coverDesign, author, synopsis, tags, statistics
```
**Impact:** Client doesn't get full confirmation of publish

---

## MODERATE ISSUES

### 9. Marketplace Category Filter Issue
**Location:** `server/src/controllers/bookController.ts`, line ~1340-1345
**Issue:** Query for `publishingStatus.marketingStrategy.categories` may be empty
**Impact:** Published books not found by category filter

---

### 10. Inconsistent API Response Shapes
**Issue:** Different endpoints return different formats:
- `getBooks`: `{book: {...}}`
- `getBookById`: `{book: {...}}` OR properties at root
- `updateBook`: `{book: {...}}`
- `publishBook`: `{book: {id, title, publishingStatus}}` (incomplete)

**Impact:** Client must handle multiple formats, causing bugs

---

### 11. Audio File Cleanup Missing
**Location:** `server/src/controllers/bookController.ts`
**Issue:** When audio is regenerated, old URLs aren't cleaned up
**Impact:** Orphaned audio files waste storage

---

### 12. Missing translations Initialization
**Location:** `server/src/controllers/bookController.ts`, line ~446-471
**Issue:** `translations` field not initialized on book creation
**Impact:** `book.translations` is undefined before publish

---

## MINOR ISSUES

### 13. shares and comments Fields Never Updated
**Location:** `server/src/models/Book.ts`
**Issue:** Fields defined but never incremented
**Impact:** Always zero

---

### 14. CreateBookWizard Fields Not Returned
**Location:** `client/src/components/dashboard/CreateBookWizard.tsx`
**Issue:** `writingGoal` and `targetAudience` sent but not returned in response
**Impact:** UI may not reflect user selections

---

## SUMMARY

| # | Issue | Severity | Component |
|---|-------|----------|-----------|
| 1 | Invalid Date format | CRITICAL | Publish |
| 2 | Missing allowedUpdates fields | CRITICAL | Update |
| 3 | Missing response fields | CRITICAL | Update |
| 4 | No cover validation | CRITICAL | Publish |
| 5 | No error feedback for TTS | MAJOR | Publish |
| 6 | Statistics not initialized | MAJOR | Create |
| 7 | Price validation bug | MAJOR | Publish |
| 8 | Incomplete publish response | MAJOR | Publish |
| 9 | Category filter issue | MODERATE | Marketplace |
| 10 | Inconsistent responses | MODERATE | API |
| 11 | Audio cleanup missing | MODERATE | TTS |
| 12 | translations not initialized | MODERATE | Create |
| 13 | shares/comments unused | MINOR | Stats |
| 14 | Wizard fields not returned | MINOR | Create |

---

## Recommended Fix Priority

1. **Immediate**: Issues 1-4 (data loss/corruption)
2. **Soon**: Issues 5-8 (user experience)
3. **Later**: Issues 9-14 (polish)
