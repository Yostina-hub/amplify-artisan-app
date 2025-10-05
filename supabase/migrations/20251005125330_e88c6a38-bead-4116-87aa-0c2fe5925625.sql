-- Create table for company TTS/STT settings
CREATE TABLE IF NOT EXISTS public.company_tts_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  openai_api_key text,
  elevenlabs_api_key text,
  use_custom_keys boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.company_tts_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Company admins can view their company's settings
CREATE POLICY "Company admins can view their TTS settings"
ON public.company_tts_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND (
      (ur.company_id = company_tts_settings.company_id AND ur.role = 'admin')
      OR (ur.company_id IS NULL AND ur.role = 'admin')
    )
  )
);

-- Policy: Company admins can update their company's settings
CREATE POLICY "Company admins can update their TTS settings"
ON public.company_tts_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND (
      (ur.company_id = company_tts_settings.company_id AND ur.role = 'admin')
      OR (ur.company_id IS NULL AND ur.role = 'admin')
    )
  )
);

-- Policy: Company admins can insert their company's settings
CREATE POLICY "Company admins can insert their TTS settings"
ON public.company_tts_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND (
      (ur.company_id = company_tts_settings.company_id AND ur.role = 'admin')
      OR (ur.company_id IS NULL AND ur.role = 'admin')
    )
  )
);

-- Policy: Super admins can delete any company's settings
CREATE POLICY "Super admins can delete TTS settings"
ON public.company_tts_settings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.company_id IS NULL
    AND ur.role = 'admin'
  )
);