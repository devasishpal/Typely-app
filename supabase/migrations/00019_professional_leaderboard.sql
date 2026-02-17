-- Professional leaderboard hardening: auth-only rankings, anti-cheat filters,
-- best-per-user ranking functions, and period-based leaderboard snapshots.

ALTER TABLE public.leaderboard_scores
  ADD COLUMN IF NOT EXISTS mistakes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS test_mode text NOT NULL DEFAULT 'timed';

UPDATE public.leaderboard_scores
SET test_mode = CASE
  WHEN lower(coalesce(source, '')) = 'practice' THEN 'practice'
  WHEN lower(coalesce(source, '')) = 'custom' THEN 'custom'
  ELSE 'timed'
END
WHERE test_mode IS NULL OR lower(test_mode) NOT IN ('practice', 'timed', 'custom');

UPDATE public.leaderboard_scores
SET test_mode = lower(test_mode)
WHERE test_mode IS NOT NULL;

-- Remove legacy guest and invalid rows before tightening constraints.
DELETE FROM public.leaderboard_scores
WHERE user_id IS NULL
   OR wpm > 300
   OR accuracy < 85;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leaderboard_scores_user_id_fkey'
  ) THEN
    ALTER TABLE public.leaderboard_scores
      DROP CONSTRAINT leaderboard_scores_user_id_fkey;
  END IF;
END $$;

ALTER TABLE public.leaderboard_scores
  ADD CONSTRAINT leaderboard_scores_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.leaderboard_scores
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN mistakes SET NOT NULL,
  ALTER COLUMN test_mode SET NOT NULL,
  ALTER COLUMN test_mode SET DEFAULT 'timed';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leaderboard_scores_wpm_max_300'
  ) THEN
    ALTER TABLE public.leaderboard_scores
      ADD CONSTRAINT leaderboard_scores_wpm_max_300 CHECK (wpm <= 300);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leaderboard_scores_accuracy_min_85'
  ) THEN
    ALTER TABLE public.leaderboard_scores
      ADD CONSTRAINT leaderboard_scores_accuracy_min_85 CHECK (accuracy >= 85);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leaderboard_scores_mistakes_non_negative'
  ) THEN
    ALTER TABLE public.leaderboard_scores
      ADD CONSTRAINT leaderboard_scores_mistakes_non_negative CHECK (mistakes >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leaderboard_scores_test_mode_valid'
  ) THEN
    ALTER TABLE public.leaderboard_scores
      ADD CONSTRAINT leaderboard_scores_test_mode_valid
      CHECK (test_mode IN ('practice', 'timed', 'custom'));
  END IF;
END $$;

ALTER TABLE public.leaderboard_scores
  ADD COLUMN IF NOT EXISTS net_wpm numeric(8,2)
  GENERATED ALWAYS AS (round((wpm::numeric * accuracy) / 100, 2)) STORED;

CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_net_rank
  ON public.leaderboard_scores (net_wpm DESC, accuracy DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_user_best
  ON public.leaderboard_scores (user_id, net_wpm DESC, accuracy DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_scores_period
  ON public.leaderboard_scores (created_at DESC, test_mode);

-- Remove public guest access and enforce authenticated scoreboard usage.
DROP POLICY IF EXISTS "leaderboard_scores_select_public" ON public.leaderboard_scores;
DROP POLICY IF EXISTS "leaderboard_scores_select_authenticated" ON public.leaderboard_scores;
CREATE POLICY "leaderboard_scores_select_authenticated" ON public.leaderboard_scores
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "leaderboard_scores_insert_anon" ON public.leaderboard_scores;
DROP POLICY IF EXISTS "leaderboard_scores_insert_authenticated" ON public.leaderboard_scores;
CREATE POLICY "leaderboard_scores_insert_authenticated" ON public.leaderboard_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND wpm <= 300
    AND accuracy >= 85
    AND test_mode IN ('practice', 'timed', 'custom')
  );

DROP POLICY IF EXISTS "leaderboard_scores_update_own" ON public.leaderboard_scores;
CREATE POLICY "leaderboard_scores_update_own" ON public.leaderboard_scores
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "leaderboard_scores_delete_own" ON public.leaderboard_scores;
CREATE POLICY "leaderboard_scores_delete_own" ON public.leaderboard_scores
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_suspicious_leaderboard_score(
  p_wpm integer,
  p_accuracy numeric,
  p_mistakes integer,
  p_duration integer
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    p_wpm > 300
    OR p_accuracy < 85
    OR p_mistakes < 0
    OR p_duration < 15
    OR p_mistakes > (p_duration * 12)
    OR (p_wpm >= 220 AND p_accuracy >= 99.5 AND p_mistakes = 0)
    OR (p_wpm >= 260 AND p_accuracy >= 98);
$$;

CREATE OR REPLACE FUNCTION public.leaderboard_period_start(p_period text)
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
  SELECT CASE lower(coalesce(p_period, 'global'))
    WHEN 'daily' THEN now() - interval '1 day'
    WHEN 'weekly' THEN now() - interval '7 days'
    WHEN 'monthly' THEN now() - interval '30 days'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_leaderboard_rankings(
  p_period text DEFAULT 'global',
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  rank integer,
  user_id uuid,
  username text,
  net_wpm numeric(8,2),
  wpm integer,
  accuracy numeric(5,2),
  mistakes integer,
  test_mode text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  WITH bounds AS (
    SELECT public.leaderboard_period_start(p_period) AS start_at
  ),
  eligible AS (
    SELECT
      ls.user_id,
      COALESCE(NULLIF(trim(p.username), ''), NULLIF(trim(ls.nickname), ''), 'Member') AS username,
      ls.net_wpm,
      ls.wpm,
      ls.accuracy,
      ls.mistakes,
      ls.test_mode,
      ls.created_at,
      ls.duration
    FROM public.leaderboard_scores ls
    LEFT JOIN public.profiles p ON p.id = ls.user_id
    CROSS JOIN bounds b
    WHERE ls.user_id IS NOT NULL
      AND ls.wpm <= 300
      AND ls.accuracy >= 85
      AND ls.accuracy <= 100
      AND ls.test_mode IN ('practice', 'timed', 'custom')
      AND (b.start_at IS NULL OR ls.created_at >= b.start_at)
      AND NOT public.is_suspicious_leaderboard_score(ls.wpm, ls.accuracy, ls.mistakes, ls.duration)
  ),
  best_per_user AS (
    SELECT
      e.*,
      row_number() OVER (
        PARTITION BY e.user_id
        ORDER BY e.net_wpm DESC, e.accuracy DESC, e.created_at DESC
      ) AS best_row
    FROM eligible e
  ),
  ranked AS (
    SELECT
      row_number() OVER (ORDER BY bpu.net_wpm DESC, bpu.accuracy DESC, bpu.created_at DESC, bpu.user_id)::integer AS rank,
      bpu.user_id,
      bpu.username,
      bpu.net_wpm::numeric(8,2) AS net_wpm,
      bpu.wpm,
      bpu.accuracy::numeric(5,2) AS accuracy,
      bpu.mistakes,
      bpu.test_mode,
      bpu.created_at
    FROM best_per_user bpu
    WHERE bpu.best_row = 1
  )
  SELECT
    r.rank,
    r.user_id,
    r.username,
    r.net_wpm,
    r.wpm,
    r.accuracy,
    r.mistakes,
    r.test_mode,
    r.created_at
  FROM ranked r
  ORDER BY r.rank ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 100);
$$;

CREATE OR REPLACE FUNCTION public.get_leaderboard_personal_stats(
  p_period text DEFAULT 'global'
)
RETURNS TABLE (
  global_rank integer,
  best_net_wpm numeric(8,2),
  accuracy numeric(5,2),
  percentile numeric(5,2)
)
LANGUAGE sql
STABLE
AS $$
  WITH bounds AS (
    SELECT public.leaderboard_period_start(p_period) AS start_at
  ),
  eligible AS (
    SELECT
      ls.user_id,
      ls.net_wpm,
      ls.accuracy,
      ls.created_at,
      ls.wpm,
      ls.mistakes,
      ls.duration
    FROM public.leaderboard_scores ls
    CROSS JOIN bounds b
    WHERE ls.user_id IS NOT NULL
      AND ls.wpm <= 300
      AND ls.accuracy >= 85
      AND ls.accuracy <= 100
      AND ls.test_mode IN ('practice', 'timed', 'custom')
      AND (b.start_at IS NULL OR ls.created_at >= b.start_at)
      AND NOT public.is_suspicious_leaderboard_score(ls.wpm, ls.accuracy, ls.mistakes, ls.duration)
  ),
  best_per_user AS (
    SELECT
      e.*,
      row_number() OVER (
        PARTITION BY e.user_id
        ORDER BY e.net_wpm DESC, e.accuracy DESC, e.created_at DESC
      ) AS best_row
    FROM eligible e
  ),
  ranked AS (
    SELECT
      row_number() OVER (ORDER BY bpu.net_wpm DESC, bpu.accuracy DESC, bpu.created_at DESC, bpu.user_id)::integer AS global_rank,
      bpu.user_id,
      bpu.net_wpm::numeric(8,2) AS best_net_wpm,
      bpu.accuracy::numeric(5,2) AS accuracy
    FROM best_per_user bpu
    WHERE bpu.best_row = 1
  ),
  totals AS (
    SELECT count(*)::integer AS total_players FROM ranked
  )
  SELECT
    r.global_rank,
    r.best_net_wpm,
    r.accuracy,
    CASE
      WHEN t.total_players <= 1 THEN 100.00::numeric(5,2)
      ELSE round((((t.total_players - r.global_rank)::numeric) / (t.total_players - 1)) * 100, 2)::numeric(5,2)
    END AS percentile
  FROM ranked r
  CROSS JOIN totals t
  WHERE r.user_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_leaderboard_rankings(text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard_personal_stats(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_rankings(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_personal_stats(text) TO authenticated;
