-- Create tracked_keywords table for managing keywords users want to monitor
CREATE TABLE public.tracked_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create social_media_mentions table for tracking brand/keyword mentions
CREATE TABLE public.social_media_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL,
  keyword_id UUID,
  platform TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  mention_type TEXT DEFAULT 'mention', -- mention, tag, hashtag
  post_url TEXT,
  engagement_count INTEGER DEFAULT 0,
  sentiment TEXT, -- positive, negative, neutral
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  mentioned_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create trending_topics table for tracking trends
CREATE TABLE public.trending_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  topic TEXT NOT NULL,
  hashtag TEXT,
  volume INTEGER DEFAULT 0,
  growth_rate NUMERIC DEFAULT 0,
  category TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracked_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_topics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tracked_keywords
CREATE POLICY "Users can view their own keywords"
  ON public.tracked_keywords FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own keywords"
  ON public.tracked_keywords FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keywords"
  ON public.tracked_keywords FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keywords"
  ON public.tracked_keywords FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all keywords"
  ON public.tracked_keywords FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view all keywords"
  ON public.tracked_keywords FOR SELECT
  USING (has_role(auth.uid(), 'agent'));

-- RLS Policies for social_media_mentions
CREATE POLICY "Users can view mentions for their accounts"
  ON public.social_media_mentions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.social_media_accounts
      WHERE id = social_media_mentions.account_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all mentions"
  ON public.social_media_mentions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can view all mentions"
  ON public.social_media_mentions FOR SELECT
  USING (has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins can insert mentions"
  ON public.social_media_mentions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can insert mentions"
  ON public.social_media_mentions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'agent'));

-- RLS Policies for trending_topics (read-only for users)
CREATE POLICY "Users can view trending topics"
  ON public.trending_topics FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert trending topics"
  ON public.trending_topics FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can insert trending topics"
  ON public.trending_topics FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'agent'));

CREATE POLICY "Admins can update trending topics"
  ON public.trending_topics FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can update trending topics"
  ON public.trending_topics FOR UPDATE
  USING (has_role(auth.uid(), 'agent'));

-- Add trigger for updated_at on tracked_keywords
CREATE TRIGGER update_tracked_keywords_updated_at
  BEFORE UPDATE ON public.tracked_keywords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();