-- Supabase linter fixes:
-- 0003_auth_rls_initplan: wrap auth.uid() in SELECT for policy predicates
-- 0006_multiple_permissive_policies: avoid overlapping permissive SELECT policies

-- certificate_templates
DROP POLICY IF EXISTS "certificate_templates_select_active_public" ON public.certificate_templates;
CREATE POLICY "certificate_templates_select_active_public" ON public.certificate_templates
  FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "certificate_templates_manage_admin" ON public.certificate_templates;
DROP POLICY IF EXISTS "certificate_templates_select_admin" ON public.certificate_templates;
DROP POLICY IF EXISTS "certificate_templates_insert_admin" ON public.certificate_templates;
DROP POLICY IF EXISTS "certificate_templates_update_admin" ON public.certificate_templates;
DROP POLICY IF EXISTS "certificate_templates_delete_admin" ON public.certificate_templates;

CREATE POLICY "certificate_templates_select_admin" ON public.certificate_templates
  FOR SELECT TO authenticated
  USING (public.is_admin((select auth.uid())));

CREATE POLICY "certificate_templates_insert_admin" ON public.certificate_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin((select auth.uid())));

CREATE POLICY "certificate_templates_update_admin" ON public.certificate_templates
  FOR UPDATE TO authenticated
  USING (public.is_admin((select auth.uid())))
  WITH CHECK (public.is_admin((select auth.uid())));

CREATE POLICY "certificate_templates_delete_admin" ON public.certificate_templates
  FOR DELETE TO authenticated
  USING (public.is_admin((select auth.uid())));

-- certificate_rules
DROP POLICY IF EXISTS "certificate_rules_select_admin" ON public.certificate_rules;
DROP POLICY IF EXISTS "certificate_rules_manage_admin" ON public.certificate_rules;
DROP POLICY IF EXISTS "certificate_rules_insert_admin" ON public.certificate_rules;
DROP POLICY IF EXISTS "certificate_rules_update_admin" ON public.certificate_rules;
DROP POLICY IF EXISTS "certificate_rules_delete_admin" ON public.certificate_rules;

CREATE POLICY "certificate_rules_select_admin" ON public.certificate_rules
  FOR SELECT TO authenticated
  USING (public.is_admin((select auth.uid())));

CREATE POLICY "certificate_rules_insert_admin" ON public.certificate_rules
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin((select auth.uid())));

CREATE POLICY "certificate_rules_update_admin" ON public.certificate_rules
  FOR UPDATE TO authenticated
  USING (public.is_admin((select auth.uid())))
  WITH CHECK (public.is_admin((select auth.uid())));

CREATE POLICY "certificate_rules_delete_admin" ON public.certificate_rules
  FOR DELETE TO authenticated
  USING (public.is_admin((select auth.uid())));

-- user_certificates
DROP POLICY IF EXISTS "user_certificates_select_own" ON public.user_certificates;
DROP POLICY IF EXISTS "user_certificates_select_admin" ON public.user_certificates;
DROP POLICY IF EXISTS "user_certificates_select_own_or_admin" ON public.user_certificates;

CREATE POLICY "user_certificates_select_own_or_admin" ON public.user_certificates
  FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR public.is_admin((select auth.uid()))
  );

DROP POLICY IF EXISTS "user_certificates_update_admin" ON public.user_certificates;
CREATE POLICY "user_certificates_update_admin" ON public.user_certificates
  FOR UPDATE TO authenticated
  USING (public.is_admin((select auth.uid())))
  WITH CHECK (public.is_admin((select auth.uid())));
