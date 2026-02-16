-- Fix infinite recursion in profiles update RLS policy.
-- Previous policy versions queried public.profiles inside WITH CHECK,
-- which can recurse when evaluating updates on the same table.

drop policy if exists "profiles_update" on public.profiles;

create policy "profiles_update" on public.profiles
for update to authenticated
using (
  (select auth.uid()) = id
  or is_admin((select auth.uid()))
)
with check (
  is_admin((select auth.uid()))
  or (
    (select auth.uid()) = id
    and role = 'user'::public.user_role
  )
);
