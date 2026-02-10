-- Create avatars storage bucket and policies

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow authenticated users to read avatars
create policy "avatars_select" on storage.objects
for select to authenticated
using (bucket_id = 'avatars');

-- Allow authenticated users to upload to their own folder
create policy "avatars_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (auth.uid())::text = split_part(name, '/', 1)
);

-- Allow authenticated users to update/delete their own avatars
create policy "avatars_update" on storage.objects
for update to authenticated
using (
  bucket_id = 'avatars'
  and (auth.uid())::text = split_part(name, '/', 1)
)
with check (
  bucket_id = 'avatars'
  and (auth.uid())::text = split_part(name, '/', 1)
);

create policy "avatars_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'avatars'
  and (auth.uid())::text = split_part(name, '/', 1)
);
