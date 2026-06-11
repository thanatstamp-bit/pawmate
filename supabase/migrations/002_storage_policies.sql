-- Storage policies for the pet-photos bucket.
-- Run this in Supabase Dashboard → SQL Editor AFTER creating the bucket.
--
-- The bucket was created via the dashboard as public (anyone can read).
-- These policies allow authenticated users to upload and delete their own photos.

create policy "authenticated users can upload pet photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'pet-photos');

-- Users can only delete files inside their own folder (first path segment = their uid)
create policy "users can delete their own pet photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'pet-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
