/*
  # Create Social Media Posts Table

  1. New Tables
    - `social_media_posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `content` (text) - Post content
      - `platforms` (jsonb) - Array of selected platforms
      - `scheduled_for` (timestamptz) - When to publish (null = immediate)
      - `status` (text) - draft, scheduled, published, failed
      - `media_urls` (jsonb) - Array of media URLs
      - `platform_post_ids` (jsonb) - Platform-specific post IDs after publishing
      - `published_at` (timestamptz)
      - `error_message` (text) - If publishing failed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `social_media_posts` table
    - Add policies for authenticated users to manage their own posts
*/

CREATE TABLE IF NOT EXISTS social_media_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  platforms jsonb DEFAULT '[]'::jsonb,
  scheduled_for timestamptz,
  status text DEFAULT 'draft',
  media_urls jsonb DEFAULT '[]'::jsonb,
  platform_post_ids jsonb DEFAULT '{}'::jsonb,
  published_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own posts
CREATE POLICY "Users can view own posts"
  ON social_media_posts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create their own posts
CREATE POLICY "Users can create own posts"
  ON social_media_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON social_media_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON social_media_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_social_media_posts_user_id ON social_media_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_scheduled_for ON social_media_posts(scheduled_for);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_media_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_social_media_posts_updated_at_trigger ON social_media_posts;
CREATE TRIGGER update_social_media_posts_updated_at_trigger
  BEFORE UPDATE ON social_media_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_media_posts_updated_at();