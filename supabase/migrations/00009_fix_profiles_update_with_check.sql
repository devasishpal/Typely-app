-- Tighten profiles update policy to avoid permissive WITH CHECK (true)

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
    and role is not distinct from (
      select p.role
      from public.profiles p
      where p.id = (select auth.uid())
    )
  )
);
