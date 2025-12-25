-- Drop and recreate the status check constraint to include 'publishing'
ALTER TABLE public.social_media_posts 
DROP CONSTRAINT IF EXISTS social_media_posts_status_check;

ALTER TABLE public.social_media_posts 
ADD CONSTRAINT social_media_posts_status_check 
CHECK (status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'publishing'::text, 'published'::text, 'failed'::text, 'rejected'::text]));