-- Phase 1: Hierarchical Organization Structure and Dynamic Permissions System

-- 1. Create branches table with self-referencing hierarchy
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL, -- Unique branch code (e.g., HQ, BR-001)
  branch_type TEXT NOT NULL DEFAULT 'branch', -- 'headquarters', 'regional', 'branch', 'sub_branch'
  level INTEGER NOT NULL DEFAULT 1, -- Hierarchy level (1 = headquarters, 2 = regional, etc.)
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(company_id, code)
);

-- 2. Create permissions table for dynamic permission management
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name TEXT NOT NULL, -- e.g., 'crm', 'contacts', 'leads'
  permission_key TEXT NOT NULL UNIQUE, -- e.g., 'crm.contacts.view', 'crm.contacts.create'
  permission_name TEXT NOT NULL, -- Display name
  description TEXT,
  category TEXT, -- Group permissions by category
  is_system BOOLEAN DEFAULT false, -- System permissions cannot be deleted
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create role_permissions mapping table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id, company_id)
);

-- 4. Add branch_id to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE;

-- 5. Add branch_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;

-- 6. Create function to get all child branches recursively
CREATE OR REPLACE FUNCTION public.get_branch_hierarchy(branch_uuid UUID)
RETURNS TABLE(branch_id UUID, level INTEGER) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE branch_tree AS (
    -- Base case: the branch itself
    SELECT id, level, parent_branch_id
    FROM branches
    WHERE id = branch_uuid
    
    UNION ALL
    
    -- Recursive case: all child branches
    SELECT b.id, b.level, b.parent_branch_id
    FROM branches b
    INNER JOIN branch_tree bt ON b.parent_branch_id = bt.id
  )
  SELECT id, level FROM branch_tree;
$$;

-- 7. Create function to check if user has access to branch data
CREATE OR REPLACE FUNCTION public.can_access_branch(_user_id UUID, _branch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN profiles p ON p.id = _user_id
    WHERE ur.user_id = _user_id
      AND (
        -- Super admin can access all branches
        (ur.role = 'admin' AND ur.company_id IS NULL)
        -- Company admin can access all branches in their company
        OR (ur.role = 'admin' AND ur.company_id = p.company_id)
        -- User can access their own branch
        OR (ur.branch_id = _branch_id)
        -- User can access child branches
        OR _branch_id IN (
          SELECT branch_id FROM get_branch_hierarchy(ur.branch_id)
        )
      )
  )
$$;

-- 8. Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN role_permissions rp ON rp.role = ur.role
    INNER JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND p.permission_key = _permission_key
      AND (rp.company_id IS NULL OR rp.company_id = (SELECT company_id FROM profiles WHERE id = _user_id))
  )
$$;

