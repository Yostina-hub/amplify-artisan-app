-- Add location tracking columns to social_media_mentions
ALTER TABLE social_media_mentions
ADD COLUMN country TEXT,
ADD COLUMN continent TEXT,
ADD COLUMN city TEXT;

-- Add location tracking columns to social_media_comments
ALTER TABLE social_media_comments
ADD COLUMN country TEXT,
ADD COLUMN continent TEXT,
ADD COLUMN city TEXT;

-- Add location tracking columns to ad_impressions
ALTER TABLE ad_impressions
ADD COLUMN country TEXT,
ADD COLUMN continent TEXT,
ADD COLUMN city TEXT;

-- Add location breakdown to social_media_metrics for aggregated data
ALTER TABLE social_media_metrics
ADD COLUMN location_breakdown JSONB DEFAULT '{}'::jsonb;

-- Create indexes for better query performance
CREATE INDEX idx_mentions_country ON social_media_mentions(country);
CREATE INDEX idx_mentions_continent ON social_media_mentions(continent);
CREATE INDEX idx_comments_country ON social_media_comments(country);
CREATE INDEX idx_comments_continent ON social_media_comments(continent);
CREATE INDEX idx_impressions_country ON ad_impressions(country);
CREATE INDEX idx_impressions_continent ON ad_impressions(continent);