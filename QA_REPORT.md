# MeStory - QA Report
## Payment, Credits, Notifications & Book Publishing System
**Date:** 2026-03-25
**Tester:** Claude QA Agent
**Version:** Current Production

---

## Summary

| Category | Total Bugs | Critical | High | Medium | Low |
|----------|-----------|----------|------|--------|-----|
| Payment/PayPal | 12 | 4 | 4 | 3 | 1 |
| Notifications | 10 | 2 | 3 | 4 | 1 |
| Credit Packages | 5 | 1 | 2 | 2 | 0 |
| Book Publishing | 6 | 1 | 2 | 2 | 1 |
| E2E Flows | 8 | 3 | 3 | 2 | 0 |
| **Total** | **41** | **11** | **14** | **13** | **3** |

---

## 1. Payment System (PayPal) Bugs

### BUG-PAY-001 [CRITICAL]
**Title:** Real PayPal Integration Not Implemented
**File:** `server/src/services/paypalService.ts` (lines 204-242)
**Type:** Functionality

| Expected Result | Actual Result |
|-----------------|---------------|
| When user completes PayPal payment in production, system captures payment and completes transaction | Returns HTTP 501 "Not Implemented" - real PayPal capture endpoint is stubbed |

**Steps to Reproduce:**
1. Set `NODE_ENV=production`
2. Attempt to purchase a book or subscription
3. Complete PayPal payment flow

**Evidence:**
```typescript
// Line 389-392 in paypalService.ts
if (!isMockEnabled) {
  throw new Error('Real PayPal integration not yet implemented');
}
```

---

### BUG-PAY-002 [CRITICAL]
**Title:** No PayPal Webhook Handler
**File:** Missing endpoint
**Type:** Missing Feature

| Expected Result | Actual Result |
|-----------------|---------------|
| System receives PayPal IPN (Instant Payment Notifications) and updates transaction status automatically | No webhook endpoint exists - payment status never updates from PayPal side |

**Impact:**
- Failed payments not detected
- Refunds not synced
- Chargebacks not handled

---

### BUG-PAY-003 [CRITICAL]
**Title:** Non-Atomic Transaction Updates
**File:** `server/src/controllers/paymentController.ts` (lines 220-301)
**Type:** Data Integrity

| Expected Result | Actual Result |
|-----------------|---------------|
| All payment operations succeed or fail together (ACID) | Manual try-catch rollback used - partial failures possible |

**Example Scenario:**
1. User pays for subscription
2. Transaction created successfully
3. User credit update fails
4. Manual rollback attempted but may fail
5. Result: User charged but no credits received

---

### BUG-PAY-004 [CRITICAL]
**Title:** No Idempotency Keys on Payment Endpoints
**File:** `server/src/routes/paymentRoutes.ts`
**Type:** Duplicate Payments

| Expected Result | Actual Result |
|-----------------|---------------|
| Duplicate POST requests return same result without double-charging | No idempotency check - network retries cause double charges |

**Steps to Reproduce:**
1. Start payment request
2. Network timeout occurs
3. Client retries automatically
4. User charged twice

---

### BUG-PAY-005 [HIGH]
**Title:** No Rate Limiting on Book Purchase Endpoints
**File:** `server/src/routes/bookPurchaseRoutes.ts`
**Type:** Security

| Expected Result | Actual Result |
|-----------------|---------------|
| Rate limiting prevents payment spam attacks | No rate limiter on book purchase routes (unlike payment routes) |

**Comparison:**
- `paymentRoutes.ts` uses `apiLimiter` ✓
- `bookPurchaseRoutes.ts` has no limiter ✗

---

### BUG-PAY-006 [HIGH]
**Title:** PayPal Account Not Verified Before Payout
**File:** `server/src/services/paypalService.ts` (line 681)
**Type:** Security/Fraud

| Expected Result | Actual Result |
|-----------------|---------------|
| PayPal email verified before sending payouts | `isVerified: false` flag set but never validated - payouts sent to unverified emails |

