-- Fix function pointing to old table and add triggers for messages

-- 1) Update timestamp function to reference live_chat_conversations
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.live_chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- 2) Ensure triggers exist on live_chat_messages
DROP TRIGGER IF EXISTS trg_update_last_message_at ON public.live_chat_messages;
CREATE TRIGGER trg_update_last_message_at
AFTER INSERT ON public.live_chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

DROP TRIGGER IF EXISTS trg_increment_unread ON public.live_chat_messages;
CREATE TRIGGER trg_increment_unread
AFTER INSERT ON public.live_chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.increment_unread_count();