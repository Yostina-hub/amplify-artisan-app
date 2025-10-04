-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning',
  priority TEXT DEFAULT 'medium',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  actual_start_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,
  budget NUMERIC(12,2),
  budget_spent NUMERIC(12,2) DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  project_manager_id UUID,
  client_account_id UUID,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create project milestones table
CREATE TABLE public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  milestone_order INTEGER DEFAULT 0,
  deliverables JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create project tasks table
CREATE TABLE public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID,
  estimated_hours NUMERIC(8,2),
  actual_hours NUMERIC(8,2) DEFAULT 0,
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  dependencies JSONB DEFAULT '[]',
  tags TEXT[],
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create time entries table
CREATE TABLE public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  description TEXT,
  hours NUMERIC(8,2) NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_billable BOOLEAN DEFAULT true,
  billable_rate NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create project team members table
CREATE TABLE public.project_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  hourly_rate NUMERIC(10,2),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Admins can manage all projects" ON public.projects
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company projects" ON public.projects
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their company projects" ON public.projects
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update their company projects" ON public.projects
  FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete their company projects" ON public.projects
  FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- RLS Policies for milestones
CREATE POLICY "Admins can manage all milestones" ON public.project_milestones
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view milestones for their projects" ON public.project_milestones
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_milestones.project_id
    AND projects.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can manage milestones for their projects" ON public.project_milestones
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_milestones.project_id
    AND projects.company_id = get_user_company_id(auth.uid())
  ));

-- RLS Policies for tasks
CREATE POLICY "Admins can manage all tasks" ON public.project_tasks
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view tasks for their projects" ON public.project_tasks
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_tasks.project_id
    AND projects.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can manage tasks for their projects" ON public.project_tasks
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_tasks.project_id
    AND projects.company_id = get_user_company_id(auth.uid())
  ));

-- RLS Policies for time entries
CREATE POLICY "Admins can manage all time entries" ON public.time_entries
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their company time entries" ON public.time_entries
  FOR SELECT USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert their own time entries" ON public.time_entries
  FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can update their own time entries" ON public.time_entries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own time entries" ON public.time_entries
  FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for team members
CREATE POLICY "Admins can manage all team members" ON public.project_team_members
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view team members for their projects" ON public.project_team_members
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_team_members.project_id
    AND projects.company_id = get_user_company_id(auth.uid())
  ));

CREATE POLICY "Project managers can manage team members" ON public.project_team_members
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_team_members.project_id
    AND projects.company_id = get_user_company_id(auth.uid())
  ));

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();