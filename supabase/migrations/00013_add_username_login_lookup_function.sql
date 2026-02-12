-- Allow username login by resolving auth email through a controlled function.
-- NOTE: This intentionally returns only one email for an exact username match.

create or replace function public.get_login_email_by_username(p_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_username text;
  resolved_email text;
begin
  normalized_username := lower(trim(coalesce(p_username, '')));

  if normalized_username = '' then
    return null;
  end if;

  select p.email
    into resolved_email
  from public.profiles p
  where lower(p.username) = normalized_username
  limit 1;

  return resolved_email;
end;
$$;

revoke all on function public.get_login_email_by_username(text) from public;
grant execute on function public.get_login_email_by_username(text) to anon, authenticated;
