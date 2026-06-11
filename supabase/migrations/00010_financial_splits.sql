-- =============================================================================
-- Migration: Add margin to procedures and split to financial transactions
-- Purpose: Support financial splits (50/50, custom margin)
-- =============================================================================

-- Add margin percentage to procedures
ALTER TABLE public.procedures
  ADD COLUMN margin_percentage NUMERIC(5, 2) NOT NULL DEFAULT 100.00
  CHECK (margin_percentage >= 0 AND margin_percentage <= 100);

COMMENT ON COLUMN public.procedures.margin_percentage IS 'Percentage of the procedure price that goes to the professional (margin/split).';

-- Add split info to financial transactions
CREATE TYPE public.split_type AS ENUM ('100_percent', '50_50', 'custom_margin');

ALTER TABLE public.financial_transactions
  ADD COLUMN split_type public.split_type NOT NULL DEFAULT '100_percent',
  ADD COLUMN shared_with_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN split_amount NUMERIC(10, 2);

COMMENT ON COLUMN public.financial_transactions.split_type IS 'How the revenue was split (e.g. 50/50 for shared patients).';
COMMENT ON COLUMN public.financial_transactions.split_amount IS 'The calculated amount that goes to the shared professional or clinic pool.';
