-- Add comprehensive social media metrics to posts table
ALTER TABLE public.social_media_posts 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS saves INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS video_watch_time_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reach INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS metrics_last_synced_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_posts_engagement ON public.social_media_posts(engagement_rate DESC);
CREATE INDEX IF NOT EXISTS idx_posts_views ON public.social_media_posts(views DESC);
CREATE INDEX IF NOT EXISTS idx_posts_metrics_synced ON public.social_media_posts(metrics_last_synced_at);
CREATE INDEX IF NOT EXISTS idx_posts_company_created ON public.social_media_posts(company_id, created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN public.social_media_posts.views IS 'Number of times the post was viewed/seen';
COMMENT ON COLUMN public.social_media_posts.shares IS 'Number of shares/retweets/reposts';
COMMENT ON COLUMN public.social_media_posts.likes IS 'Number of likes/reactions';
COMMENT ON COLUMN public.social_media_posts.saves IS 'Number of saves/bookmarks';
COMMENT ON COLUMN public.social_media_posts.clicks IS 'Number of link clicks';
COMMENT ON COLUMN public.social_media_posts.video_watch_time_seconds IS 'Total video watch time in seconds';
COMMENT ON COLUMN public.social_media_posts.reach IS 'Unique users who saw the post';
COMMENT ON COLUMN public.social_media_posts.engagement_rate IS 'Calculated engagement rate percentage';
COMMENT ON COLUMN public.social_media_posts.metrics_last_synced_at IS 'Last time metrics were synced from social platforms';