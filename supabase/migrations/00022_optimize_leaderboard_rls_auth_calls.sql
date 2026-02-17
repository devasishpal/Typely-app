-- Supabase linter fix (0003_auth_rls_initplan):
-- Wrap auth.uid() in SELECT for RLS policies to avoid per-row re-evaluation.

DROP POLICY IF EXISTS "leaderboard_scores_insert_authenticated" ON public.leaderboard_scores;
CREATE POLICY "leaderboard_scores_insert_authenticated" ON public.leaderboard_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id
    AND wpm <= 300
    AND accuracy >= 85
    AND test_mode IN ('practice', 'timed', 'custom')
  );

DROP POLICY IF EXISTS "leaderboard_scores_update_own" ON public.leaderboard_scores;
CREATE POLICY "leaderboard_scores_update_own" ON public.leaderboard_scores
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "leaderboard_scores_delete_own" ON public.leaderboard_scores;
CREATE POLICY "leaderboard_scores_delete_own" ON public.leaderboard_scores
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
