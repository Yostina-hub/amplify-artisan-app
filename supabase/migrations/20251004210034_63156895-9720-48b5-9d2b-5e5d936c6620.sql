-- AI Content Generator Tables
CREATE TABLE public.ai_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'post',
  prompt TEXT NOT NULL,
  generated_text TEXT NOT NULL,
  generated_images JSONB DEFAULT '[]'::jsonb,
  hashtags TEXT[],
  tone TEXT,
  language TEXT DEFAULT 'en',
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  post_id UUID REFERENCES public.social_media_posts(id),
  ai_model TEXT DEFAULT 'google/gemini-2.5-flash',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Unified Social Inbox
CREATE TABLE public.social_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  participant_avatar TEXT,
  message_type TEXT NOT NULL DEFAULT 'message',
  content TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]'::jsonb,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'unread',
  sentiment_score NUMERIC,
  is_automated BOOLEAN DEFAULT false,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sentiment Analysis
CREATE TABLE public.sentiment_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_text TEXT,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  sentiment_score NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  emotions JSONB DEFAULT '{}'::jsonb,
  topics TEXT[],
  keywords TEXT[],
  language TEXT DEFAULT 'en',
  ai_model TEXT DEFAULT 'google/gemini-2.5-flash',
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Automation Workflows
CREATE TABLE public.automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  conditions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Automation Execution Log
CREATE TABLE public.automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.automation_workflows(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL,
  actions_executed JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  execution_time_ms INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Social Platform Enhanced Tokens
CREATE TABLE public.social_platform_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company_id, platform, account_id)
);

-- Enable RLS on all tables
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_platform_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_generated_content
CREATE POLICY "Users can view their company's AI content"
  ON public.ai_generated_content FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company's AI content"
  ON public.ai_generated_content FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can update their company's AI content"
  ON public.ai_generated_content FOR UPDATE
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage all AI content"
  ON public.ai_generated_content FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for social_conversations
CREATE POLICY "Users can view their company's conversations"
  ON public.social_conversations FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company's conversations"
  ON public.social_conversations FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company's conversations"
  ON public.social_conversations FOR UPDATE
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage all conversations"
  ON public.social_conversations FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for sentiment_analysis
CREATE POLICY "Users can view their company's sentiment data"
  ON public.sentiment_analysis FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "System can insert sentiment data"
  ON public.sentiment_analysis FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage all sentiment data"
  ON public.sentiment_analysis FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for automation_workflows
CREATE POLICY "Users can view their company's workflows"
  ON public.automation_workflows FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company's workflows"
  ON public.automation_workflows FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update their company's workflows"
  ON public.automation_workflows FOR UPDATE
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company's workflows"
  ON public.automation_workflows FOR DELETE
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage all workflows"
  ON public.automation_workflows FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for automation_executions
CREATE POLICY "Users can view their company's executions"
  ON public.automation_executions FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "System can insert executions"
  ON public.automation_executions FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage all executions"
  ON public.automation_executions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for social_platform_tokens
CREATE POLICY "Users can view their company's tokens"
  ON public.social_platform_tokens FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company's tokens"
  ON public.social_platform_tokens FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update their company's tokens"
  ON public.social_platform_tokens FOR UPDATE
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company's tokens"
  ON public.social_platform_tokens FOR DELETE
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage all tokens"
  ON public.social_platform_tokens FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_ai_content_company ON public.ai_generated_content(company_id);
CREATE INDEX idx_ai_content_platform ON public.ai_generated_content(platform);
CREATE INDEX idx_ai_content_status ON public.ai_generated_content(status);
CREATE INDEX idx_conversations_company ON public.social_conversations(company_id);
CREATE INDEX idx_conversations_platform ON public.social_conversations(platform);
CREATE INDEX idx_conversations_status ON public.social_conversations(status);
CREATE INDEX idx_sentiment_company ON public.sentiment_analysis(company_id);
CREATE INDEX idx_sentiment_platform ON public.sentiment_analysis(platform);
CREATE INDEX idx_workflows_company ON public.automation_workflows(company_id);
CREATE INDEX idx_workflows_active ON public.automation_workflows(is_active);
CREATE INDEX idx_executions_workflow ON public.automation_executions(workflow_id);
CREATE INDEX idx_tokens_company ON public.social_platform_tokens(company_id);
CREATE INDEX idx_tokens_platform ON public.social_platform_tokens(platform);

-- Add update trigger for updated_at columns
CREATE TRIGGER update_ai_generated_content_updated_at
  BEFORE UPDATE ON public.ai_generated_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_social_conversations_updated_at
  BEFORE UPDATE ON public.social_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_automation_workflows_updated_at
  BEFORE UPDATE ON public.automation_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_social_platform_tokens_updated_at
  BEFORE UPDATE ON public.social_platform_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();