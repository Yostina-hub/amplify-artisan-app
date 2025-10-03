-- Add media_urls column to social_media_posts table to store media files
ALTER TABLE public.social_media_posts 
ADD COLUMN IF NOT EXISTS media_urls jsonb DEFAULT '[]'::jsonb;

-- Add comment to document the structure
COMMENT ON COLUMN public.social_media_posts.media_urls IS 'Array of media file objects with url, type (image/video), and optional metadata';