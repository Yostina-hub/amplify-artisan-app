-- Create influencers table
CREATE TABLE public.influencers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  platform_handle TEXT NOT NULL,
  platform_url TEXT,
  follower_count INTEGER DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  category TEXT,
  bio TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  avg_post_price NUMERIC,
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create influencer_campaigns table
CREATE TABLE public.influencer_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  budget NUMERIC NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'planning',
  goals JSONB,
  target_audience JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaign_influencers junction table
CREATE TABLE public.campaign_influencers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.influencer_campaigns(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'invited',
  agreed_price NUMERIC,
  deliverables JSONB,
  content_submitted_at TIMESTAMP WITH TIME ZONE,
  content_approved_at TIMESTAMP WITH TIME ZONE,
  posted_at TIMESTAMP WITH TIME ZONE,
  performance_metrics JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, influencer_id)
);

-- Create influencer_contracts table
CREATE TABLE public.influencer_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_influencer_id UUID NOT NULL REFERENCES public.campaign_influencers(id) ON DELETE CASCADE,
  contract_url TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  payment_amount NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create influencer_communications table
CREATE TABLE public.influencer_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  influencer_id UUID NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  communication_type TEXT DEFAULT 'email',
  direction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencer_communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for influencers
CREATE POLICY "Users can view their own influencers"
  ON public.influencers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own influencers"
  ON public.influencers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own influencers"
  ON public.influencers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own influencers"
  ON public.influencers FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all influencers"
  ON public.influencers FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view all influencers"
  ON public.influencers FOR SELECT
  USING (has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for influencer_campaigns
CREATE POLICY "Users can view their own campaigns"
  ON public.influencer_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns"
  ON public.influencer_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON public.influencer_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON public.influencer_campaigns FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all campaigns"
  ON public.influencer_campaigns FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view all campaigns"
  ON public.influencer_campaigns FOR SELECT
  USING (has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for campaign_influencers
CREATE POLICY "Users can view campaign influencers for their campaigns"
  ON public.campaign_influencers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.influencer_campaigns
      WHERE influencer_campaigns.id = campaign_influencers.campaign_id
      AND influencer_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert campaign influencers for their campaigns"
  ON public.campaign_influencers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.influencer_campaigns
      WHERE influencer_campaigns.id = campaign_influencers.campaign_id
      AND influencer_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update campaign influencers for their campaigns"
  ON public.campaign_influencers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.influencer_campaigns
      WHERE influencer_campaigns.id = campaign_influencers.campaign_id
      AND influencer_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete campaign influencers for their campaigns"
  ON public.campaign_influencers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.influencer_campaigns
      WHERE influencer_campaigns.id = campaign_influencers.campaign_id
      AND influencer_campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all campaign influencers"
  ON public.campaign_influencers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can manage all campaign influencers"
  ON public.campaign_influencers FOR ALL
  USING (has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for influencer_contracts
CREATE POLICY "Users can view contracts for their campaigns"
  ON public.influencer_contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_influencers ci
      JOIN public.influencer_campaigns ic ON ic.id = ci.campaign_id
      WHERE ci.id = influencer_contracts.campaign_influencer_id
      AND ic.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contracts for their campaigns"
  ON public.influencer_contracts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaign_influencers ci
      JOIN public.influencer_campaigns ic ON ic.id = ci.campaign_id
      WHERE ci.id = influencer_contracts.campaign_influencer_id
      AND ic.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contracts for their campaigns"
  ON public.influencer_contracts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_influencers ci
      JOIN public.influencer_campaigns ic ON ic.id = ci.campaign_id
      WHERE ci.id = influencer_contracts.campaign_influencer_id
      AND ic.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all contracts"
  ON public.influencer_contracts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can manage all contracts"
  ON public.influencer_contracts FOR ALL
  USING (has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for influencer_communications
CREATE POLICY "Users can view communications for their influencers"
  ON public.influencer_communications FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.influencers
      WHERE influencers.id = influencer_communications.influencer_id
      AND influencers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert communications for their influencers"
  ON public.influencer_communications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all communications"
  ON public.influencer_communications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view all communications"
  ON public.influencer_communications FOR SELECT
  USING (has_role(auth.uid(), 'agent'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_influencers_user_id ON public.influencers(user_id);
CREATE INDEX idx_influencers_platform ON public.influencers(platform);
CREATE INDEX idx_influencers_category ON public.influencers(category);
CREATE INDEX idx_influencer_campaigns_user_id ON public.influencer_campaigns(user_id);
CREATE INDEX idx_campaign_influencers_campaign_id ON public.campaign_influencers(campaign_id);
CREATE INDEX idx_campaign_influencers_influencer_id ON public.campaign_influencers(influencer_id);
CREATE INDEX idx_influencer_communications_influencer_id ON public.influencer_communications(influencer_id);

-- Create triggers for updated_at
CREATE TRIGGER update_influencers_updated_at
  BEFORE UPDATE ON public.influencers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_influencer_campaigns_updated_at
  BEFORE UPDATE ON public.influencer_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_campaign_influencers_updated_at
  BEFORE UPDATE ON public.campaign_influencers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_influencer_contracts_updated_at
  BEFORE UPDATE ON public.influencer_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();