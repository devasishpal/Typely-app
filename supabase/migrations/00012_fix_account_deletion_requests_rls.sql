-- Make account deletion request RLS explicit and resilient for admin reads/writes.

drop policy if exists "account_deletion_requests_select_own_or_admin" on public.account_deletion_requests;
drop policy if exists "account_deletion_requests_update_admin" on public.account_deletion_requests;
drop policy if exists "account_deletion_requests_delete_admin" on public.account_deletion_requests;

create policy "account_deletion_requests_select_own_or_admin" on public.account_deletion_requests
for select to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

create policy "account_deletion_requests_update_admin" on public.account_deletion_requests
for update to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

create policy "account_deletion_requests_delete_admin" on public.account_deletion_requests
for delete to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);
