-- Supabase linter fix (0011): set explicit search_path for lesson slug functions.

ALTER FUNCTION public.normalize_lesson_slug(text)
SET search_path = public;

ALTER FUNCTION public.generate_unique_lesson_slug(text, uuid)
SET search_path = public;

ALTER FUNCTION public.lessons_assign_slug()
SET search_path = public;
