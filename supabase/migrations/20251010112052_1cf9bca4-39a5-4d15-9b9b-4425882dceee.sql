-- Create contacts list table for email marketing
CREATE TABLE IF NOT EXISTS public.email_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  subscription_status TEXT DEFAULT 'subscribed' CHECK (subscription_status IN ('subscribed', 'unsubscribed', 'bounced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(company_id, email)
);

-- Create email tracking table
CREATE TABLE IF NOT EXISTS public.email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.email_contacts(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add new columns to email_campaigns table
ALTER TABLE public.email_campaigns 
ADD COLUMN IF NOT EXISTS contact_filter JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounced_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_contacts
CREATE POLICY "Users can manage company contacts"
ON public.email_contacts
FOR ALL
USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- RLS Policies for email_tracking
CREATE POLICY "Users can view company email tracking"
ON public.email_tracking
FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM public.email_campaigns 
    WHERE company_id = get_user_company_id(auth.uid())
  ) OR has_role(auth.uid(), 'admin')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_contacts_company ON public.email_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_email_contacts_email ON public.email_contacts(email);
CREATE INDEX IF NOT EXISTS idx_email_tracking_campaign ON public.email_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_contact ON public.email_tracking(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled ON public.email_campaigns(scheduled_for) WHERE scheduled_for IS NOT NULL;