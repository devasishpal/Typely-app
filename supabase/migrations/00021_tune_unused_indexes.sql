-- Unused-index tuning (conservative).
-- Keep strategic/new indexes (especially leaderboard and FK-related), and only
-- remove clearly redundant indexes based on current query patterns.

-- statistics(user_id, date) already has a UNIQUE index from table definition,
-- so a standalone date index is redundant for current reads.
DROP INDEX IF EXISTS public.idx_statistics_date;

-- typing_results currently uses UPSERT on UNIQUE(user_id, client_result_id),
-- and does not have read paths requiring standalone user_id/created_at indexes.
DROP INDEX IF EXISTS public.idx_typing_results_user_id;
DROP INDEX IF EXISTS public.idx_typing_results_created_at;

-- typing_tests queries are user-scoped and ordered by created_at.
-- Replace standalone created_at index with a query-aligned composite index.
CREATE INDEX IF NOT EXISTS idx_typing_tests_user_created_at
  ON public.typing_tests (user_id, created_at DESC);

DROP INDEX IF EXISTS public.idx_typing_tests_created_at;
