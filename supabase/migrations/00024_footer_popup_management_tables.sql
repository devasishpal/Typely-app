-- Structured footer content management tables for admin popup-based CMS.

CREATE TABLE IF NOT EXISTS public.footer_support_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  short_description text,
  icon_url text,
  content text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  sort_order integer NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS footer_support_sections_sort_order_idx
  ON public.footer_support_sections (sort_order);

CREATE INDEX IF NOT EXISTS footer_support_sections_status_idx
  ON public.footer_support_sections (status);

CREATE TABLE IF NOT EXISTS public.footer_faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL DEFAULT '',
  answer text NOT NULL DEFAULT '',
  category text,
  order_number integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  sort_order integer NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS footer_faq_items_sort_order_idx
  ON public.footer_faq_items (sort_order);

CREATE INDEX IF NOT EXISTS footer_faq_items_status_idx
  ON public.footer_faq_items (status);

CREATE TABLE IF NOT EXISTS public.footer_about_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_title text NOT NULL DEFAULT '',
  subtitle text,
  content text,
  image_url text,
  highlight_text text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  sort_order integer NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS footer_about_sections_sort_order_idx
  ON public.footer_about_sections (sort_order);

CREATE INDEX IF NOT EXISTS footer_about_sections_status_idx
  ON public.footer_about_sections (status);

CREATE TABLE IF NOT EXISTS public.footer_careers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title text NOT NULL DEFAULT '',
  location text,
  job_type text,
  description text,
  requirements text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  sort_order integer NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS footer_careers_sort_order_idx
  ON public.footer_careers (sort_order);

CREATE INDEX IF NOT EXISTS footer_careers_status_idx
  ON public.footer_careers (status);

CREATE TABLE IF NOT EXISTS public.footer_privacy_policy_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_title text NOT NULL DEFAULT '',
  content text,
  last_updated_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  sort_order integer NOT NULL DEFAULT 0,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS footer_privacy_policy_sections_sort_order_idx
  ON public.footer_privacy_policy_sections (sort_order);

CREATE INDEX IF NOT EXISTS footer_privacy_policy_sections_status_idx
  ON public.footer_privacy_policy_sections (status);

CREATE TABLE IF NOT EXISTS public.footer_content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_key text NOT NULL CHECK (
    tab_key IN (
      'support_center',
      'faq',
      'about',
      'blog',
      'careers',
      'privacy_policy'
    )
  ),
  item_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore')),
  snapshot jsonb NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS footer_content_versions_tab_item_idx
  ON public.footer_content_versions (tab_key, item_id, created_at DESC);

ALTER TABLE public.footer_blog_posts
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE INDEX IF NOT EXISTS footer_blog_posts_slug_idx
  ON public.footer_blog_posts (slug);

CREATE INDEX IF NOT EXISTS footer_blog_posts_visible_idx
  ON public.footer_blog_posts (is_deleted, is_published, is_draft, sort_order);

CREATE OR REPLACE FUNCTION public.set_footer_row_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_footer_support_sections_updated_at ON public.footer_support_sections;
CREATE TRIGGER set_footer_support_sections_updated_at
BEFORE UPDATE ON public.footer_support_sections
FOR EACH ROW
EXECUTE FUNCTION public.set_footer_row_updated_at();

DROP TRIGGER IF EXISTS set_footer_faq_items_updated_at ON public.footer_faq_items;
CREATE TRIGGER set_footer_faq_items_updated_at
BEFORE UPDATE ON public.footer_faq_items
FOR EACH ROW
EXECUTE FUNCTION public.set_footer_row_updated_at();

DROP TRIGGER IF EXISTS set_footer_about_sections_updated_at ON public.footer_about_sections;
CREATE TRIGGER set_footer_about_sections_updated_at
BEFORE UPDATE ON public.footer_about_sections
FOR EACH ROW
EXECUTE FUNCTION public.set_footer_row_updated_at();

DROP TRIGGER IF EXISTS set_footer_careers_updated_at ON public.footer_careers;
CREATE TRIGGER set_footer_careers_updated_at
BEFORE UPDATE ON public.footer_careers
FOR EACH ROW
EXECUTE FUNCTION public.set_footer_row_updated_at();

DROP TRIGGER IF EXISTS set_footer_privacy_policy_sections_updated_at ON public.footer_privacy_policy_sections;
CREATE TRIGGER set_footer_privacy_policy_sections_updated_at
BEFORE UPDATE ON public.footer_privacy_policy_sections
FOR EACH ROW
EXECUTE FUNCTION public.set_footer_row_updated_at();

DROP TRIGGER IF EXISTS set_footer_blog_posts_updated_at ON public.footer_blog_posts;
CREATE TRIGGER set_footer_blog_posts_updated_at
BEFORE UPDATE ON public.footer_blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.set_footer_row_updated_at();

ALTER TABLE public.footer_support_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_about_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_careers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_privacy_policy_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "footer_support_sections_select" ON public.footer_support_sections;
CREATE POLICY "footer_support_sections_select" ON public.footer_support_sections
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "footer_support_sections_select_anon" ON public.footer_support_sections;
CREATE POLICY "footer_support_sections_select_anon" ON public.footer_support_sections
  FOR SELECT TO anon
  USING (is_deleted = false AND status = 'active');

