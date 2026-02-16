-- Optional auth support: store merged guest results per authenticated user.
CREATE TABLE IF NOT EXISTS public.typing_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_result_id text NOT NULL,
  wpm integer NOT NULL CHECK (wpm >= 0),
  accuracy numeric(5,2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
  mistakes integer NOT NULL DEFAULT 0 CHECK (mistakes >= 0),
  duration integer NOT NULL CHECK (duration > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  inserted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_result_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_results_user_id ON public.typing_results(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_results_created_at ON public.typing_results(created_at DESC);

ALTER TABLE public.typing_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "typing_results_select_own" ON public.typing_results;
CREATE POLICY "typing_results_select_own" ON public.typing_results
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "typing_results_insert_own" ON public.typing_results;
CREATE POLICY "typing_results_insert_own" ON public.typing_results
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "typing_results_update_own" ON public.typing_results;
CREATE POLICY "typing_results_update_own" ON public.typing_results
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow guest mode users (anon role) to fetch practice/test content before login.
DROP POLICY IF EXISTS "practice_tests_select" ON public.practice_tests;
DROP POLICY IF EXISTS "practice_tests_select_public" ON public.practice_tests;
CREATE POLICY "practice_tests_select_public" ON public.practice_tests
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "test_paragraphs_select" ON public.test_paragraphs;
DROP POLICY IF EXISTS "test_paragraphs_select_public" ON public.test_paragraphs;
DROP POLICY IF EXISTS "Anyone can read test paragraphs" ON public.test_paragraphs;
CREATE POLICY "test_paragraphs_select_public" ON public.test_paragraphs
  FOR SELECT TO public
  USING (true);
