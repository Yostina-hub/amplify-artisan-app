-- Create territories table
CREATE TABLE public.territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  territory_type TEXT CHECK (territory_type IN ('geographic', 'industry', 'account_size', 'product', 'custom')),
  region TEXT,
  country TEXT,
  state TEXT,
  city TEXT,
  postal_codes TEXT[],
  industry_focus TEXT[],
  account_size_range TEXT,
  annual_revenue_min DECIMAL(15,2),
  annual_revenue_max DECIMAL(15,2),
  target_quota DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create territory_assignments table
CREATE TABLE public.territory_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  territory_id UUID NOT NULL REFERENCES public.territories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT CHECK (role IN ('owner', 'manager', 'rep', 'support')),
  assigned_by UUID NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  quota DECIMAL(15,2),
  commission_rate DECIMAL(5,2),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(territory_id, user_id, start_date)
);

-- Create sales_teams table
CREATE TABLE public.sales_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  team_type TEXT CHECK (team_type IN ('sales', 'account_management', 'customer_success', 'support', 'business_development')),
  manager_id UUID,
  parent_team_id UUID REFERENCES public.sales_teams(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.sales_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT CHECK (role IN ('manager', 'team_lead', 'member', 'trainee')),
  join_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  leave_date TIMESTAMPTZ,
  quota DECIMAL(15,2),
  commission_rate DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  added_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create sales_performance table
CREATE TABLE public.sales_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  revenue_generated DECIMAL(15,2) DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  deals_won INTEGER DEFAULT 0,
  deals_lost INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2),
  average_deal_size DECIMAL(15,2),
  quota_assigned DECIMAL(15,2),
  quota_achieved DECIMAL(5,2),
  commission_earned DECIMAL(15,2) DEFAULT 0,
  activities_completed INTEGER DEFAULT 0,
  calls_made INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  meetings_held INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  pipeline_value DECIMAL(15,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_start)
);

-- Create commission_plans table
CREATE TABLE public.commission_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  plan_type TEXT CHECK (plan_type IN ('percentage', 'tiered', 'flat_rate', 'bonus', 'custom')),
  base_rate DECIMAL(5,2),
  tiers JSONB DEFAULT '[]'::jsonb,
  applies_to TEXT CHECK (applies_to IN ('all_sales', 'new_business', 'renewals', 'upsells', 'specific_products')),
  product_ids UUID[],
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create commission_assignments table
CREATE TABLE public.commission_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_plan_id UUID NOT NULL REFERENCES public.commission_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(commission_plan_id, user_id, start_date)
);

-- Create indexes
CREATE INDEX idx_territories_company ON public.territories(company_id);
CREATE INDEX idx_territories_active ON public.territories(is_active);
CREATE INDEX idx_territory_assignments_territory ON public.territory_assignments(territory_id);
CREATE INDEX idx_territory_assignments_user ON public.territory_assignments(user_id);
CREATE INDEX idx_sales_teams_company ON public.sales_teams(company_id);
CREATE INDEX idx_sales_teams_manager ON public.sales_teams(manager_id);
CREATE INDEX idx_sales_teams_parent ON public.sales_teams(parent_team_id);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_sales_performance_company ON public.sales_performance(company_id);
CREATE INDEX idx_sales_performance_user ON public.sales_performance(user_id);
CREATE INDEX idx_sales_performance_period ON public.sales_performance(period_type, period_start);
CREATE INDEX idx_commission_plans_company ON public.commission_plans(company_id);
CREATE INDEX idx_commission_assignments_plan ON public.commission_assignments(commission_plan_id);
CREATE INDEX idx_commission_assignments_user ON public.commission_assignments(user_id);

-- Enable RLS
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territory_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for territories
CREATE POLICY "Admins can manage all territories"
  ON public.territories FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company territories"
  ON public.territories FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Managers can insert company territories"
  ON public.territories FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Managers can update company territories"
  ON public.territories FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Managers can delete company territories"
  ON public.territories FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for territory_assignments
CREATE POLICY "Admins can manage all territory assignments"
  ON public.territory_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their territory assignments"
  ON public.territory_assignments FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.territories
      WHERE territories.id = territory_assignments.territory_id
      AND territories.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Managers can insert territory assignments"
  ON public.territory_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.territories
      WHERE territories.id = territory_assignments.territory_id
      AND territories.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Managers can update territory assignments"
  ON public.territory_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.territories
      WHERE territories.id = territory_assignments.territory_id
      AND territories.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Managers can delete territory assignments"
  ON public.territory_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.territories
      WHERE territories.id = territory_assignments.territory_id
      AND territories.company_id = get_user_company_id(auth.uid())
    )
  );

-- RLS Policies for sales_teams
CREATE POLICY "Admins can manage all teams"
  ON public.sales_teams FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company teams"
  ON public.sales_teams FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Managers can insert company teams"
  ON public.sales_teams FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Managers can update company teams"
  ON public.sales_teams FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Managers can delete company teams"
  ON public.sales_teams FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for team_members
CREATE POLICY "Admins can manage all team members"
  ON public.team_members FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their team memberships"
  ON public.team_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.sales_teams
      WHERE sales_teams.id = team_members.team_id
      AND sales_teams.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Managers can insert team members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales_teams
      WHERE sales_teams.id = team_members.team_id
      AND sales_teams.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Managers can update team members"
  ON public.team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.sales_teams
      WHERE sales_teams.id = team_members.team_id
      AND sales_teams.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Managers can delete team members"
  ON public.team_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sales_teams
      WHERE sales_teams.id = team_members.team_id
      AND sales_teams.company_id = get_user_company_id(auth.uid())
    )
  );

-- RLS Policies for sales_performance
CREATE POLICY "Admins can manage all performance records"
  ON public.sales_performance FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company performance"
  ON public.sales_performance FOR SELECT
  USING (
    user_id = auth.uid() OR
    company_id = get_user_company_id(auth.uid())
  );

CREATE POLICY "System can insert performance records"
  ON public.sales_performance FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "System can update performance records"
  ON public.sales_performance FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for commission_plans
CREATE POLICY "Admins can manage all commission plans"
  ON public.commission_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company plans"
  ON public.commission_plans FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Managers can insert commission plans"
  ON public.commission_plans FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid()) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Managers can update commission plans"
  ON public.commission_plans FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Managers can delete commission plans"
  ON public.commission_plans FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for commission_assignments
CREATE POLICY "Admins can manage all commission assignments"
  ON public.commission_assignments FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their commission assignments"
  ON public.commission_assignments FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.commission_plans
      WHERE commission_plans.id = commission_assignments.commission_plan_id
      AND commission_plans.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Managers can insert commission assignments"
  ON public.commission_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.commission_plans
      WHERE commission_plans.id = commission_assignments.commission_plan_id
      AND commission_plans.company_id = get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Managers can update commission assignments"
  ON public.commission_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.commission_plans
      WHERE commission_plans.id = commission_assignments.commission_plan_id
      AND commission_plans.company_id = get_user_company_id(auth.uid())
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_territories_updated_at
  BEFORE UPDATE ON public.territories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_territory_assignments_updated_at
  BEFORE UPDATE ON public.territory_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sales_teams_updated_at
  BEFORE UPDATE ON public.sales_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sales_performance_updated_at
  BEFORE UPDATE ON public.sales_performance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_commission_plans_updated_at
  BEFORE UPDATE ON public.commission_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_commission_assignments_updated_at
  BEFORE UPDATE ON public.commission_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();