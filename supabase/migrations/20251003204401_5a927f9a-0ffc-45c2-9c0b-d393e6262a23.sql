-- Create public storage bucket for post media
insert into storage.buckets (id, name, public) values ('post-media', 'post-media', true)
on conflict (id) do nothing;

-- Drop existing policies if they exist
drop policy if exists "Public read for post media" on storage.objects;
drop policy if exists "Users can upload to their post-media folder" on storage.objects;
drop policy if exists "Users can modify their own post-media files" on storage.objects;
drop policy if exists "Users can delete their own post-media files" on storage.objects;

-- Allow public read on post-media bucket
create policy "Public read for post media"
  on storage.objects for select
  using (bucket_id = 'post-media');

-- Allow authenticated users to upload to their own folder: {userId}/...
create policy "Users can upload to their post-media folder"
  on storage.objects for insert
  with check (
    bucket_id = 'post-media'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

-- Allow authenticated users to update files they own
create policy "Users can modify their own post-media files"
  on storage.objects for update
  using (
    bucket_id = 'post-media'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );

-- Allow authenticated users to delete files they own
create policy "Users can delete their own post-media files"
  on storage.objects for delete
  using (
    bucket_id = 'post-media'
    and (auth.uid()::text = (storage.foldername(name))[1])
  );