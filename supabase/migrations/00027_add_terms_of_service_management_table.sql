-- Add structured Terms of Service management to footer CMS.

create table if not exists public.footer_terms_of_service_sections (
  id uuid primary key default gen_random_uuid(),
  section_title text not null default '',
  content text,
  last_updated_date date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  sort_order integer not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists footer_terms_of_service_sections_sort_order_idx
  on public.footer_terms_of_service_sections (sort_order);

create index if not exists footer_terms_of_service_sections_status_idx
  on public.footer_terms_of_service_sections (status);

drop trigger if exists set_footer_terms_of_service_sections_updated_at on public.footer_terms_of_service_sections;
create trigger set_footer_terms_of_service_sections_updated_at
before update on public.footer_terms_of_service_sections
for each row
execute function public.set_footer_row_updated_at();

alter table public.footer_terms_of_service_sections enable row level security;

drop policy if exists "footer_terms_of_service_sections_select" on public.footer_terms_of_service_sections;
create policy "footer_terms_of_service_sections_select" on public.footer_terms_of_service_sections
  for select to authenticated
  using (true);

drop policy if exists "footer_terms_of_service_sections_select_anon" on public.footer_terms_of_service_sections;
create policy "footer_terms_of_service_sections_select_anon" on public.footer_terms_of_service_sections
  for select to anon
  using (is_deleted = false and status = 'active');

drop policy if exists "footer_terms_of_service_sections_insert_admin" on public.footer_terms_of_service_sections;
create policy "footer_terms_of_service_sections_insert_admin" on public.footer_terms_of_service_sections
  for insert to authenticated
  with check (is_admin((select auth.uid())));

drop policy if exists "footer_terms_of_service_sections_update_admin" on public.footer_terms_of_service_sections;
create policy "footer_terms_of_service_sections_update_admin" on public.footer_terms_of_service_sections
  for update to authenticated
  using (is_admin((select auth.uid())))
  with check (is_admin((select auth.uid())));

drop policy if exists "footer_terms_of_service_sections_delete_admin" on public.footer_terms_of_service_sections;
create policy "footer_terms_of_service_sections_delete_admin" on public.footer_terms_of_service_sections
  for delete to authenticated
  using (is_admin((select auth.uid())));

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'footer_content_versions'
  ) then
    alter table public.footer_content_versions
      drop constraint if exists footer_content_versions_tab_key_check;

    alter table public.footer_content_versions
      add constraint footer_content_versions_tab_key_check check (
        tab_key in (
          'support_center',
          'faq',
          'about',
          'blog',
          'careers',
          'privacy_policy',
          'terms_of_service'
        )
      );
  end if;
end $$;
