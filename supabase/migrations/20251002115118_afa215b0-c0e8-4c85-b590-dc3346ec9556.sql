-- Create email configurations table for system-wide and company-specific email settings
CREATE TABLE IF NOT EXISTS public.email_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  sender_email text NOT NULL,
  sender_name text NOT NULL,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.email_configurations ENABLE ROW LEVEL SECURITY;

-- System admin can manage all email configurations
CREATE POLICY "Admins can view all email configs"
  ON public.email_configurations
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert email configs"
  ON public.email_configurations
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update email configs"
  ON public.email_configurations
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete email configs"
  ON public.email_configurations
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Companies can view and update their own email config
CREATE POLICY "Companies can view their email config"
  ON public.email_configurations
  FOR SELECT
  USING (
    company_id IS NOT NULL 
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Companies can update their email config"
  ON public.email_configurations
  FOR UPDATE
  USING (
    company_id IS NOT NULL 
    AND company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Add trigger for updated_at
CREATE TRIGGER update_email_configurations_updated_at
  BEFORE UPDATE ON public.email_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Insert default system email configuration (company_id NULL means system-wide)
INSERT INTO public.email_configurations (company_id, sender_email, sender_name, is_verified)
VALUES (NULL, 'onboarding@resend.dev', 'System Admin', true)
ON CONFLICT DO NOTHING;