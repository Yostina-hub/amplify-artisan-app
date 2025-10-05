-- Enable RLS on security_audit_log table
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON security_audit_log;
DROP POLICY IF EXISTS "Company admins can view their company audit logs" ON security_audit_log;

-- Allow super admins (with role 'admin') to view all audit logs
CREATE POLICY "Super admins can view all audit logs"
ON security_audit_log
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::text)
);

-- Allow company admins to view audit logs from their company users
CREATE POLICY "Company admins can view their company audit logs"
ON security_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.id = auth.uid()
    AND p2.id = security_audit_log.user_id
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
      AND user_roles.company_id = p1.company_id
    )
  )
);