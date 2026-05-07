-- =====================================================================
-- Add 'topup' to transaction_plan enum
-- =====================================================================
-- The top-up flow inserts transactions with plan='topup', but the
-- existing enum only accepts 'free' | 'standard' | 'premium' |
-- 'book-purchase'. Without this, /api/payments/topup/create-order
-- returns 502 with "invalid input value for enum transaction_plan".
-- =====================================================================

ALTER TYPE transaction_plan ADD VALUE IF NOT EXISTS 'topup';

-- Verify after running:
--   SELECT enum_range(NULL::transaction_plan);
-- Should include: free, standard, premium, book-purchase, topup
