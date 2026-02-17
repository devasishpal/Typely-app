-- Supabase linter fix (0011): set explicit search_path for public functions.

ALTER FUNCTION public.is_suspicious_leaderboard_score(integer, numeric, integer, integer)
SET search_path = public;

ALTER FUNCTION public.leaderboard_period_start(text)
SET search_path = public;

ALTER FUNCTION public.get_leaderboard_rankings(text, integer)
SET search_path = public;

ALTER FUNCTION public.get_leaderboard_personal_stats(text)
SET search_path = public;