---

### BUG-PAY-007 [HIGH]
**Title:** No Payout Limits or Fraud Detection
**File:** `server/src/services/paypalService.ts` (line 494)
**Type:** Security

| Expected Result | Actual Result |
|-----------------|---------------|
| System limits max payout amount and flags unusual patterns | Only checks $10 minimum - no maximum or velocity checks |

---

### BUG-PAY-008 [HIGH]
**Title:** Revenue Tracking Inconsistency
**File:** Multiple files
**Type:** Data Integrity

| Expected Result | Actual Result |
|-----------------|---------------|
| Single source of truth for revenue data | Two separate tracking systems: Book.statistics.revenue AND User.profile.earnings - no reconciliation |

---

### BUG-PAY-009 [MEDIUM]
**Title:** Pending Transactions Never Expire
**File:** `server/src/models/Transaction.ts`
**Type:** Data Cleanup

| Expected Result | Actual Result |
|-----------------|---------------|
| Abandoned payment sessions cleaned up after timeout (e.g., 30 min) | No cleanup mechanism - pending transactions accumulate forever |

---

### BUG-PAY-010 [MEDIUM]
**Title:** No Refund System
**File:** Missing implementation
**Type:** Missing Feature

| Expected Result | Actual Result |
|-----------------|---------------|
| Admin can process refunds, users can request refunds | Transaction model has 'refunded' status but no refund endpoints exist |

---

### BUG-PAY-011 [MEDIUM]
**Title:** No Tax/VAT Calculation
**File:** Missing implementation
**Type:** Compliance

| Expected Result | Actual Result |
|-----------------|---------------|
| Tax calculated based on user location | No tax calculation - may violate regulations in EU, Israel, etc. |

---

### BUG-PAY-012 [LOW]
**Title:** Mock Mode Enabled Silently
**File:** `server/src/services/paypalService.ts` (lines 110-111)
**Type:** Configuration

| Expected Result | Actual Result |
|-----------------|---------------|
| Missing PayPal credentials logged as error | Falls back to mock mode silently - no admin alert |

---

## 2. Notification System Bugs

### BUG-NOTIF-001 [CRITICAL]
**Title:** No Real-Time Notifications
**File:** Missing WebSocket implementation
**Type:** Missing Feature

| Expected Result | Actual Result |
|-----------------|---------------|
| Users receive notifications instantly via WebSocket/Socket.io | Must refresh page to see new notifications - no real-time delivery |

---

### BUG-NOTIF-002 [CRITICAL]
**Title:** No Push Notifications
**File:** Missing service worker
**Type:** Missing Feature

| Expected Result | Actual Result |
|-----------------|---------------|
| Users receive browser push notifications even when app closed | No Web Push API, no service worker, no permission handling |

---

### BUG-NOTIF-003 [HIGH]
**Title:** Payment Reminders Not Implemented
**File:** Missing cron jobs
**Type:** Missing Feature

| Expected Result | Actual Result |
|-----------------|---------------|
| System sends reminders: subscription expiry (7d, 1d before), low credits, payout threshold reached | No scheduled tasks - no reminders ever sent |

---

### BUG-NOTIF-004 [HIGH]
**Title:** Notification Types Never Triggered
**File:** `server/src/services/notificationService.ts`
**Type:** Dead Code

| Expected Result | Actual Result |
|-----------------|---------------|
| All notification types functional | `new_follower`, `mention`, `promotion` types defined but functions never called |

---

### BUG-NOTIF-005 [HIGH]
**Title:** No Unread Badge in UI
**File:** `client/src/components/` (navbar area)
**Type:** UI/UX

| Expected Result | Actual Result |
|-----------------|---------------|
| Navbar shows notification bell with unread count badge | No badge visible - user must open modal to see count |

---

