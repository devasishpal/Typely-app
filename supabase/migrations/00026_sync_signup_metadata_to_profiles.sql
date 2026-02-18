-- Keep profile fields in sync with signup metadata captured in auth.users.
-- This ensures full_name (and other signup fields) are available in admin views.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count int;
  user_email text;
  user_username text;
  user_full_name text;
  user_date_of_birth_text text;
  user_date_of_birth date;
  user_phone text;
  user_country text;
begin
  select count(*) into user_count from public.profiles;

  user_email := nullif(trim(coalesce(new.raw_user_meta_data->>'email', '')), '');
  if user_email is null or user_email like '%@miaoda.com' then
    user_email := null;
  end if;

  user_username := nullif(trim(coalesce(new.raw_user_meta_data->>'username', '')), '');
  user_full_name := nullif(
    trim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')),
    ''
  );
  user_date_of_birth_text := nullif(trim(coalesce(new.raw_user_meta_data->>'date_of_birth', '')), '');
  user_phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  user_country := nullif(trim(coalesce(new.raw_user_meta_data->>'country', '')), '');

  if user_date_of_birth_text ~ '^\d{4}-\d{2}-\d{2}$' then
    user_date_of_birth := user_date_of_birth_text::date;
  else
    user_date_of_birth := null;
  end if;

  insert into public.profiles (id, email, username, full_name, date_of_birth, phone, country, role)
  values (
    new.id,
    coalesce(user_email, new.email),
    coalesce(user_username, split_part(new.email, '@', 1)),
    user_full_name,
    user_date_of_birth,
    user_phone,
    user_country,
    case when user_count = 0 then 'admin'::public.user_role else 'user'::public.user_role end
  )
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(excluded.username, public.profiles.username),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    date_of_birth = coalesce(excluded.date_of_birth, public.profiles.date_of_birth),
    phone = coalesce(excluded.phone, public.profiles.phone),
    country = coalesce(excluded.country, public.profiles.country),
    updated_at = now();

  return new;
end;
$$;

with metadata as (
  select
    u.id,
    nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')), '') as full_name,
    case
      when nullif(trim(coalesce(u.raw_user_meta_data->>'date_of_birth', '')), '') ~ '^\d{4}-\d{2}-\d{2}$'
        then (u.raw_user_meta_data->>'date_of_birth')::date
      else null
    end as date_of_birth,
    nullif(trim(coalesce(u.raw_user_meta_data->>'phone', '')), '') as phone,
    nullif(trim(coalesce(u.raw_user_meta_data->>'country', '')), '') as country
  from auth.users u
)
update public.profiles p
set
  full_name = coalesce(nullif(trim(p.full_name), ''), metadata.full_name),
  date_of_birth = coalesce(p.date_of_birth, metadata.date_of_birth),
  phone = coalesce(nullif(trim(p.phone), ''), metadata.phone),
  country = coalesce(nullif(trim(p.country), ''), metadata.country),
  updated_at = now()
from metadata
where p.id = metadata.id
  and (
    ((p.full_name is null or trim(p.full_name) = '') and metadata.full_name is not null)
    or (p.date_of_birth is null and metadata.date_of_birth is not null)
    or ((p.phone is null or trim(p.phone) = '') and metadata.phone is not null)
    or ((p.country is null or trim(p.country) = '') and metadata.country is not null)
  );
