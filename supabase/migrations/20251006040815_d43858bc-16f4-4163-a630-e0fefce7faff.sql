-- Create IP whitelist table for system security
CREATE TABLE IF NOT EXISTS public.ip_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  company_id UUID REFERENCES public.companies(id),
  UNIQUE(ip_address, company_id)
);

-- Enable RLS
ALTER TABLE public.ip_whitelist ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage IP whitelist
CREATE POLICY "Super admins can manage IP whitelist"
ON public.ip_whitelist
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create domain whitelist table
CREATE TABLE IF NOT EXISTS public.domain_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  company_id UUID REFERENCES public.companies(id),
  UNIQUE(domain, company_id)
);

-- Enable RLS
ALTER TABLE public.domain_whitelist ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage domain whitelist
CREATE POLICY "Super admins can manage domain whitelist"
ON public.domain_whitelist
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at using correct function name
CREATE TRIGGER update_ip_whitelist_updated_at
BEFORE UPDATE ON public.ip_whitelist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_domain_whitelist_updated_at
BEFORE UPDATE ON public.domain_whitelist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create access log table for tracking blocked attempts
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  request_path TEXT,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  company_id UUID
);

-- Enable RLS
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can view all access logs
CREATE POLICY "Super admins can view all access logs"
ON public.access_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_active ON public.ip_whitelist(ip_address, is_active);
CREATE INDEX IF NOT EXISTS idx_domain_whitelist_active ON public.domain_whitelist(domain, is_active);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON public.access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_blocked ON public.access_logs(is_blocked, created_at DESC);
