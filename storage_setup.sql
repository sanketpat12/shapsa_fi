-- ============================================================
-- SHOPSA DATABASE SCHEMA — Run this in Supabase SQL Editor
-- Create Storage Bucket for Product Images
-- ============================================================

-- Create a public bucket called 'product-images'
insert into storage.buckets (id, name, public) 
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Set up security policies for the bucket
-- 1. Allow public access to view images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'product-images' );

-- 2. Allow authenticated users to upload images
create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );

-- 3. Allow users to update/delete their own uploads
create policy "Users can update their own images"
  on storage.objects for update
  using ( bucket_id = 'product-images' AND auth.uid() = owner );

create policy "Users can delete their own images"
  on storage.objects for delete
  using ( bucket_id = 'product-images' AND auth.uid() = owner );
