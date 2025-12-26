-- Create company monitoring profiles table
CREATE TABLE IF NOT EXISTS public.company_monitoring_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  profile_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  industry TEXT,
  description TEXT,
  keywords TEXT[] DEFAULT '{}',
  competitor_names TEXT[] DEFAULT '{}',
  target_regions TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{en}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client requirements/needs table
CREATE TABLE IF NOT EXISTS public.monitoring_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.company_monitoring_profiles(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL, -- 'keyword', 'topic', 'sentiment', 'entity', 'custom'
  requirement_value TEXT NOT NULL,
  priority TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  alert_threshold NUMERIC DEFAULT 0.7,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create scraped intelligence table for storing processed data
CREATE TABLE IF NOT EXISTS public.scraped_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.company_monitoring_profiles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id),
  source_url TEXT NOT NULL,
  source_domain TEXT,
  source_type TEXT DEFAULT 'website', -- 'website', 'social', 'news', 'forum'
  title TEXT,
  content TEXT,
  summary TEXT,
  category TEXT, -- 'competitor', 'industry', 'market', 'regulatory', 'opportunity', 'risk'
  entities JSONB DEFAULT '{}', -- { organizations: [], people: [], locations: [], topics: [] }
  sentiment_score NUMERIC,
  sentiment_label TEXT,
  relevance_score NUMERIC DEFAULT 0,
  language TEXT DEFAULT 'en',
  region TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  is_processed BOOLEAN DEFAULT false,
  matched_requirements UUID[] DEFAULT '{}'
);

-- Create AI predictions table
CREATE TABLE IF NOT EXISTS public.ai_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.company_monitoring_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  prediction_type TEXT NOT NULL, -- 'opportunity', 'risk', 'trend', 'competitor'
  title TEXT NOT NULL,
  description TEXT,
  confidence NUMERIC DEFAULT 0.5,
  trend TEXT DEFAULT 'stable', -- 'up', 'down', 'stable'
  impact TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  timeframe TEXT,
  supporting_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.company_monitoring_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_monitoring_profiles
CREATE POLICY "Users can view their company profiles" ON public.company_monitoring_profiles
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create profiles for their company" ON public.company_monitoring_profiles
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their company profiles" ON public.company_monitoring_profiles
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their company profiles" ON public.company_monitoring_profiles
  FOR DELETE USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- RLS policies for monitoring_requirements
CREATE POLICY "Users can manage requirements for their profiles" ON public.monitoring_requirements
  FOR ALL USING (
    profile_id IN (
      SELECT id FROM company_monitoring_profiles 
      WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    )
  );

-- RLS policies for scraped_intelligence
CREATE POLICY "Users can view their company intelligence" ON public.scraped_intelligence
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert intelligence for their company" ON public.scraped_intelligence
  FOR INSERT WITH CHECK (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- RLS policies for ai_predictions
CREATE POLICY "Users can view their company predictions" ON public.ai_predictions
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage predictions for their company" ON public.ai_predictions
  FOR ALL USING (
    company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

-- Create indexes
CREATE INDEX idx_scraped_intelligence_profile ON public.scraped_intelligence(profile_id);
CREATE INDEX idx_scraped_intelligence_company ON public.scraped_intelligence(company_id);
CREATE INDEX idx_scraped_intelligence_category ON public.scraped_intelligence(category);
CREATE INDEX idx_scraped_intelligence_scraped_at ON public.scraped_intelligence(scraped_at DESC);
CREATE INDEX idx_ai_predictions_profile ON public.ai_predictions(profile_id);
CREATE INDEX idx_ai_predictions_type ON public.ai_predictions(prediction_type);

-- Add trigger for updated_at
CREATE TRIGGER update_company_monitoring_profiles_updated_at
  BEFORE UPDATE ON public.company_monitoring_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();