-- 9. Create function to get user's accessible branches
CREATE OR REPLACE FUNCTION public.get_user_accessible_branches(_user_id UUID)
RETURNS TABLE(branch_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT b.id
  FROM branches b
  INNER JOIN profiles p ON p.company_id = b.company_id
  INNER JOIN user_roles ur ON ur.user_id = _user_id
  WHERE p.id = _user_id
    AND (
      -- Super admin sees all
      (ur.role = 'admin' AND ur.company_id IS NULL)
      -- Company admin sees all company branches
      OR (ur.role = 'admin' AND ur.company_id = p.company_id)
      -- Users see their branch and children
      OR b.id IN (SELECT branch_id FROM get_branch_hierarchy(ur.branch_id))
    );
$$;

-- 10. Enable RLS on new tables
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies for branches
CREATE POLICY "Super admins can manage all branches"
ON public.branches FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Company admins can manage their company branches"
ON public.branches FOR ALL
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can view accessible branches"
ON public.branches FOR SELECT
USING (id IN (SELECT branch_id FROM get_user_accessible_branches(auth.uid())));

-- 12. RLS Policies for permissions
CREATE POLICY "Super admins can manage all permissions"
ON public.permissions FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view permissions"
ON public.permissions FOR SELECT
TO authenticated
USING (true);

-- 13. RLS Policies for role_permissions
CREATE POLICY "Super admins can manage all role permissions"
ON public.role_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Company admins can manage their company role permissions"
ON public.role_permissions FOR ALL
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can view their role permissions"
ON public.role_permissions FOR SELECT
USING (
  role IN (SELECT role FROM user_roles WHERE user_id = auth.uid())
  AND (company_id IS NULL OR company_id = get_user_company_id(auth.uid()))
);

-- 14. Add triggers for updated_at
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 15. Insert default system permissions
INSERT INTO public.permissions (module_name, permission_key, permission_name, description, category, is_system) VALUES
-- CRM Module
('crm', 'crm.dashboard.view', 'View CRM Dashboard', 'Access to CRM dashboard and overview', 'CRM', true),
('crm', 'crm.contacts.view', 'View Contacts', 'View contact records', 'CRM', true),
('crm', 'crm.contacts.create', 'Create Contacts', 'Create new contact records', 'CRM', true),
('crm', 'crm.contacts.update', 'Update Contacts', 'Modify existing contact records', 'CRM', true),
('crm', 'crm.contacts.delete', 'Delete Contacts', 'Remove contact records', 'CRM', true),
('crm', 'crm.leads.view', 'View Leads', 'View lead records', 'CRM', true),
('crm', 'crm.leads.create', 'Create Leads', 'Create new lead records', 'CRM', true),
('crm', 'crm.leads.update', 'Update Leads', 'Modify existing lead records', 'CRM', true),
('crm', 'crm.leads.delete', 'Delete Leads', 'Remove lead records', 'CRM', true),
('crm', 'crm.accounts.view', 'View Accounts', 'View account records', 'CRM', true),
('crm', 'crm.accounts.create', 'Create Accounts', 'Create new account records', 'CRM', true),
('crm', 'crm.accounts.update', 'Update Accounts', 'Modify existing account records', 'CRM', true),
('crm', 'crm.accounts.delete', 'Delete Accounts', 'Remove account records', 'CRM', true),

-- Sales Module
('sales', 'sales.pipeline.view', 'View Sales Pipeline', 'Access to sales pipeline', 'Sales', true),
('sales', 'sales.quotes.view', 'View Quotes', 'View quote records', 'Sales', true),
('sales', 'sales.quotes.create', 'Create Quotes', 'Create new quotes', 'Sales', true),
('sales', 'sales.quotes.approve', 'Approve Quotes', 'Approve or reject quotes', 'Sales', true),
('sales', 'sales.invoices.view', 'View Invoices', 'View invoice records', 'Sales', true),
('sales', 'sales.invoices.create', 'Create Invoices', 'Create new invoices', 'Sales', true),

-- Marketing Module
('marketing', 'marketing.campaigns.view', 'View Campaigns', 'View marketing campaigns', 'Marketing', true),
('marketing', 'marketing.campaigns.create', 'Create Campaigns', 'Create new campaigns', 'Marketing', true),
('marketing', 'marketing.social.view', 'View Social Media', 'Access social media management', 'Marketing', true),
('marketing', 'marketing.social.post', 'Post to Social Media', 'Create and publish social posts', 'Marketing', true),

-- Analytics Module
('analytics', 'analytics.reports.view', 'View Reports', 'Access to reports and analytics', 'Analytics', true),
('analytics', 'analytics.dashboard.view', 'View Analytics Dashboard', 'Access analytics dashboard', 'Analytics', true),

-- Admin Module
('admin', 'admin.users.view', 'View Users', 'View user records', 'Administration', true),
('admin', 'admin.users.create', 'Create Users', 'Create new users', 'Administration', true),
('admin', 'admin.users.update', 'Update Users', 'Modify user records', 'Administration', true),
('admin', 'admin.users.delete', 'Delete Users', 'Remove users', 'Administration', true),
('admin', 'admin.roles.manage', 'Manage Roles', 'Assign and manage user roles', 'Administration', true),
('admin', 'admin.branches.manage', 'Manage Branches', 'Create and manage branches', 'Administration', true),
('admin', 'admin.permissions.manage', 'Manage Permissions', 'Configure role permissions', 'Administration', true),
('admin', 'admin.settings.manage', 'Manage Settings', 'Configure system settings', 'Administration', true),
('admin', 'admin.audit.view', 'View Audit Logs', 'Access audit log records', 'Administration', true),
('admin', 'admin.companies.manage', 'Manage Companies', 'Manage company records', 'Administration', true)

ON CONFLICT (permission_key) DO NOTHING;

-- 16. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_branches_company_id ON public.branches(company_id);
CREATE INDEX IF NOT EXISTS idx_branches_parent_branch_id ON public.branches(parent_branch_id);
CREATE INDEX IF NOT EXISTS idx_branches_manager_id ON public.branches(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_branch_id ON public.user_roles(branch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON public.profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_permissions_module_name ON public.permissions(module_name);
CREATE INDEX IF NOT EXISTS idx_permissions_permission_key ON public.permissions(permission_key);