### BUG-NOTIF-006 [MEDIUM]
**Title:** Quality Score Notifications Hebrew Only
**File:** `server/src/services/notificationService.ts` (lines 314-315)
**Type:** i18n

| Expected Result | Actual Result |
|-----------------|---------------|
| Quality score notifications in user's language | Hardcoded Hebrew: `ציון איכות לספר שלך: ${score}/100` |

---

### BUG-NOTIF-007 [MEDIUM]
**Title:** No Notification Preferences
**File:** Missing implementation
**Type:** Missing Feature

| Expected Result | Actual Result |
|-----------------|---------------|
| Users can customize which notifications they receive | No settings - all notifications forced on all users |

---

### BUG-NOTIF-008 [MEDIUM]
**Title:** Archived Notifications Inaccessible
**File:** `client/src/components/notifications/NotificationCenter.tsx`
**Type:** UI/UX

| Expected Result | Actual Result |
|-----------------|---------------|
| Archived notifications viewable in separate tab | Archived notifications completely hidden - no way to retrieve |

---

### BUG-NOTIF-009 [MEDIUM]
**Title:** No Notification Search
**File:** `client/src/components/notifications/NotificationCenter.tsx`
**Type:** UI/UX

| Expected Result | Actual Result |
|-----------------|---------------|
| Users can search notifications by content | Only type filtering available - no text search |

---

### BUG-NOTIF-010 [LOW]
**Title:** No Notification Auto-Cleanup
**File:** `server/src/models/Notification.ts`
**Type:** Performance

| Expected Result | Actual Result |
|-----------------|---------------|
| Old notifications (>90 days) automatically deleted | All notifications stored forever - database bloat |

---

## 3. Credit Packages Bugs

### BUG-CREDIT-001 [CRITICAL]
**Title:** No Subscription Auto-Renewal
**File:** `server/src/controllers/subscriptionController.ts`
**Type:** Missing Feature

| Expected Result | Actual Result |
|-----------------|---------------|
| Subscriptions auto-renew monthly with credit replenishment | `autoRenew` flag exists but no cron job - subscriptions never renew |

**Impact:** Premium users lose access after 30 days even with payment method saved.

---

### BUG-CREDIT-002 [HIGH]
**Title:** No Credit Balance Warnings
**File:** Missing implementation
**Type:** UX

| Expected Result | Actual Result |
|-----------------|---------------|
| Users warned when credits low (e.g., <20%) | No warnings - users discover empty balance mid-task |

---

### BUG-CREDIT-003 [HIGH]
**Title:** Subscription Downgrade Loses Credits
**File:** `server/src/controllers/subscriptionController.ts`
**Type:** Logic Error

| Expected Result | Actual Result |
|-----------------|---------------|
| Downgrade prorates credits or waits for billing cycle | Immediate downgrade - excess credits lost with no refund |

**Example:**
- Premium user has 400/unlimited credits
- Downgrades to Standard (500 limit)
- Credits should remain at 400
- No prorated refund for mid-cycle downgrade

---

### BUG-CREDIT-004 [MEDIUM]
**Title:** No Credit Usage Analytics
**File:** Missing implementation
**Type:** Feature

| Expected Result | Actual Result |
|-----------------|---------------|
| Users can see credit usage history and patterns | No usage dashboard - only current balance shown |

---

### BUG-CREDIT-005 [MEDIUM]
**Title:** Free Plan Credit Reset Not Scheduled
**File:** Missing cron job
**Type:** Missing Feature

| Expected Result | Actual Result |
|-----------------|---------------|
| Free users get 100 credits reset monthly | No scheduled reset - free users get 100 credits once only |

---

## 4. Book Publishing & Store Bugs

### BUG-BOOK-001 [CRITICAL]
**Title:** 50/50 Split Not Verified in Production
**File:** `server/src/services/paypalService.ts`
**Type:** Business Logic

