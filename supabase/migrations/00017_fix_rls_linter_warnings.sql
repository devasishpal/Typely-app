-- Resolve Supabase linter warnings:
-- 1) auth_rls_initplan: wrap auth.uid() in SELECT for RLS policies
-- 2) multiple_permissive_policies: keep a single permissive SELECT policy

-- typing_results: avoid per-row auth.uid() re-evaluation
drop policy if exists "typing_results_select_own" on public.typing_results;
create policy "typing_results_select_own" on public.typing_results
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "typing_results_insert_own" on public.typing_results;
create policy "typing_results_insert_own" on public.typing_results
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "typing_results_update_own" on public.typing_results;
create policy "typing_results_update_own" on public.typing_results
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- leaderboard_scores: avoid per-row auth.uid() re-evaluation
drop policy if exists "leaderboard_scores_insert_authenticated" on public.leaderboard_scores;
create policy "leaderboard_scores_insert_authenticated" on public.leaderboard_scores
  for insert to authenticated
  with check (user_id is null or (select auth.uid()) = user_id);

drop policy if exists "leaderboard_scores_update_own" on public.leaderboard_scores;
create policy "leaderboard_scores_update_own" on public.leaderboard_scores
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "leaderboard_scores_delete_own" on public.leaderboard_scores;
create policy "leaderboard_scores_delete_own" on public.leaderboard_scores
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- achievements: keep one permissive SELECT policy
drop policy if exists "achievements_select" on public.achievements;
drop policy if exists "achievements_select_public" on public.achievements;
create policy "achievements_select_public" on public.achievements
  for select to public
  using (true);

-- lessons: keep one permissive SELECT policy
drop policy if exists "lessons_select" on public.lessons;
drop policy if exists "lessons_select_public" on public.lessons;
create policy "lessons_select_public" on public.lessons
  for select to public
  using (true);

-- practice_tests: keep one permissive SELECT policy
drop policy if exists "practice_tests_select" on public.practice_tests;
drop policy if exists "practice_tests_select_anon" on public.practice_tests;
drop policy if exists "practice_tests_select_public" on public.practice_tests;
create policy "practice_tests_select_public" on public.practice_tests
  for select to public
  using (true);

