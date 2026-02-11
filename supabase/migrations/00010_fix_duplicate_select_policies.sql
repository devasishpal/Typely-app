-- Remove duplicate permissive SELECT policies for authenticated users.
-- Keep public-read behavior by scoping "public" policies to anon only.

-- categories
drop policy if exists "categories_select_public" on public.categories;
drop policy if exists "categories_select_anon" on public.categories;

create policy "categories_select_anon" on public.categories
for select to anon
using (true);

-- practice_tests
drop policy if exists "practice_tests_select_public" on public.practice_tests;
drop policy if exists "practice_tests_select_anon" on public.practice_tests;

create policy "practice_tests_select_anon" on public.practice_tests
for select to anon
using (true);

-- site_settings
drop policy if exists "site_settings_select_public" on public.site_settings;
drop policy if exists "site_settings_select_anon" on public.site_settings;

create policy "site_settings_select_anon" on public.site_settings
for select to anon
using (true);
