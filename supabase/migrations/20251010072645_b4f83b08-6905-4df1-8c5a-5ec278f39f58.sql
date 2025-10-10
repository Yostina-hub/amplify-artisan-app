-- Make phone nullable in subscription_requests and add company_id if not exists
ALTER TABLE public.subscription_requests 
ALTER COLUMN phone DROP NOT NULL;

-- Add company_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscription_requests' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.subscription_requests 
    ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;