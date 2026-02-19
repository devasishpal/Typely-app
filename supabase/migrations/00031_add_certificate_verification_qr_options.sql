-- Add configurable verification QR code options to certificate templates.

ALTER TABLE public.certificate_templates
  ADD COLUMN IF NOT EXISTS show_qr_code boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS qr_x_pct numeric(6,2) NOT NULL DEFAULT 86,
  ADD COLUMN IF NOT EXISTS qr_y_pct numeric(6,2) NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS qr_size_pct numeric(6,2) NOT NULL DEFAULT 12;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_qr_x_pct_range_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_qr_x_pct_range_check
      CHECK (qr_x_pct >= 0 AND qr_x_pct <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_qr_y_pct_range_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_qr_y_pct_range_check
      CHECK (qr_y_pct >= 0 AND qr_y_pct <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificate_templates_qr_size_pct_range_check'
      AND conrelid = 'public.certificate_templates'::regclass
  ) THEN
    ALTER TABLE public.certificate_templates
      ADD CONSTRAINT certificate_templates_qr_size_pct_range_check
      CHECK (qr_size_pct >= 4 AND qr_size_pct <= 40);
  END IF;
END;
$$;
