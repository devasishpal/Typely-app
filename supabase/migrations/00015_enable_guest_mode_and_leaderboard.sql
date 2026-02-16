-- Guest-first access: public lessons + public leaderboard, while keeping auth checks for writes.

-- Allow guest users to read lessons for frictionless onboarding.
DROP POLICY IF EXISTS "lessons_select_public" ON public.lessons;
CREATE POLICY "lessons_select_public" ON public.lessons
  FOR SELECT TO public
  USING (true);

-- Allow guest users to read achievements metadata.
DROP POLICY IF EXISTS "achievements_select_public" ON public.achievements;
CREATE POLICY "achievements_select_public" ON public.achievements
  FOR SELECT TO public
  USING (true);

-- Public leaderboard table for both guest and authenticated score submissions.
CREATE TABLE IF NOT EXISTS public.leaderboard_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  nickname text NOT NULL CHECK (char_length(trim(nickname)) BETWEEN 3 AND 24),
  wpm integer NOT NULL CHECK (wpm >= 0),
  accuracy numeric(5,2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
  duration integer NOT NULL CHECK (duration > 0),
  source text NOT NULL DEFAULT 'typing-test',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_rank
  ON public.leaderboard_scores (wpm DESC, accuracy DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_user_id
  ON public.leaderboard_scores (user_id);

ALTER TABLE public.leaderboard_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leaderboard_scores_select_public" ON public.leaderboard_scores;
CREATE POLICY "leaderboard_scores_select_public" ON public.leaderboard_scores
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "leaderboard_scores_insert_anon" ON public.leaderboard_scores;
CREATE POLICY "leaderboard_scores_insert_anon" ON public.leaderboard_scores
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "leaderboard_scores_insert_authenticated" ON public.leaderboard_scores;
CREATE POLICY "leaderboard_scores_insert_authenticated" ON public.leaderboard_scores
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "leaderboard_scores_update_own" ON public.leaderboard_scores;
CREATE POLICY "leaderboard_scores_update_own" ON public.leaderboard_scores
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "leaderboard_scores_delete_own" ON public.leaderboard_scores;
CREATE POLICY "leaderboard_scores_delete_own" ON public.leaderboard_scores
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
