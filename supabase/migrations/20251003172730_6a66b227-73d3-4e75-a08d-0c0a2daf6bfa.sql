-- Add moderation-related columns to social_media_posts
ALTER TABLE social_media_posts
ADD COLUMN IF NOT EXISTS flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason text,
ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderated_at timestamp with time zone;

-- Add index for faster queries on flagged posts
CREATE INDEX IF NOT EXISTS idx_posts_flagged ON social_media_posts(flagged) WHERE flagged = true;

-- Add index for pending posts
CREATE INDEX IF NOT EXISTS idx_posts_status ON social_media_posts(status);

-- Create audit trigger for posts table
DROP TRIGGER IF EXISTS audit_social_media_posts ON social_media_posts;
CREATE TRIGGER audit_social_media_posts
  AFTER INSERT OR UPDATE OR DELETE ON social_media_posts
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();