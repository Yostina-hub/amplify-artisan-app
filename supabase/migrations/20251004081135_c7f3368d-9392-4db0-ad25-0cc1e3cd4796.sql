-- Allow 'rejected' status for social_media_posts
ALTER TABLE social_media_posts DROP CONSTRAINT IF EXISTS social_media_posts_status_check;

ALTER TABLE social_media_posts 
ADD CONSTRAINT social_media_posts_status_check 
CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'rejected'));