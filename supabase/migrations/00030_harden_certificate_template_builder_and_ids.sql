-- Harden certificate template builder settings and enforce new certificate ID format.

ALTER TABLE public.certificate_templates
  ADD COLUMN IF NOT EXISTS background_storage_path text,
  ADD COLUMN IF NOT EXISTS template_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS name_x_pct numeric(6,2) NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS name_y_pct numeric(6,2) NOT NULL DEFAULT 34,
  ADD COLUMN IF NOT EXISTS wpm_x_pct numeric(6,2) NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS wpm_y_pct numeric(6,2) NOT NULL DEFAULT 56,
  ADD COLUMN IF NOT EXISTS accuracy_x_pct numeric(6,2) NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS accuracy_y_pct numeric(6,2) NOT NULL DEFAULT 62,
  ADD COLUMN IF NOT EXISTS date_x_pct numeric(6,2) NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS date_y_pct numeric(6,2) NOT NULL DEFAULT 74,
  ADD COLUMN IF NOT EXISTS certificate_id_x_pct numeric(6,2) NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS certificate_id_y_pct numeric(6,2) NOT NULL DEFAULT 74,
  ADD COLUMN IF NOT EXISTS font_family text NOT NULL DEFAULT 'Helvetica',
  ADD COLUMN IF NOT EXISTS font_weight text NOT NULL DEFAULT 'bold',
  ADD COLUMN IF NOT EXISTS font_color text NOT NULL DEFAULT '#111827',
  ADD COLUMN IF NOT EXISTS title_font_size integer NOT NULL DEFAULT 48,
  ADD COLUMN IF NOT EXISTS subtitle_font_size integer NOT NULL DEFAULT 22,
  ADD COLUMN IF NOT EXISTS body_font_size integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS name_font_size integer NOT NULL DEFAULT 52,
  ADD COLUMN IF NOT EXISTS wpm_font_size integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS accuracy_font_size integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS date_font_size integer NOT NULL DEFAULT 18,
  ADD COLUMN IF NOT EXISTS certificate_id_font_size integer NOT NULL DEFAULT 18;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_name_x_pct_range_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_name_x_pct_range_check
      CHECK (name_x_pct >= 0 AND name_x_pct <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_name_y_pct_range_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_name_y_pct_range_check
      CHECK (name_y_pct >= 0 AND name_y_pct <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_wpm_x_pct_range_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_wpm_x_pct_range_check
      CHECK (wpm_x_pct >= 0 AND wpm_x_pct <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_wpm_y_pct_range_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_wpm_y_pct_range_check
      CHECK (wpm_y_pct >= 0 AND wpm_y_pct <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_accuracy_x_pct_range_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_accuracy_x_pct_range_check
      CHECK (accuracy_x_pct >= 0 AND accuracy_x_pct <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_accuracy_y_pct_range_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_accuracy_y_pct_range_check
      CHECK (accuracy_y_pct >= 0 AND accuracy_y_pct <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_date_x_pct_range_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_date_x_pct_range_check
      CHECK (date_x_pct >= 0 AND date_x_pct <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_date_y_pct_range_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_date_y_pct_range_check
      CHECK (date_y_pct >= 0 AND date_y_pct <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_certificate_id_x_pct_range_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_certificate_id_x_pct_range_check
      CHECK (certificate_id_x_pct >= 0 AND certificate_id_x_pct <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_certificate_id_y_pct_range_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_certificate_id_y_pct_range_check
      CHECK (certificate_id_y_pct >= 0 AND certificate_id_y_pct <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_font_weight_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_font_weight_check
      CHECK (font_weight IN ('normal', 'medium', 'semibold', 'bold'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_font_color_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_font_color_check
      CHECK (font_color ~ '^#[0-9A-Fa-f]{6}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_title_font_size_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_title_font_size_check
      CHECK (title_font_size >= 8 AND title_font_size <= 180);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_subtitle_font_size_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_subtitle_font_size_check
      CHECK (subtitle_font_size >= 8 AND subtitle_font_size <= 180);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_body_font_size_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_body_font_size_check
      CHECK (body_font_size >= 8 AND body_font_size <= 180);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_name_font_size_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_name_font_size_check
      CHECK (name_font_size >= 8 AND name_font_size <= 180);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_wpm_font_size_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_wpm_font_size_check
      CHECK (wpm_font_size >= 8 AND wpm_font_size <= 180);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_accuracy_font_size_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_accuracy_font_size_check
      CHECK (accuracy_font_size >= 8 AND accuracy_font_size <= 180);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_date_font_size_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_date_font_size_check
      CHECK (date_font_size >= 8 AND date_font_size <= 180);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_certificate_id_font_size_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_certificate_id_font_size_check
      CHECK (certificate_id_font_size >= 8 AND certificate_id_font_size <= 180);
  END IF;
END;
$$;

ALTER TABLE public.user_certificates
  ADD COLUMN IF NOT EXISTS template_version integer NOT NULL DEFAULT 1;

ALTER TABLE public.user_certificates
  DROP CONSTRAINT IF EXISTS user_certificates_code_format_check;

ALTER TABLE public.user_certificates
  ADD CONSTRAINT user_certificates_code_format_check
  CHECK (certificate_code ~ '^TYP-[0-9]{8}-[A-Z0-9]{4}$')
  NOT VALID;

-- Disable active templates that do not have an uploaded background image.
UPDATE public.certificate_templates
SET is_active = false
WHERE coalesce(trim(background_image_url), '') = '';

-- Restrict certificate template uploads to PNG/JPG only.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg']
WHERE id = 'certificate-assets';
