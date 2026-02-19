-- Add missing certificate template text blocks used by the template builder and PDF renderer.

ALTER TABLE public.certificate_templates
  ADD COLUMN IF NOT EXISTS subtitle_text text,
  ADD COLUMN IF NOT EXISTS body_text text;

UPDATE public.certificate_templates
SET subtitle_text = 'This certificate is proudly presented to'
WHERE coalesce(trim(subtitle_text), '') = '';

UPDATE public.certificate_templates
SET body_text = 'For successfully completing the Typely Typing Speed Test'
WHERE coalesce(trim(body_text), '') = '';

ALTER TABLE public.certificate_templates
  ALTER COLUMN subtitle_text SET DEFAULT 'This certificate is proudly presented to',
  ALTER COLUMN body_text SET DEFAULT 'For successfully completing the Typely Typing Speed Test';

ALTER TABLE public.certificate_templates
  ALTER COLUMN subtitle_text SET NOT NULL,
  ALTER COLUMN body_text SET NOT NULL;
