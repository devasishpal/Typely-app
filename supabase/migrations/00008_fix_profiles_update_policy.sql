-- Fix infinite recursion in profiles update policy

drop policy if exists "profiles_update" on public.profiles;

create policy "profiles_update" on public.profiles
for update to authenticated
using ((select auth.uid()) = id or is_admin((select auth.uid())))
with check (true);
