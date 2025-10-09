-- Add missing critical RLS policies for user_roles table
-- This is essential for authentication and role-based access control

-- User Roles Policies (Critical for auth to work)
CREATE POLICY "Users can view their own roles"
ON user_roles FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert roles"
ON user_roles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON user_roles FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON user_roles FOR DELETE
USING (has_role(auth.uid(), 'admin'));