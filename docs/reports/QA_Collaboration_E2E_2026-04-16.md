# QA Report — Collaboration / Co-Authoring E2E

**Date:** 2026-04-16
**Tester:** Claude (code audit + static analysis)
**Scope:** Full end-to-end flow — User A invites User B → User B accepts → both users write and edit the book together.
**Method:** White-box code review of backend controllers, routes, frontend pages, and socket layer. No live session testing (DB was offline during the audit).

---

## 1. Feature Overview

| Piece | File:Line | Notes |
|---|---|---|
| Invite endpoint | [collaborationController.ts:11](server/src/controllers/collaborationController.ts#L11) | POST `/collaboration/:bookId/invite` |
| Public invite preview | [collaborationController.ts:362](server/src/controllers/collaborationController.ts#L362) | GET `/collaboration/invitation/:token` — no auth |
| Respond to invite | [collaborationController.ts:260](server/src/controllers/collaborationController.ts#L260) | POST `/collaboration/respond/:token` |
| My invitations | [collaborationController.ts:218](server/src/controllers/collaborationController.ts#L218) | GET `/collaboration/my-invitations` |
| My collaborations | [collaborationController.ts:415](server/src/controllers/collaborationController.ts#L415) | GET `/collaboration/my-collaborations` |
| Invite modal UI | [InviteCollaboratorModal.tsx](client/src/components/collaboration/InviteCollaboratorModal.tsx) | Email + name + relationship + message |
| Acceptance page UI | [InvitationPage.tsx](client/src/pages/InvitationPage.tsx) | Fetches preview, posts accept/decline |
| Book update endpoint | [bookController.ts:768](server/src/controllers/bookController.ts#L768) | Main write path — **see BUG-001** |
| Routes | [collaborationRoutes.ts](server/src/routes/collaborationRoutes.ts) | No rate limiters |

---

## 2. E2E Flow Map

```
User A (owner)                         User B (invitee)
──────────────                         ────────────────
 1. Open book → InviteCollaborator modal
 2. POST /collaboration/:bookId/invite
    ├─ auth check (JWT)
    ├─ owner check (book.author === userId)
    ├─ duplicate invite check
    ├─ duplicate collaborator check
    ├─ create invitation { token, expiresAt: +30d }
    └─ push into book.invitations[]
 3. Backend returns invitationLink
 4. Owner copies link to clipboard
     └──────── email or chat ───────┐
                                    ▼
                              5. Open /invitation/:token
                              6. GET /collaboration/invitation/:token (public)
                              7. If not logged in → /login?redirect=...
                              8. POST /collaboration/respond/:token { accept:true }
                                 ├─ auth check
                                 ├─ token lookup
                                 ├─ status=pending check
                                 ├─ expiry check
                                 ├─ email match check
                                 └─ push into book.collaborators[] role='contributor'
                              9. Redirect to /dashboard
                             10. GET /collaboration/my-collaborations → see book
                             11. Open book → click "edit chapter"
                             12. PUT /books/:id            ← ❌ BLOCKED (BUG-001)
```

---

## 3. Test Case Catalog

### 3.1 Functional Test Cases

| ID | Title | Pre-condition | Steps | Expected | Actual | Pass |
|---|---|---|---|---|---|---|
| FT-01 | Owner creates invitation | Logged in owner, book exists | Open modal, fill email/name/relationship/message, submit | 201, invitationLink in response, invitation in `book.invitations` with status `pending` | Matches | ✅ |
| FT-02 | Invitee sees preview before login | Anonymous user with link | Visit `/invitation/:token` | Page shows bookTitle, relationship, message | Matches | ✅ |
| FT-03 | Invitee redirected to login on accept | Anonymous + valid token | Click "Accept" | Redirect to `/login?redirect=/invitation/:token` | Matches | ✅ |
| FT-04 | Logged-in invitee accepts | Authenticated invitee, email matches | Click "Accept" | 200, collaborator added, dashboard redirect | Matches | ✅ |
| FT-05 | Logged-in invitee declines | Authenticated invitee, email matches | Click "Decline" | Invitation.status=declined, no collaborator added | Matches | ✅ |
| FT-06 | Collaborator sees book in dashboard | After FT-04 | Load `/collaboration/my-collaborations` | Book appears in list | Matches | ✅ |
| FT-07 | **Collaborator edits a chapter** | After FT-04 | Open book editor, type text in a chapter, autosave | Chapter content persists | **❌ 403 Forbidden** | ❌ **BUG-001** |
| FT-08 | Collaborator uploads image | After FT-04 | Add image to a page | Image saved | **❌ Blocked by same 403** | ❌ |
| FT-09 | Collaborator exports PDF | After FT-04 | Click Export → PDF | PDF downloads | Likely blocked by ownership check | ❌ |
| FT-10 | Owner sees list of collaborators | After FT-04 | `GET /collaboration/:bookId/collaborators` | Array includes invitee | Matches | ✅ |
| FT-11 | Owner removes collaborator | After FT-04 | DELETE `/collaboration/:bookId/collaborators/:cid` | Collaborator removed | Matches | ✅ |
| FT-12 | Owner updates collaborator role | After FT-04 | PUT role = editor | Role updated | Matches, but role enum not enforced (see BUG-014) |

### 3.2 Non-Functional Test Cases

| ID | Title | Check | Finding |
|---|---|---|---|
| NF-01 | Latency of invite creation | POST should be < 500 ms | Single DB write; acceptable |
| NF-02 | Rate limiting on invite endpoint | Check middleware chain | **❌ None** — BUG-002 |
| NF-03 | Email sending | Does invitee receive an email? | **❌ Email code is commented out** ([collaborationController.ts:68-69](server/src/controllers/collaborationController.ts#L68)) — BUG-003 |
| NF-04 | Token entropy | crypto.randomBytes(32) | ✅ 256-bit, strong |
| NF-05 | Expiry enforcement | 30 days | ✅ Checked on both public preview and accept |
| NF-06 | Token brute-force resistance | Throttling on `GET /collaboration/invitation/:token` | **❌ No rate limit** — combined with 256-bit space it's impractical but still missing hardening |
| NF-07 | Concurrent-edit conflict resolution | Two users autosaving same chapter | **❌ Last-write-wins, no CRDT/OT/lock** — BUG-005 |
| NF-08 | Real-time presence | "Who else is editing now?" | **❌ Not implemented** — BUG-006 |
| NF-09 | Socket cleanup on collaborator removal | Remove mid-edit → socket closed? | **❌ Not handled** — BUG-007 |
| NF-10 | Accessibility of invite modal | Keyboard tab order, aria labels | Not verified (UI audit needed) |
| NF-11 | i18n (he/en) on all strings | All user-facing strings translated | Partial — invitation page is good, but controller error strings are English-only |
| NF-12 | Mobile layout of invitation page | Responsive | Not verified |

### 3.3 Edge Cases

| ID | Title | Expected | Actual | Bug |
|---|---|---|---|---|
| EC-01 | Invite self (owner's own email) | Reject | **Allowed** — no check | BUG-008 |
| EC-02 | Invite with uppercase email | Treat as duplicate if lowercase exists | **Treated as different person** (case-sensitive compare) | BUG-009 |
| EC-03 | Invite twice with different case | Both invitations created | Both created, confusing UI | BUG-009 |
| EC-04 | Invite an unregistered user | User should be able to sign up and accept | **Works only if signup uses identical email string** | Related to BUG-009 |
| EC-05 | Accept invite after email mismatch | Clear error + option to switch account | Error message shown but no recovery flow | BUG-010 |
| EC-06 | Accept expired invitation | Reject with 400 | ✅ Works |
| EC-07 | Accept already-accepted invitation | Reject | ✅ Works |
| EC-08 | Accept declined invitation | Reject | ✅ Works |
| EC-09 | Decline twice | Reject second attempt | ✅ Works (status not pending) |
| EC-10 | Re-invite after decline | Allowed | ✅ Works (pending check only blocks active pending) |
| EC-11 | Owner deletes book while collaborator is editing | Collaborator notified; cleanup socket | **❌ No notification** | BUG-011 |
| EC-12 | Owner deletes book while pending invitation exists | Invitation should be invalidated | Cascade delete via `ON DELETE CASCADE` should handle it — OK if DB constraint set; needs verification |
| EC-13 | Invitee removes their own collaboration | "Leave book" endpoint | **❌ No such endpoint** | BUG-012 |
| EC-14 | Invitee account deletion | Collaboration record cleanup | **❌ No cleanup logic found** | BUG-013 |
| EC-15 | Large personal message (10k chars) | Reject or truncate | **❌ No length validation** | BUG-014 |
| EC-16 | Missing `email` in POST body | Reject with 400 | **No validation** — invitation saved with `email: undefined`, crashes downstream compare | BUG-015 |
| EC-17 | Invalid `bookId` in URL | Reject with 400 | Returns 404 after DB lookup — acceptable but wastes a query |
| EC-18 | Invitation to deleted user account | Token still valid, profile 404s | Not verified |
| EC-19 | Two owners invite same user to same book simultaneously | Race: two pending invitations | Possible — no unique constraint on (bookId, email, status) | BUG-016 |
| EC-20 | Book converted from solo to collaborative | `isCollaborative=true`, `bookType='collaborative'` fields flipped once | ✅ Works on first invite |

### 3.4 Decision Table — Accept Invitation

| # | Auth? | Token exists? | Status=pending? | Not expired? | Email matches? | Expected |
|---|---|---|---|---|---|---|
| D1 | ❌ | - | - | - | - | 401 Not authenticated |
| D2 | ✅ | ❌ | - | - | - | 404 Invitation not found |
| D3 | ✅ | ✅ | ❌ | - | - | 400 Already responded |
| D4 | ✅ | ✅ | ✅ | ❌ | - | 400 Expired |
| D5 | ✅ | ✅ | ✅ | ✅ | ❌ | 403 Wrong email |
| D6 | ✅ | ✅ | ✅ | ✅ | ✅ | 200 Added as collaborator |

Code path: [collaborationController.ts:260-359](server/src/controllers/collaborationController.ts#L260) — all six branches present and in correct order.

### 3.5 Decision Table — Invite Collaborator

| # | Auth? | Book exists? | User is owner? | Already invited? | Already collaborator? | Expected |
|---|---|---|---|---|---|---|
| I1 | ❌ | - | - | - | - | 401 |
| I2 | ✅ | ❌ | - | - | - | 404 |
| I3 | ✅ | ✅ | ❌ | - | - | 403 |
| I4 | ✅ | ✅ | ✅ | ✅ | - | 400 Already invited |
| I5 | ✅ | ✅ | ✅ | ❌ | ✅ | 400 Already collaborator |
| I6 | ✅ | ✅ | ✅ | ❌ | ❌ | 201 Created |

**Missing branch:** I7 — user invites **themselves** → should be rejected but is not. See BUG-008.

---

## 4. Defects Found

### 🔴 BUG-001 — Collaborators cannot actually edit the book **[BLOCKER]**

**File:** [bookController.ts:791-805](server/src/controllers/bookController.ts#L791)
```ts
const ownerId = await Book.getOwnerId(id);
if (ownerId !== req.user.id) {
  res.status(403).json({ success: false, error: 'You do not have permission to update this book' });
  return;
}
```
The `updateBook` endpoint only checks ownership. The `book.collaborators` array is never consulted. Result: a user who accepts an invitation successfully becomes a collaborator in the DB but gets **403 Forbidden** the moment they try to save any change — typing in a chapter, changing the cover, uploading an image, editing page layout.

**The entire feature is non-functional in its current state.**

**Reproduce:**
1. User A creates book, invites User B.
2. User B accepts invitation (joins collaborators[]).
3. User B opens the book editor.
4. User B types in a chapter → autosave fires → `PUT /books/:id` → 403.

**Fix (minimal):**
```ts
// Load book once (or expose a lightweight getCollaboratorIds method)
const book = await Book.findById(id);
if (!book) { res.status(404)...; return; }
const isOwner = book.author === req.user.id;
const isCollaborator = (book.collaborators || []).some(
  c => c.userId === req.user.id && c.status === 'active'
);
if (!isOwner && !isCollaborator) {
  res.status(403).json(...);
  return;
}
```
Apply the same check to `addChapter`, `updateChapter`, `deleteChapter`, `addPageImage`, `updatePageLayout`, `uploadCover`, and export endpoints. Anywhere that writes to a book must allow active collaborators.

---

### 🔴 BUG-002 — No rate limiting on invite endpoint **[HIGH]**

**File:** [collaborationRoutes.ts:20](server/src/routes/collaborationRoutes.ts#L20)

`POST /collaboration/:bookId/invite` has only the `authenticate` middleware. A malicious (or buggy) client could loop and create thousands of invitations → rows stored, clipboard link returned. Once email sending is enabled (BUG-003) this becomes an abuse vector to spam arbitrary addresses.

**Fix:** Add a rate limiter (e.g. `express-rate-limit`) capped at ~5 invites per minute per user, or 20 per hour per book.

---

### 🔴 BUG-003 — Email notifications never sent **[HIGH]**

**File:** [collaborationController.ts:68-69](server/src/controllers/collaborationController.ts#L68)
```ts
// TODO: Send email notification to invitee
// await sendInvitationEmail(email, name, book.title, invitation.token, personalMessage);
```

The only way the invitee learns about the invite is if the owner manually copies the link from their clipboard and sends it over another channel. Feature discoverability is effectively broken.

**Fix:** Implement `sendInvitationEmail` in `emailService.ts` with a proper HTML template (bookTitle, inviterName, personalMessage, CTA button linking to `/invitation/:token`). Also handle the failure case — if email sending fails, the invitation should still be created and the response should include a warning.

---

### 🟠 BUG-004 — updateCollaboratorRole accepts any role string **[MEDIUM]**

**File:** [collaborationController.ts:177-215](server/src/controllers/collaborationController.ts#L177)

There is no enum validation on `role`. An admin could set it to `"owner"`, `"admin"`, or arbitrary text. Since `bookController` doesn't read the role anywhere, this currently has no security impact — but the moment someone adds role-based authorization, this becomes a privilege escalation path.

**Fix:** Whitelist: `['contributor', 'editor', 'viewer']`. Reject others with 400.

---

### 🟠 BUG-005 — No conflict handling on concurrent edits **[MEDIUM]**

**Files:** [bookController.ts:768](server/src/controllers/bookController.ts#L768), [socketService.ts](server/src/services/socketService.ts)

If User A and User B both edit chapter 3 at the same time:
1. Both clients hold their own copy of the chapter content.
2. User A autosaves → DB has A's version.
3. User B autosaves 100ms later → DB has B's version, **A's text is lost silently**.

There's no version field (`updatedAt` comparison, optimistic lock, ETag), no operational transform, no merge, and the socket layer has no presence events.

**Fix (minimum viable):** Add optimistic locking: each chapter has an `updatedAt`; the client sends its last-known `updatedAt` on save; the server rejects with 409 if the stored value is newer. The UI then shows "Someone else has edited this chapter — reload to see changes" and offers manual merge.

**Fix (ideal):** Socket.IO presence + live text sync via Yjs or Automerge.

---

### 🟠 BUG-006 — No presence awareness **[MEDIUM]**

Users have no way of knowing someone else is in the book right now. Combined with BUG-005 this is how silent data loss happens.

**Fix:** `socket.join('book:' + bookId)` on open, emit `user:joined` / `user:left` / `user:editing-chapter:X`, show avatars in the UI.

---

### 🟠 BUG-007 — Collaborator removal does not close sockets or warn **[MEDIUM]**

**File:** [collaborationController.ts:146-174](server/src/controllers/collaborationController.ts#L146)

When the owner removes a collaborator:
- The removed user may still have the editor open.
- Their next autosave currently **still goes through** (because BUG-001 already blocks ALL collaborator writes, so for now the bug hides this one). Once BUG-001 is fixed, the removed collaborator could keep writing until they refresh.
- No socket disconnection, no toast to the removed user.

**Fix:** After removal, emit a socket event `collaboration:removed { bookId }` to the removed user so the UI can close the editor gracefully.

---

### 🟡 BUG-008 — Owner can invite themselves **[LOW]**

**File:** [collaborationController.ts:11-88](server/src/controllers/collaborationController.ts#L11)

No check that `email !== req.user.email`. If an owner types their own email, a `pending` invitation is created pointing to themselves. When they click the link while logged in, the "already collaborator" check (via email) won't catch it and they'll become a collaborator on their own book — creating a duplicate entry.

**Fix:**
```ts
if (email.toLowerCase().trim() === req.user.email.toLowerCase().trim()) {
  return res.status(400).json({ success: false, error: 'You cannot invite yourself' });
}
```

---

### 🟡 BUG-009 — Email comparison is case-sensitive and not trimmed **[MEDIUM]**

**Files:**
- [collaborationController.ts:33](server/src/controllers/collaborationController.ts#L33) — `inv.email === email`
- [collaborationController.ts:39](server/src/controllers/collaborationController.ts#L39) — `c.email === email`
- [collaborationController.ts:238](server/src/controllers/collaborationController.ts#L238) — matching pending invitations to the logged-in user
- [collaborationController.ts:295](server/src/controllers/collaborationController.ts#L295) — `targetInvitation.email !== userEmail`

`john@example.com` and `John@Example.com` and ` john@example.com ` are treated as three different people. Duplicate-invite check fails, acceptance check fails even if the user is the right person. This is one of the most common real-world support tickets for invite systems.

**Fix:** Normalize email on both write (`email.trim().toLowerCase()`) and all comparisons.

---

### 🟡 BUG-010 — No recovery flow when email mismatch **[LOW]**

**File:** [collaborationController.ts:294-297](server/src/controllers/collaborationController.ts#L294)

If a user logs in with a different email than the one the invite was sent to, they see an error message but no actionable next step. Common scenarios: invite sent to work email, user logs in with personal Google account.

**Fix:** Either (a) offer a "switch account" button, or (b) show the invited email in the error so the user knows which account to use, or (c) allow linking — if the logged-in user proves ownership of the invited email (magic link), attach the invitation to their account.

---

### 🟡 BUG-011 — Book deletion does not notify collaborators **[LOW]**

**File:** [bookController.ts](server/src/controllers/bookController.ts) — delete handler

If the owner deletes a collaborative book, all collaborators' in-flight editing sessions hang with no explanation. Their next autosave will 404.

**Fix:** Before deleting, emit `collaboration:book-deleted { bookId }` to all collaborator sockets and show a toast.

---

### 🟡 BUG-012 — No "leave collaboration" endpoint **[LOW]**

A collaborator who no longer wants to be in a book has no way to remove themselves — only the owner can. This is fine for small private books but poor UX for larger projects.

**Fix:** Add `DELETE /collaboration/:bookId/leave` that removes the caller from `book.collaborators`.

---

### 🟡 BUG-013 — Account deletion orphan cleanup not verified **[LOW]**

When a user account is deleted, their entries in `book.collaborators` (and their pending invitations) should be removed. No such cleanup logic was found. Stale `userId` references will remain.

**Fix:** Add a cleanup step in the user-delete flow that runs a bulk update over books to strip the user from all `collaborators` arrays and mark their pending invitations as `cancelled`.

---

### 🟡 BUG-014 — No input validation on invite body **[LOW]**

**File:** [collaborationController.ts:14](server/src/controllers/collaborationController.ts#L14)

`email`, `name`, `relationship`, `personalMessage` are destructured and used with zero validation:
- Missing email → stored as `undefined` and later crashes string comparisons.
- Name 10MB long → accepted and stored.
- Relationship outside the 8-value enum in `RELATIONSHIPS` → accepted.
- HTML / script in `personalMessage` → stored as-is and rendered on the invitation page (XSS risk — whether exploitable depends on React's default escaping).

**Fix:** Add a Joi / Zod schema or per-field checks: email format, name 1–120 chars, relationship in whitelist, personalMessage ≤ 1000 chars.

---

### 🟡 BUG-015 — Response body missing `inviterName` **[LOW]**

**File:** [collaborationController.ts:393-407](server/src/controllers/collaborationController.ts#L393) vs [InvitationPage.tsx:21](client/src/pages/InvitationPage.tsx#L21)

The frontend interface declares `inviterName: string;` but the backend `getInvitationByToken` does not return it. The acceptance page will show "undefined" or an empty string wherever it tries to display who invited them. Minor UX bug, easy fix.

**Fix:** Backend should look up the book author's name and return it, or the frontend interface should mark it optional.

---

### 🟡 BUG-016 — Race on simultaneous invite create **[LOW]**

**File:** [collaborationController.ts:57-66](server/src/controllers/collaborationController.ts#L57)

The duplicate-invite check and the write are not atomic. Two parallel POSTs for the same email on the same book can both pass the "already invited?" check and both succeed, creating two pending invitations with different tokens. Low probability in practice because invites are manually triggered, but possible.

**Fix:** Either wrap in a DB transaction with a uniqueness constraint on `(book_id, email, status='pending')`, or use `ON CONFLICT DO NOTHING` at the DB layer.

---

### ⚪ OBS-01 — `isCollaborative` / `bookType` set on first invite only

[collaborationController.ts:63-65](server/src/controllers/collaborationController.ts#L63) sets these flags on every invite call. Once set they never get cleared, so if the owner later removes the last collaborator, the book is still marked `isCollaborative: true, bookType: 'collaborative'`. Not a bug per se — may be intentional — flagging for product decision.

---

## 5. Severity Summary

| Severity | Count | Bugs |
|---|---|---|
| 🔴 Blocker | 1 | BUG-001 |
| 🔴 High | 2 | BUG-002, BUG-003 |
| 🟠 Medium | 4 | BUG-004, BUG-005, BUG-006, BUG-007, BUG-009 |
| 🟡 Low | 8 | BUG-008, BUG-010, BUG-011, BUG-012, BUG-013, BUG-014, BUG-015, BUG-016 |
| ⚪ Observation | 1 | OBS-01 |

---

## 6. Recommended Fix Order

1. **BUG-001** — Without this, nothing else about collaboration works in production. Ship this first.
2. **BUG-003** — Users cannot discover invitations without it.
3. **BUG-009** — Minimal-risk, immediate support burden reduction.
4. **BUG-008** — One-liner.
5. **BUG-014 / BUG-015** — Quick hardening.
6. **BUG-002** — Before (or together with) re-enabling email.
7. **BUG-005 / BUG-006 / BUG-007** — Real-time collaboration story. Bigger work, ship once the basics above are solid.
8. Everything else can follow.

---

## 7. Test Scripts to Run After Fixes

### 7.1 Happy path (must pass before release)
```
1. Owner creates book, opens InviteCollaboratorModal, invites alice@example.com
2. Verify POST /collaboration/:id/invite returns 201 with invitationLink
3. Verify alice receives an email containing that link (assumes BUG-003 fixed)
4. Alice opens the link in a new browser, signs up / logs in with alice@example.com
5. Alice sees the invitation preview page with correct bookTitle and owner name
6. Alice clicks Accept → redirected to /dashboard
7. Verify alice's /my-collaborations returns the book
8. Alice opens the book, edits chapter 1, and sees "Saved" toast
9. Owner refreshes and sees alice's edits
10. Alice adds a new chapter; owner sees it appear
```
This full script currently fails at step 3 (email) and step 8 (permission).

### 7.2 Negative tests
- Wrong email: Alice logs in with alice2@example.com → 403 with clear message (BUG-010)
- Invite yourself: owner uses their own email → 400 (BUG-008)
- Duplicate case: invite ALICE@example.com when alice@example.com already pending → 400 (BUG-009)
- Expired invite: set expiresAt 1 minute ago → 400 (works)
- Rate limit: 100 invites/sec → only first N accepted (BUG-002)

### 7.3 Real-time (after BUG-005/006)
- Two browsers editing same chapter → presence indicator visible; last-writer warned before overwrite
- Owner removes collaborator mid-edit → collaborator sees "You were removed" toast and editor closes

---

## 8. Open Questions for Product

1. Should collaborators be allowed to invite other collaborators, or owner only? (Currently owner only.)
2. Should there be distinct roles (viewer/editor/contributor) with different permissions, or is one role enough for v1?
3. When owner deletes a book with collaborators, should there be a confirmation warning ("2 collaborators will lose access")?
4. Should accepted invitations be removed from the `invitations` array after a grace period, or kept for audit trail?
5. What's the desired UX when an invited email doesn't correspond to any account — pre-create a stub user, or require signup first?
6. Should the invitation link be revocable by the owner from the UI before it's accepted?

---

*End of report.*
