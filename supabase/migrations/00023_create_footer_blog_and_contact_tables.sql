-- Dedicated storage for footer blog posts and contact information.
-- This keeps blog/contact data structured instead of serializing into site_settings text columns.

CREATE TABLE IF NOT EXISTS public.footer_blog_posts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title text NOT NULL DEFAULT '',
  excerpt text,
  content text,
  image_url text,
  link_url text,
  date_label text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS footer_blog_posts_sort_order_idx
  ON public.footer_blog_posts (sort_order);

CREATE INDEX IF NOT EXISTS footer_blog_posts_updated_at_idx
  ON public.footer_blog_posts (updated_at DESC);

ALTER TABLE public.footer_blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "footer_blog_posts_select" ON public.footer_blog_posts;
CREATE POLICY "footer_blog_posts_select" ON public.footer_blog_posts
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "footer_blog_posts_select_anon" ON public.footer_blog_posts;
CREATE POLICY "footer_blog_posts_select_anon" ON public.footer_blog_posts
  FOR SELECT TO anon
  USING (true);

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

CREATE TABLE IF NOT EXISTS public.site_contact_info (
  key text PRIMARY KEY DEFAULT 'default' CHECK (key = 'default'),
  emails text[] NOT NULL DEFAULT '{}',
  phones text[] NOT NULL DEFAULT '{}',
  address text,
  hours text[] NOT NULL DEFAULT '{}',
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_contact_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_contact_info_select" ON public.site_contact_info;
CREATE POLICY "site_contact_info_select" ON public.site_contact_info
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "site_contact_info_select_anon" ON public.site_contact_info;
CREATE POLICY "site_contact_info_select_anon" ON public.site_contact_info
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "site_contact_info_insert_admin" ON public.site_contact_info;
CREATE POLICY "site_contact_info_insert_admin" ON public.site_contact_info
  FOR INSERT TO authenticated
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "site_contact_info_update_admin" ON public.site_contact_info;
CREATE POLICY "site_contact_info_update_admin" ON public.site_contact_info
  FOR UPDATE TO authenticated
  USING (is_admin((select auth.uid())))
  WITH CHECK (is_admin((select auth.uid())));

DROP POLICY IF EXISTS "site_contact_info_delete_admin" ON public.site_contact_info;
CREATE POLICY "site_contact_info_delete_admin" ON public.site_contact_info
  FOR DELETE TO authenticated
  USING (is_admin((select auth.uid())));
