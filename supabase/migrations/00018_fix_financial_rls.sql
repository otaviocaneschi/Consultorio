-- =============================================================================
-- Migration 00018: Fix financial transactions RLS for shared items
-- =============================================================================
-- The previous RLS allowed the creator (created_by) to see ALL copies of a
-- shared expense, leading to double-counting in their dashboard.
-- Now, they only see it if it's explicitly shared with them, OR if it's
-- unshared and they created it.
-- =============================================================================

DROP POLICY IF EXISTS "financial_transactions_select" ON public.financial_transactions;
CREATE POLICY "financial_transactions_select"
  ON public.financial_transactions
  FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    AND public.has_permission('financial', 'read')
    AND (
      public.is_admin()
      OR public.get_user_role() = 'receptionist'
      OR shared_with_id = auth.uid()
      OR (shared_with_id IS NULL AND created_by = auth.uid())
    )
  );
