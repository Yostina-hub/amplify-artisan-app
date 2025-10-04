-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled')),
  category TEXT CHECK (category IN ('technical', 'billing', 'feature_request', 'bug_report', 'general', 'account', 'other')),
  customer_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  assigned_to UUID,
  assigned_team UUID,
  reported_by UUID NOT NULL,
  channel TEXT CHECK (channel IN ('email', 'phone', 'chat', 'web_form', 'social_media', 'in_person')),
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  sla_breach BOOLEAN DEFAULT false,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  satisfaction_comment TEXT,
  resolution_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create ticket_comments table
CREATE TABLE public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  is_solution BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create knowledge_base_articles table
CREATE TABLE public.knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  author_id UUID NOT NULL,
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by UUID,
  tags TEXT[] DEFAULT '{}',
  related_articles UUID[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sla_policies table
CREATE TABLE public.sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  priority_level TEXT NOT NULL CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
  first_response_time_hours INTEGER NOT NULL,
  resolution_time_hours INTEGER NOT NULL,
  business_hours_only BOOLEAN DEFAULT true,
  applies_to_categories TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create customer_satisfaction_surveys table
CREATE TABLE public.customer_satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  survey_type TEXT CHECK (survey_type IN ('csat', 'nps', 'ces', 'custom')),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  response_quality INTEGER CHECK (response_quality >= 1 AND response_quality <= 5),
  response_time INTEGER CHECK (response_time >= 1 AND response_time <= 5),
  professionalism INTEGER CHECK (professionalism >= 1 AND professionalism <= 5),
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  would_recommend BOOLEAN,
  comments TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create support_teams table
CREATE TABLE public.support_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  team_email TEXT,
  specialization TEXT[],
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create support_team_members table
CREATE TABLE public.support_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.support_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT CHECK (role IN ('manager', 'team_lead', 'agent', 'specialist')),
  max_tickets_per_day INTEGER,
  specializations TEXT[],
  is_active BOOLEAN DEFAULT true,
  added_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create indexes
CREATE INDEX idx_support_tickets_company ON public.support_tickets(company_id);
CREATE INDEX idx_support_tickets_number ON public.support_tickets(ticket_number);
CREATE INDEX idx_support_tickets_customer ON public.support_tickets(customer_id);
CREATE INDEX idx_support_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX idx_support_tickets_created ON public.support_tickets(created_at);
CREATE INDEX idx_ticket_comments_ticket ON public.ticket_comments(ticket_id);
CREATE INDEX idx_knowledge_base_company ON public.knowledge_base_articles(company_id);
CREATE INDEX idx_knowledge_base_status ON public.knowledge_base_articles(status);
CREATE INDEX idx_knowledge_base_public ON public.knowledge_base_articles(is_public);
CREATE INDEX idx_sla_policies_company ON public.sla_policies(company_id);
CREATE INDEX idx_sla_policies_priority ON public.sla_policies(priority_level);
CREATE INDEX idx_satisfaction_surveys_company ON public.customer_satisfaction_surveys(company_id);
CREATE INDEX idx_satisfaction_surveys_ticket ON public.customer_satisfaction_surveys(ticket_id);
CREATE INDEX idx_support_teams_company ON public.support_teams(company_id);
CREATE INDEX idx_support_team_members_team ON public.support_team_members(team_id);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
CREATE POLICY "Admins can manage all tickets"
  ON public.support_tickets FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company tickets"
  ON public.support_tickets FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid()) OR
    customer_id IN (SELECT id FROM public.contacts WHERE company_id = get_user_company_id(auth.uid()))
  );

CREATE POLICY "Users can insert their company tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND reported_by = auth.uid()
  );

CREATE POLICY "Users can update their company tickets"
  ON public.support_tickets FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for ticket_comments
CREATE POLICY "Admins can manage all comments"
  ON public.ticket_comments FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view comments on their tickets"
  ON public.ticket_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE support_tickets.id = ticket_comments.ticket_id
      AND support_tickets.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Users can insert comments on their tickets"
  ON public.ticket_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE support_tickets.id = ticket_comments.ticket_id
      AND support_tickets.company_id = get_user_company_id(auth.uid())
    )
    AND created_by = auth.uid()
  );

-- RLS Policies for knowledge_base_articles
CREATE POLICY "Admins can manage all articles"
  ON public.knowledge_base_articles FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company articles"
  ON public.knowledge_base_articles FOR SELECT
  USING (
    company_id = get_user_company_id(auth.uid()) OR
    (is_public = true AND status = 'published')
  );

CREATE POLICY "Authors can insert articles"
  ON public.knowledge_base_articles FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND author_id = auth.uid()
  );

CREATE POLICY "Authors can update their articles"
  ON public.knowledge_base_articles FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for sla_policies
CREATE POLICY "Admins can manage all SLA policies"
  ON public.sla_policies FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company SLA policies"
  ON public.sla_policies FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Managers can insert SLA policies"
  ON public.sla_policies FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Managers can update SLA policies"
  ON public.sla_policies FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for customer_satisfaction_surveys
CREATE POLICY "Admins can view all surveys"
  ON public.customer_satisfaction_surveys FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company surveys"
  ON public.customer_satisfaction_surveys FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "System can insert surveys"
  ON public.customer_satisfaction_surveys FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for support_teams
CREATE POLICY "Admins can manage all support teams"
  ON public.support_teams FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company teams"
  ON public.support_teams FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Managers can insert support teams"
  ON public.support_teams FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Managers can update support teams"
  ON public.support_teams FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for support_team_members
CREATE POLICY "Admins can manage all team members"
  ON public.support_team_members FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their team memberships"
  ON public.support_team_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.support_teams
      WHERE support_teams.id = support_team_members.team_id
      AND support_teams.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Managers can insert team members"
  ON public.support_team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_teams
      WHERE support_teams.id = support_team_members.team_id
      AND support_teams.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Managers can update team members"
  ON public.support_team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.support_teams
      WHERE support_teams.id = support_team_members.team_id
      AND support_teams.company_id = get_user_company_id(auth.uid())
    )
  );

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  company_prefix TEXT;
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.support_tickets
    WHERE company_id = NEW.company_id;
    
    company_prefix := 'TKT-' || SUBSTRING(NEW.company_id::TEXT FROM 1 FOR 8);
    NEW.ticket_number := company_prefix || '-' || LPAD(next_number::TEXT, 6, '0');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger for ticket number generation
CREATE TRIGGER generate_ticket_number_trigger
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();

-- Add updated_at triggers
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_ticket_comments_updated_at
  BEFORE UPDATE ON public.ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_knowledge_base_articles_updated_at
  BEFORE UPDATE ON public.knowledge_base_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sla_policies_updated_at
  BEFORE UPDATE ON public.sla_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_support_teams_updated_at
  BEFORE UPDATE ON public.support_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_support_team_members_updated_at
  BEFORE UPDATE ON public.support_team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();