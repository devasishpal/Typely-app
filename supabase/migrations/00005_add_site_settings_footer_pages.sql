CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text,
  logo_url text,
  theme_color text,
  allow_ads boolean DEFAULT false,
  typing_test_times integer[] DEFAULT ARRAY[30, 60, 120],
  support_center text,
  faq text,
  contact_us text,
  about text,
  blog text,
  careers text,
  privacy_policy text,
  terms_of_service text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS typing_test_times integer[] DEFAULT ARRAY[30, 60, 120];

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS support_center text;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS faq text;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS contact_us text;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS about text;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS blog text;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS careers text;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS privacy_policy text;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS terms_of_service text;
