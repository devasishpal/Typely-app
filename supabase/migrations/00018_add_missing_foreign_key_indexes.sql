-- Add missing foreign key indexes reported by Supabase database linter.
-- These improve join/delete/update performance on referenced tables.

create index if not exists idx_typing_sessions_lesson_id
  on public.typing_sessions (lesson_id);

create index if not exists idx_user_achievements_achievement_id
  on public.user_achievements (achievement_id);

