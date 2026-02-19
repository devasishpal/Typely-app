-- Add SEO-friendly slugs for lessons while keeping UUID as internal primary key.

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION public.normalize_lesson_slug(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  normalized text;
BEGIN
  normalized := lower(COALESCE(input, ''));
  normalized := regexp_replace(normalized, '[^a-z0-9\s-]', '', 'g');
  normalized := regexp_replace(normalized, '\s+', '-', 'g');
  normalized := regexp_replace(normalized, '-{2,}', '-', 'g');
  normalized := regexp_replace(normalized, '^-+|-+$', '', 'g');
  RETURN normalized;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_unique_lesson_slug(base_input text, lesson_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text := public.normalize_lesson_slug(base_input);
  candidate text;
  suffix integer := 0;
BEGIN
  IF COALESCE(base_slug, '') = '' THEN
    base_slug := 'lesson';
  END IF;

  candidate := base_slug;

  WHILE EXISTS (
    SELECT 1
    FROM public.lessons l
    WHERE l.slug = candidate
      AND (lesson_id IS NULL OR l.id <> lesson_id)
  ) LOOP
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix::text;
  END LOOP;

  RETURN candidate;
END;
$$;

DO $$
DECLARE
  lesson_row record;
BEGIN
  FOR lesson_row IN
    SELECT l.id, l.title
    FROM public.lessons l
    ORDER BY l.created_at, l.id
  LOOP
    UPDATE public.lessons
    SET slug = public.generate_unique_lesson_slug(lesson_row.title, lesson_row.id)
    WHERE id = lesson_row.id;
  END LOOP;
END;
$$;

ALTER TABLE public.lessons
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lessons_slug_unique
  ON public.lessons (slug);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lessons_slug_format_check'
      AND conrelid = 'public.lessons'::regclass
  ) THEN
    ALTER TABLE public.lessons
      ADD CONSTRAINT lessons_slug_format_check
      CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.lessons_assign_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.slug := public.generate_unique_lesson_slug(
    CASE
      WHEN NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN NEW.title
      ELSE NEW.slug
    END,
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lessons_assign_slug ON public.lessons;

CREATE TRIGGER trg_lessons_assign_slug
BEFORE INSERT OR UPDATE OF title, slug ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.lessons_assign_slug();
