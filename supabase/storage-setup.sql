-- Create storage bucket for boat documents
-- Run this in Supabase SQL Editor after creating the schema

-- Create bucket for boat photos and documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('boat-documents', 'boat-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for item photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-photos', 'item-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for delivery photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for boat-documents bucket
-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can upload their own boat documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view boat documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own boat documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own boat documents" ON storage.objects;

CREATE POLICY "Users can upload their own boat documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'boat-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view boat documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'boat-documents');

CREATE POLICY "Users can update their own boat documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'boat-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own boat documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'boat-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Set up storage policies for item-photos bucket
-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can upload their own item photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view item photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own item photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own item photos" ON storage.objects;

CREATE POLICY "Users can upload their own item photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'item-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view item photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'item-photos');

CREATE POLICY "Users can update their own item photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'item-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own item photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'item-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Set up storage policies for delivery-photos bucket
-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can upload their own delivery photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view delivery photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own delivery photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own delivery photos" ON storage.objects;

CREATE POLICY "Users can upload their own delivery photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'delivery-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view delivery photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'delivery-photos');

CREATE POLICY "Users can update their own delivery photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'delivery-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own delivery photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'delivery-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Set up storage policies for profile-pictures bucket
-- Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can view profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view profile pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
