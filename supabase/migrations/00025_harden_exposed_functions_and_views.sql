-- Supabase advisor hardening:
-- 1) enforce stable search_path on exposed functions
-- 2) make public view run with invoker privileges

ALTER FUNCTION public.is_admin(uuid)
SET search_path = public;

ALTER FUNCTION public.set_footer_row_updated_at()
SET search_path = public;

ALTER VIEW public.public_profiles
SET (security_invoker = true);
