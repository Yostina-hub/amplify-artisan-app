-- Add scheduled_publish column to landing_page_content table
ALTER TABLE public.landing_page_content
ADD COLUMN IF NOT EXISTS scheduled_publish TIMESTAMP WITH TIME ZONE;

-- Add metadata column to subscription_requests for AI analysis
ALTER TABLE public.subscription_requests
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_subscription_requests_metadata
ON public.subscription_requests USING GIN (metadata);

COMMENT ON COLUMN public.landing_page_content.scheduled_publish IS 'Scheduled publishing date/time for content';
COMMENT ON COLUMN public.subscription_requests.metadata IS 'Stores AI analysis results and other subscription metadata';