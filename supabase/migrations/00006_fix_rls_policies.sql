-- Fix RLS policy initplan warnings and consolidate permissive policies

-- Profiles
DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = id OR is_admin((select auth.uid())));

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id OR is_admin((select auth.uid())))
  WITH CHECK (
    CASE
      WHEN is_admin((select auth.uid())) THEN true
      ELSE role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = (select auth.uid()))
    END
  );

CREATE POLICY "profiles_insert_admin" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));

-- Lessons
DROP POLICY IF EXISTS "Anyone can view lessons" ON public.lessons;
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;

CREATE POLICY "lessons_select" ON public.lessons
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "lessons_insert_admin" ON public.lessons
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "lessons_update_admin" ON public.lessons
  FOR UPDATE TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "lessons_delete_admin" ON public.lessons
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));

-- Lesson progress
DROP POLICY IF EXISTS "Users can view their own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.lesson_progress;

CREATE POLICY "lesson_progress_select" ON public.lesson_progress
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR is_admin((select auth.uid())));

CREATE POLICY "lesson_progress_insert" ON public.lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "lesson_progress_update" ON public.lesson_progress
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Typing sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.typing_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.typing_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.typing_sessions;

CREATE POLICY "typing_sessions_select" ON public.typing_sessions
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR is_admin((select auth.uid())));

CREATE POLICY "typing_sessions_insert" ON public.typing_sessions
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Typing tests
DROP POLICY IF EXISTS "Users can view their own tests" ON public.typing_tests;
DROP POLICY IF EXISTS "Users can insert their own tests" ON public.typing_tests;
DROP POLICY IF EXISTS "Admins can view all tests" ON public.typing_tests;

CREATE POLICY "typing_tests_select" ON public.typing_tests
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR is_admin((select auth.uid())));

CREATE POLICY "typing_tests_insert" ON public.typing_tests
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Achievements
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
DROP POLICY IF EXISTS "Admins can manage achievements" ON public.achievements;

CREATE POLICY "achievements_select" ON public.achievements
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "achievements_insert_admin" ON public.achievements
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "achievements_update_admin" ON public.achievements
  FOR UPDATE TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "achievements_delete_admin" ON public.achievements
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));

-- User achievements
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Admins can view all user achievements" ON public.user_achievements;

CREATE POLICY "user_achievements_select" ON public.user_achievements
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR is_admin((select auth.uid())));

CREATE POLICY "user_achievements_insert" ON public.user_achievements
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Statistics
DROP POLICY IF EXISTS "Users can view their own statistics" ON public.statistics;
DROP POLICY IF EXISTS "Users can manage their own statistics" ON public.statistics;
DROP POLICY IF EXISTS "Admins can view all statistics" ON public.statistics;

CREATE POLICY "statistics_select" ON public.statistics
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR is_admin((select auth.uid())));

CREATE POLICY "statistics_insert" ON public.statistics
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "statistics_update" ON public.statistics
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "statistics_delete" ON public.statistics
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

-- Test paragraphs
DROP POLICY IF EXISTS "Anyone can read test paragraphs" ON public.test_paragraphs;
DROP POLICY IF EXISTS "Admins can manage test paragraphs" ON public.test_paragraphs;

CREATE POLICY "test_paragraphs_select" ON public.test_paragraphs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "test_paragraphs_insert_admin" ON public.test_paragraphs
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "test_paragraphs_update_admin" ON public.test_paragraphs
  FOR UPDATE TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "test_paragraphs_delete_admin" ON public.test_paragraphs
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));

-- Site settings
DROP POLICY IF EXISTS "site_settings_insert_admins" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_update_admins" ON public.site_settings;

CREATE POLICY "site_settings_select" ON public.site_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "site_settings_insert_admin" ON public.site_settings
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "site_settings_update_admin" ON public.site_settings
  FOR UPDATE TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

-- Categories
DROP POLICY IF EXISTS "categories_insert_admins" ON public.categories;
DROP POLICY IF EXISTS "categories_update_admins" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_admins" ON public.categories;

CREATE POLICY "categories_select" ON public.categories
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "categories_insert_admin" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "categories_update_admin" ON public.categories
  FOR UPDATE TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "categories_delete_admin" ON public.categories
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));

-- Practice tests
DROP POLICY IF EXISTS "practice_tests_insert_admins" ON public.practice_tests;
DROP POLICY IF EXISTS "practice_tests_update_admins" ON public.practice_tests;
DROP POLICY IF EXISTS "practice_tests_delete_admins" ON public.practice_tests;

CREATE POLICY "practice_tests_select" ON public.practice_tests
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "practice_tests_insert_admin" ON public.practice_tests
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "practice_tests_update_admin" ON public.practice_tests
  FOR UPDATE TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

CREATE POLICY "practice_tests_delete_admin" ON public.practice_tests
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));

-- Admin notifications
DROP POLICY IF EXISTS "admin_notifications_select_admins" ON public.admin_notifications;
DROP POLICY IF EXISTS "admin_notifications_delete_admins" ON public.admin_notifications;
DROP POLICY IF EXISTS "admin_notifications_insert_all" ON public.admin_notifications;

CREATE POLICY "admin_notifications_select_admin" ON public.admin_notifications
  FOR SELECT TO authenticated
  USING (is_admin((select auth.uid())));

CREATE POLICY "admin_notifications_insert" ON public.admin_notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin((select auth.uid()))
    OR (select auth.uid()) = actor_user_id
  );

CREATE POLICY "admin_notifications_delete_admin" ON public.admin_notifications
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));