DROP POLICY IF EXISTS "footer_support_sections_insert_admin" ON public.footer_support_sections;
CREATE POLICY "footer_support_sections_insert_admin" ON public.footer_support_sections
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_support_sections_update_admin" ON public.footer_support_sections;
CREATE POLICY "footer_support_sections_update_admin" ON public.footer_support_sections
  FOR UPDATE TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_support_sections_delete_admin" ON public.footer_support_sections;
CREATE POLICY "footer_support_sections_delete_admin" ON public.footer_support_sections
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_faq_items_select" ON public.footer_faq_items;
CREATE POLICY "footer_faq_items_select" ON public.footer_faq_items
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "footer_faq_items_select_anon" ON public.footer_faq_items;
CREATE POLICY "footer_faq_items_select_anon" ON public.footer_faq_items
  FOR SELECT TO anon
  USING (is_deleted = false AND status = 'active');

DROP POLICY IF EXISTS "footer_faq_items_insert_admin" ON public.footer_faq_items;
CREATE POLICY "footer_faq_items_insert_admin" ON public.footer_faq_items
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_faq_items_update_admin" ON public.footer_faq_items;
CREATE POLICY "footer_faq_items_update_admin" ON public.footer_faq_items
  FOR UPDATE TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_faq_items_delete_admin" ON public.footer_faq_items;
CREATE POLICY "footer_faq_items_delete_admin" ON public.footer_faq_items
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_about_sections_select" ON public.footer_about_sections;
CREATE POLICY "footer_about_sections_select" ON public.footer_about_sections
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "footer_about_sections_select_anon" ON public.footer_about_sections;
CREATE POLICY "footer_about_sections_select_anon" ON public.footer_about_sections
  FOR SELECT TO anon
  USING (is_deleted = false AND status = 'active');

DROP POLICY IF EXISTS "footer_about_sections_insert_admin" ON public.footer_about_sections;
CREATE POLICY "footer_about_sections_insert_admin" ON public.footer_about_sections
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_about_sections_update_admin" ON public.footer_about_sections;
CREATE POLICY "footer_about_sections_update_admin" ON public.footer_about_sections
  FOR UPDATE TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_about_sections_delete_admin" ON public.footer_about_sections;
CREATE POLICY "footer_about_sections_delete_admin" ON public.footer_about_sections
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_careers_select" ON public.footer_careers;
CREATE POLICY "footer_careers_select" ON public.footer_careers
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "footer_careers_select_anon" ON public.footer_careers;
CREATE POLICY "footer_careers_select_anon" ON public.footer_careers
  FOR SELECT TO anon
  USING (is_deleted = false);

DROP POLICY IF EXISTS "footer_careers_insert_admin" ON public.footer_careers;
CREATE POLICY "footer_careers_insert_admin" ON public.footer_careers
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_careers_update_admin" ON public.footer_careers;
CREATE POLICY "footer_careers_update_admin" ON public.footer_careers
  FOR UPDATE TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_careers_delete_admin" ON public.footer_careers;
CREATE POLICY "footer_careers_delete_admin" ON public.footer_careers
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_privacy_policy_sections_select" ON public.footer_privacy_policy_sections;
CREATE POLICY "footer_privacy_policy_sections_select" ON public.footer_privacy_policy_sections
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "footer_privacy_policy_sections_select_anon" ON public.footer_privacy_policy_sections;
CREATE POLICY "footer_privacy_policy_sections_select_anon" ON public.footer_privacy_policy_sections
  FOR SELECT TO anon
  USING (is_deleted = false AND status = 'active');

DROP POLICY IF EXISTS "footer_privacy_policy_sections_insert_admin" ON public.footer_privacy_policy_sections;
CREATE POLICY "footer_privacy_policy_sections_insert_admin" ON public.footer_privacy_policy_sections
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_privacy_policy_sections_update_admin" ON public.footer_privacy_policy_sections;
CREATE POLICY "footer_privacy_policy_sections_update_admin" ON public.footer_privacy_policy_sections
  FOR UPDATE TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_privacy_policy_sections_delete_admin" ON public.footer_privacy_policy_sections;
CREATE POLICY "footer_privacy_policy_sections_delete_admin" ON public.footer_privacy_policy_sections
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_content_versions_select_admin" ON public.footer_content_versions;
CREATE POLICY "footer_content_versions_select_admin" ON public.footer_content_versions
  FOR SELECT TO authenticated
  USING (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_content_versions_insert_admin" ON public.footer_content_versions;
CREATE POLICY "footer_content_versions_insert_admin" ON public.footer_content_versions
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_content_versions_delete_admin" ON public.footer_content_versions;
CREATE POLICY "footer_content_versions_delete_admin" ON public.footer_content_versions
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_blog_posts_select" ON public.footer_blog_posts;
CREATE POLICY "footer_blog_posts_select" ON public.footer_blog_posts
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "footer_blog_posts_select_anon" ON public.footer_blog_posts;
CREATE POLICY "footer_blog_posts_select_anon" ON public.footer_blog_posts
  FOR SELECT TO anon
  USING (is_deleted = false AND is_published = true AND is_draft = false);

DROP POLICY IF EXISTS "footer_blog_posts_insert_admin" ON public.footer_blog_posts;
CREATE POLICY "footer_blog_posts_insert_admin" ON public.footer_blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_blog_posts_update_admin" ON public.footer_blog_posts;
CREATE POLICY "footer_blog_posts_update_admin" ON public.footer_blog_posts
  FOR UPDATE TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "footer_blog_posts_delete_admin" ON public.footer_blog_posts;
CREATE POLICY "footer_blog_posts_delete_admin" ON public.footer_blog_posts
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));
