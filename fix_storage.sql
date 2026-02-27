-- --------------------------------------------------------
-- STORAGE POLICIES FIX FOR product-images BUCKET
-- Run this in the Supabase SQL Editor to allow image uploads
-- --------------------------------------------------------

-- 1. Make sure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public inserts (uploads) to the product-images bucket
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- 3. Allow public updates to existing images
CREATE POLICY "Allow public updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

-- 4. Allow public deletes of images
CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');

-- 5. Allow public reading of images (already handled by bucket being public, but good measure)
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');
