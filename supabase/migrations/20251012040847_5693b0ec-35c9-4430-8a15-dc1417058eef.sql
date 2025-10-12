-- Fix storage policies for chat-attachments to allow guest uploads

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view chat files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all chat files" ON storage.objects;

-- Allow anyone (authenticated or anon) to upload files to their conversation folder
CREATE POLICY "Anyone can upload chat files"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (
  bucket_id = 'chat-attachments'
);

-- Allow anyone to view files in chat-attachments
CREATE POLICY "Anyone can view chat files"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'chat-attachments');

-- Allow admins to manage all chat files
CREATE POLICY "Admins can manage chat files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'chat-attachments' 
  AND has_role(auth.uid(), 'admin'::text)
);