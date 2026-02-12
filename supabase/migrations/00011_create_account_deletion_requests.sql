create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  source text not null default 'app',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_account_deletion_requests_user_id
  on public.account_deletion_requests(user_id);

create unique index if not exists idx_account_deletion_requests_active_unique
  on public.account_deletion_requests(user_id)
  where status in ('pending', 'processing');

alter table public.account_deletion_requests enable row level security;

drop policy if exists "account_deletion_requests_select_own_or_admin" on public.account_deletion_requests;
create policy "account_deletion_requests_select_own_or_admin" on public.account_deletion_requests
for select to authenticated
using ((select auth.uid()) = user_id or is_admin((select auth.uid())));

drop policy if exists "account_deletion_requests_insert_own" on public.account_deletion_requests;
create policy "account_deletion_requests_insert_own" on public.account_deletion_requests
for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'pending');

drop policy if exists "account_deletion_requests_update_admin" on public.account_deletion_requests;
create policy "account_deletion_requests_update_admin" on public.account_deletion_requests
for update to authenticated
using (is_admin((select auth.uid())))
with check (is_admin((select auth.uid())));

drop policy if exists "account_deletion_requests_delete_admin" on public.account_deletion_requests;
create policy "account_deletion_requests_delete_admin" on public.account_deletion_requests
for delete to authenticated
using (is_admin((select auth.uid())));
