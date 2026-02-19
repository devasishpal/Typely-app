-- Enterprise certificate system:
-- - certificate templates + eligibility rules
-- - issued certificates with verification metadata
-- - revocation support
-- - storage buckets for PDFs and template assets

CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  background_image_url text,
  title_text text NOT NULL DEFAULT 'Certificate of Typing Excellence',
  show_wpm boolean NOT NULL DEFAULT true,
  show_accuracy boolean NOT NULL DEFAULT true,
  show_date boolean NOT NULL DEFAULT true,
  show_certificate_id boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.certificate_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  minimum_wpm integer NOT NULL CHECK (minimum_wpm >= 0),
  minimum_accuracy integer NOT NULL CHECK (minimum_accuracy >= 0 AND minimum_accuracy <= 100),
  test_type text NOT NULL DEFAULT 'timed',
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_code text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_id uuid NOT NULL REFERENCES public.typing_tests(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.certificate_templates(id) ON DELETE RESTRICT,
  wpm integer NOT NULL CHECK (wpm >= 0),
  accuracy numeric(5,2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
  issued_at timestamptz NOT NULL DEFAULT now(),
  pdf_url text NOT NULL,
  verification_url text NOT NULL,
  is_revoked boolean NOT NULL DEFAULT false,
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificate_templates_single_active
  ON public.certificate_templates ((is_active))
  WHERE is_active = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_certificate_rules_single_enabled
  ON public.certificate_rules ((is_enabled))
  WHERE is_enabled = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_certificates_test_id_unique
  ON public.user_certificates (test_id);

CREATE INDEX IF NOT EXISTS idx_user_certificates_certificate_code
  ON public.user_certificates (certificate_code);

CREATE INDEX IF NOT EXISTS idx_user_certificates_user_id_issued_at
  ON public.user_certificates (user_id, issued_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_certificates_code_format_check'
      AND conrelid = 'public.user_certificates'::regclass
  ) THEN
    ALTER TABLE public.user_certificates
      ADD CONSTRAINT user_certificates_code_format_check
      CHECK (certificate_code ~ '^TYP-[0-9]{4}-[0-9]{6}$');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_certificate_row_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_single_active_certificate_template()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active THEN
    UPDATE public.certificate_templates
    SET is_active = false,
        updated_at = now()
    WHERE id <> NEW.id
      AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_single_enabled_certificate_rule()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_enabled THEN
    UPDATE public.certificate_rules
    SET is_enabled = false,
        updated_at = now()
    WHERE id <> NEW.id
      AND is_enabled = true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_certificate_templates_updated_at ON public.certificate_templates;
CREATE TRIGGER set_certificate_templates_updated_at
BEFORE UPDATE ON public.certificate_templates
FOR EACH ROW
EXECUTE FUNCTION public.set_certificate_row_updated_at();

DROP TRIGGER IF EXISTS set_certificate_rules_updated_at ON public.certificate_rules;
CREATE TRIGGER set_certificate_rules_updated_at
BEFORE UPDATE ON public.certificate_rules
FOR EACH ROW
EXECUTE FUNCTION public.set_certificate_row_updated_at();

DROP TRIGGER IF EXISTS set_user_certificates_updated_at ON public.user_certificates;
CREATE TRIGGER set_user_certificates_updated_at
BEFORE UPDATE ON public.user_certificates
FOR EACH ROW
EXECUTE FUNCTION public.set_certificate_row_updated_at();

DROP TRIGGER IF EXISTS enforce_single_active_certificate_template ON public.certificate_templates;
CREATE TRIGGER enforce_single_active_certificate_template
BEFORE INSERT OR UPDATE OF is_active ON public.certificate_templates
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_active_certificate_template();

DROP TRIGGER IF EXISTS enforce_single_enabled_certificate_rule ON public.certificate_rules;
CREATE TRIGGER enforce_single_enabled_certificate_rule
BEFORE INSERT OR UPDATE OF is_enabled ON public.certificate_rules
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_enabled_certificate_rule();

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "certificate_templates_select_active_public" ON public.certificate_templates;
CREATE POLICY "certificate_templates_select_active_public" ON public.certificate_templates
  FOR SELECT TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "certificate_templates_manage_admin" ON public.certificate_templates;
CREATE POLICY "certificate_templates_manage_admin" ON public.certificate_templates
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "certificate_rules_select_admin" ON public.certificate_rules;
CREATE POLICY "certificate_rules_select_admin" ON public.certificate_rules
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "certificate_rules_manage_admin" ON public.certificate_rules;
CREATE POLICY "certificate_rules_manage_admin" ON public.certificate_rules
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "user_certificates_select_own" ON public.user_certificates;
CREATE POLICY "user_certificates_select_own" ON public.user_certificates
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_certificates_select_admin" ON public.user_certificates;
CREATE POLICY "user_certificates_select_admin" ON public.user_certificates
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "user_certificates_update_admin" ON public.user_certificates;
CREATE POLICY "user_certificates_update_admin" ON public.user_certificates
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.certificate_templates (
  name,
  background_image_url,
  title_text,
  show_wpm,
  show_accuracy,
  show_date,
  show_certificate_id,
  is_active
)
SELECT
  'Default Typely Certificate',
  null,
  'Certificate of Typing Excellence',
  true,
  true,
  true,
  true,
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.certificate_templates
);

INSERT INTO public.certificate_rules (
  minimum_wpm,
  minimum_accuracy,
  test_type,
  is_enabled
)
SELECT
  45,
  90,
  'timed',
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.certificate_rules
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificate-assets',
  'certificate-assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "certificates_select_owner_or_admin" ON storage.objects;
CREATE POLICY "certificates_select_owner_or_admin" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'certificates'
    AND (
      public.is_admin(auth.uid())
      OR split_part(name, '/', 1) = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "certificates_manage_admin" ON storage.objects;
CREATE POLICY "certificates_manage_admin" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'certificates'
    AND public.is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'certificates'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "certificate_assets_select_public" ON storage.objects;
CREATE POLICY "certificate_assets_select_public" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'certificate-assets');

DROP POLICY IF EXISTS "certificate_assets_insert_admin" ON storage.objects;
CREATE POLICY "certificate_assets_insert_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'certificate-assets'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "certificate_assets_update_admin" ON storage.objects;
CREATE POLICY "certificate_assets_update_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'certificate-assets'
    AND public.is_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'certificate-assets'
    AND public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "certificate_assets_delete_admin" ON storage.objects;
CREATE POLICY "certificate_assets_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'certificate-assets'
    AND public.is_admin(auth.uid())
  );

CREATE OR REPLACE FUNCTION public.get_top_certificate_earners(p_limit integer DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  username text,
  full_name text,
  certificate_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH guard AS (
    SELECT (public.is_admin(auth.uid()) OR auth.role() = 'service_role') AS allowed
  )
  SELECT
    ranked.user_id,
    ranked.username,
    ranked.full_name,
    ranked.certificate_count
  FROM (
    SELECT
      uc.user_id,
      COALESCE(NULLIF(trim(p.username), ''), 'Member') AS username,
      NULLIF(trim(p.full_name), '') AS full_name,
      count(*)::bigint AS certificate_count,
      max(uc.issued_at) AS last_issued_at
    FROM public.user_certificates uc
    LEFT JOIN public.profiles p ON p.id = uc.user_id
    GROUP BY uc.user_id, p.username, p.full_name
  ) AS ranked
  CROSS JOIN guard g
  WHERE g.allowed
  ORDER BY ranked.certificate_count DESC, ranked.last_issued_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 100);
$$;

REVOKE EXECUTE ON FUNCTION public.get_top_certificate_earners(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_top_certificate_earners(integer) TO authenticated;
