-- Fix existing auth.users rows with invalid NULL value in email_change causing signup errors
UPDATE auth.users
SET email_change = ''
WHERE email_change IS NULL;