| Expected Result | Actual Result |
|-----------------|---------------|
| Author receives exactly 50% of book sale via PayPal | Mock mode calculates correctly, but real PayPal payout not implemented |

**Configuration exists:**
```
AUTHOR_REVENUE_PERCENTAGE=50
PLATFORM_REVENUE_PERCENTAGE=50
```
But actual PayPal transfer never executes.

---

### BUG-BOOK-002 [HIGH]
**Title:** No Invoice Generation
**File:** Missing implementation
**Type:** Compliance

| Expected Result | Actual Result |
|-----------------|---------------|
| PDF invoice generated for each purchase | No invoice system - required for business customers |

---

### BUG-BOOK-003 [HIGH]
**Title:** No Author Earnings Dashboard
**File:** Missing frontend page
**Type:** Missing Feature

| Expected Result | Actual Result |
|-----------------|---------------|
| Authors can view earnings, sales history, payout status | Backend `getEarnings` endpoint exists but no UI page |

---

### BUG-BOOK-004 [MEDIUM]
**Title:** Published Book Cannot Be Unpublished
**File:** `server/src/controllers/bookController.ts`
**Type:** Missing Feature

| Expected Result | Actual Result |
|-----------------|---------------|
| Authors can unpublish books, handle refunds | No unpublish workflow - books permanent once published |

---

### BUG-BOOK-005 [MEDIUM]
**Title:** No Book Price History
**File:** `server/src/models/Book.ts`
**Type:** Missing Feature

| Expected Result | Actual Result |
|-----------------|---------------|
| Price changes tracked for analytics and disputes | Only current price stored - no history |

---

### BUG-BOOK-006 [LOW]
**Title:** Smart Pricing Strategy Hebrew Only
**File:** `server/src/services/pricingStrategyService.ts`
**Type:** i18n

| Expected Result | Actual Result |
|-----------------|---------------|
| Pricing recommendations in user's language | Hardcoded Hebrew tips and recommendations |

---

## 5. E2E Flow Bugs

### BUG-E2E-001 [CRITICAL]
**Title:** Complete Purchase Flow Fails in Production
**Flow:** User → Select Book → Pay with PayPal → Receive Book

| Expected Result | Actual Result |
|-----------------|---------------|
| User completes purchase and gets immediate access | Flow stops at PayPal capture - 501 error returned |

**Steps:**
1. User browses marketplace ✓
2. User clicks "Buy" on book ✓
3. PayPal order created ✓
4. User completes PayPal payment ✓
5. Capture payment ✗ FAILS
6. Update book access ✗ NEVER REACHED
7. Send notifications ✗ NEVER REACHED

---

### BUG-E2E-002 [CRITICAL]
**Title:** Subscription Upgrade Flow Incomplete
**Flow:** Free User → Upgrade to Premium → Get Credits

| Expected Result | Actual Result |
|-----------------|---------------|
| User pays, receives premium features and credits immediately | Mock mode works, production fails at PayPal capture |

---

### BUG-E2E-003 [CRITICAL]
**Title:** Author Payout Flow Non-Functional
**Flow:** Author Sells Book → Reaches $10 → Requests Payout → Receives Money

| Expected Result | Actual Result |
|-----------------|---------------|
| Author receives PayPal payout when requested | Payout request created but actual PayPal transfer never executes |

---

### BUG-E2E-004 [HIGH]
**Title:** Book Publishing to Store Missing Validation
**Flow:** Author → Write Book → Set Price → Publish to Store

| Expected Result | Actual Result |
|-----------------|---------------|
| System validates book content, price, PayPal account before publishing | No PayPal account verification required - author can publish but never receive payment |

---

### BUG-E2E-005 [HIGH]
**Title:** Notification Flow Delayed
**Flow:** Event Occurs → Notification Created → User Notified

| Expected Result | Actual Result |
|-----------------|---------------|
| User sees notification within seconds | User must refresh page - no real-time delivery |

---

