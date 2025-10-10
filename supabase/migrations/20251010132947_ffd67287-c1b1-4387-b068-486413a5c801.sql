-- Add approval tracking fields to social_media_posts
ALTER TABLE social_media_posts
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS approval_comment text,
ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone;

-- Create index for scheduled posts
CREATE INDEX IF NOT EXISTS idx_social_media_posts_scheduled 
ON social_media_posts(scheduled_for, status) 
WHERE scheduled_for IS NOT NULL;

-- Create function to check and publish scheduled posts
CREATE OR REPLACE FUNCTION check_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function will be called by a cron job or edge function
  -- It marks posts as ready_to_publish when their scheduled time arrives
  UPDATE social_media_posts
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{ready_to_publish}',
    'true'::jsonb
  )
  WHERE scheduled_for IS NOT NULL
    AND scheduled_for <= NOW()
    AND status = 'scheduled'
    AND (metadata->>'ready_to_publish')::boolean IS NOT TRUE;
END;
$$;