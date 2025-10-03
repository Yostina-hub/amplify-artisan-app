-- Drop the problematic policy that accesses auth.users
DROP POLICY IF EXISTS "Users can view their own subscription requests" ON public.subscription_requests;

-- Create a new policy that uses JWT email directly (no auth.users access needed)
CREATE POLICY "Users can view their own subscription requests"
ON public.subscription_requests
FOR SELECT
TO authenticated
USING (
  email = (auth.jwt() ->> 'email')
);

-- Ensure the admin policy exists for full access
DROP POLICY IF EXISTS "Admins can view all subscription requests" ON public.subscription_requests;

CREATE POLICY "Admins can manage all subscription requests"
ON public.subscription_requests
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);