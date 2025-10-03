-- Remove duplicate Telegram entries (keep only lowercase one)
DELETE FROM public.social_platforms 
WHERE name = 'Telegram' AND id != 'a3172d6d-a3b0-4638-a419-3f30254b1033';

-- Update any subscriptions pointing to the old Telegram to point to the correct one
UPDATE public.company_platform_subscriptions 
SET platform_id = 'a3172d6d-a3b0-4638-a419-3f30254b1033'
WHERE platform_id IN (
  SELECT id FROM public.social_platforms WHERE name = 'Telegram'
);