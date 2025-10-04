-- Create API integrations table
CREATE TABLE public.api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('incoming', 'outgoing', 'bidirectional')),
  base_url TEXT,
  auth_type TEXT CHECK (auth_type IN ('none', 'api_key', 'oauth2', 'bearer_token', 'basic_auth')),
  auth_config JSONB DEFAULT '{}'::jsonb,
  headers JSONB DEFAULT '{}'::jsonb,
  rate_limit INTEGER,
  timeout_seconds INTEGER DEFAULT 30,
  retry_attempts INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create API integration custom fields table
CREATE TABLE public.api_integration_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.api_integrations(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'boolean', 'date', 'json', 'select', 'multiselect')),
  field_label TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  field_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(integration_id, field_name)
);

-- Create API integration logs table
CREATE TABLE public.api_integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.api_integrations(id) ON DELETE CASCADE,
  request_method TEXT,
  request_url TEXT,
  request_headers JSONB,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_api_integrations_active ON public.api_integrations(is_active);
CREATE INDEX idx_api_integrations_type ON public.api_integrations(integration_type);
CREATE INDEX idx_integration_fields_integration ON public.api_integration_fields(integration_id);
CREATE INDEX idx_integration_logs_integration ON public.api_integration_logs(integration_id);
CREATE INDEX idx_integration_logs_created ON public.api_integration_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_integration_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_integration_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_integrations
CREATE POLICY "Super admins can manage all integrations"
ON public.api_integrations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for api_integration_fields
CREATE POLICY "Super admins can manage all integration fields"
ON public.api_integration_fields FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for api_integration_logs
CREATE POLICY "Super admins can view all integration logs"
ON public.api_integration_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert integration logs"
ON public.api_integration_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_api_integrations_updated_at
BEFORE UPDATE ON public.api_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();