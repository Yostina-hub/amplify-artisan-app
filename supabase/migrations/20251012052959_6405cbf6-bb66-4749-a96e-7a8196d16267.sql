-- Fix legacy constraint name causing live chat inserts to fail
-- Drop the old check constraint that remained after table rename
ALTER TABLE public.live_chat_conversations
  DROP CONSTRAINT IF EXISTS chat_conversations_status_check;

-- Ensure we have the correct status constraint in place
ALTER TABLE public.live_chat_conversations
  DROP CONSTRAINT IF EXISTS live_chat_conversations_status_check;

ALTER TABLE public.live_chat_conversations
  ADD CONSTRAINT live_chat_conversations_status_check
  CHECK (status IN ('active', 'pending', 'resolved', 'archived'));

-- Optional but helpful: set a sane default so inserts without explicit status succeed
ALTER TABLE public.live_chat_conversations
  ALTER COLUMN status SET DEFAULT 'pending';