### BUG-E2E-006 [HIGH]
**Title:** Email Notification Unreliable
**Flow:** Payment → Send Email → User Receives

| Expected Result | Actual Result |
|-----------------|---------------|
| Email sent reliably with retry on failure | Fire-and-forget - no retry logic, no delivery tracking |

---

### BUG-E2E-007 [MEDIUM]
**Title:** Reading Progress Not Synced
**Flow:** User Reads on Device A → Switch to Device B → Continue Reading

| Expected Result | Actual Result |
|-----------------|---------------|
| Reading progress synced in real-time | Progress saved on API call only - may lose progress if app crashes |

---

### BUG-E2E-008 [MEDIUM]
**Title:** Refund Flow Non-Existent
**Flow:** User Requests Refund → Admin Reviews → Process Refund → Update Access

| Expected Result | Actual Result |
|-----------------|---------------|
| Complete refund workflow with book access revocation | No refund endpoints - manual database intervention required |

---

## 6. GUI Bugs

### BUG-GUI-001 [HIGH]
**Title:** Payment Modal No Loading State
**File:** Client payment components

| Expected Result | Actual Result |
|-----------------|---------------|
| Loading spinner during payment processing | Button stays clickable - users click multiple times |

---

### BUG-GUI-002 [HIGH]
**Title:** Error Messages Not User-Friendly
**File:** Multiple controllers

| Expected Result | Actual Result |
|-----------------|---------------|
| "Payment failed. Please try again or contact support." | Technical errors exposed: "501 Not Implemented", "PGRST301" |

---

### BUG-GUI-003 [MEDIUM]
**Title:** Price Display Currency Inconsistent
**File:** Client pricing components

| Expected Result | Actual Result |
|-----------------|---------------|
| Consistent currency display (USD or ILS based on locale) | Mixed: some show $25, some show 99 ILS, no conversion |

---

### BUG-GUI-004 [MEDIUM]
**Title:** Marketplace Filter Persistence
**File:** `client/src/pages/MarketplacePage.tsx`

| Expected Result | Actual Result |
|-----------------|---------------|
| Filters persist after page navigation | Filters reset on every visit - poor UX |

---

## 7. Permission/Authorization Bugs

### BUG-AUTH-001 [HIGH]
**Title:** Admin Earnings Access Not Restricted
**File:** `server/src/controllers/bookPurchaseController.ts`

| Expected Result | Actual Result |
|-----------------|---------------|
| Only admins can view all authors' earnings | No admin-only endpoint - each user can only see own earnings (correct) but admin analytics missing |

---

### BUG-AUTH-002 [MEDIUM]
**Title:** Payout Request No Rate Limit
**File:** `server/src/routes/bookPurchaseRoutes.ts`

| Expected Result | Actual Result |
|-----------------|---------------|
| Max 1 payout request per day | No rate limit - users can spam payout requests |

---

## Recommendations

### Immediate Actions (Critical):
1. Implement real PayPal capture/payout flow
2. Add PayPal webhook handler
3. Implement subscription auto-renewal cron job
4. Add idempotency keys to payment endpoints

### Short-Term (High):
1. Add real-time notifications (Socket.io)
2. Create author earnings dashboard UI
3. Implement refund system
4. Add rate limiting to all payment endpoints
5. Create notification badge in navbar

### Medium-Term (Medium):
1. Implement push notifications
2. Add tax calculation
3. Create invoice generation
4. Add notification preferences
5. Implement credit usage analytics

### Long-Term (Low):
1. Add multi-currency support
2. Implement fraud detection
3. Create comprehensive admin analytics dashboard
4. Add notification search and archive viewing

---

## Test Environment

- **Client:** Vercel (me-story-client.vercel.app)
- **Server:** Vercel (me-story-server-7wdx.vercel.app)
- **Database:** Supabase
- **Payment:** PayPal Sandbox (Mock Mode)

---

**Report Generated:** 2026-03-25
**Next Review:** After critical fixes implemented
