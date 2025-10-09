-- Fix critical circular dependency in user_roles RLS policies
-- The existing policy causes issues because it checks has_role while querying roles

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;

-- Recreate with proper logic to avoid circular dependency
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);  -- Simple check, no function calls

CREATE POLICY "Super admins can view all roles"
ON user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin' 
      AND ur.company_id IS NULL
  )
);