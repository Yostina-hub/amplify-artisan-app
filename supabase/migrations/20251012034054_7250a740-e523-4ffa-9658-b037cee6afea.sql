-- Rename and enhance chat tables
ALTER TABLE chat_conversations RENAME TO live_chat_conversations;
ALTER TABLE chat_messages RENAME TO live_chat_messages;

-- Add new columns to live_chat_conversations
ALTER TABLE live_chat_conversations
ADD COLUMN assigned_agent_id uuid REFERENCES auth.users(id),
ADD COLUMN priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN unread_count integer DEFAULT 0,
ADD COLUMN resolved_at timestamp with time zone,
ADD COLUMN resolved_by uuid REFERENCES auth.users(id),
ADD COLUMN tags text[] DEFAULT '{}',
ADD COLUMN rating integer CHECK (rating >= 1 AND rating <= 5);

-- Update status check constraint
ALTER TABLE live_chat_conversations DROP CONSTRAINT IF EXISTS live_chat_conversations_status_check;
ALTER TABLE live_chat_conversations ADD CONSTRAINT live_chat_conversations_status_check 
CHECK (status IN ('active', 'pending', 'resolved', 'archived'));

-- Add sender_name to messages for display
ALTER TABLE live_chat_messages
ADD COLUMN sender_name text,
ADD COLUMN is_ai_response boolean DEFAULT false;

-- Create typing indicators table
CREATE TABLE IF NOT EXISTS live_chat_typing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES live_chat_conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text,
  is_typing boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on typing table
ALTER TABLE live_chat_typing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage typing status"
ON live_chat_typing FOR ALL
USING (true)
WITH CHECK (true);

-- Create conversation statistics view
CREATE OR REPLACE VIEW live_chat_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'active') as active_chats,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_chats,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_chats,
  COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/60) FILTER (WHERE resolved_at IS NOT NULL), 0) as avg_resolution_time_minutes,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as chats_today
FROM live_chat_conversations;

-- Grant access to stats view
GRANT SELECT ON live_chat_stats TO authenticated;

-- Update RLS policies for renamed tables
DROP POLICY IF EXISTS "Users can view own conversations" ON live_chat_conversations;
DROP POLICY IF EXISTS "Agents can update company conversations" ON live_chat_conversations;
DROP POLICY IF EXISTS "Anyone can create conversations" ON live_chat_conversations;

CREATE POLICY "Users can view own conversations"
ON live_chat_conversations FOR SELECT
USING (
  user_id = auth.uid() 
  OR company_id = get_user_company_id(auth.uid()) 
  OR has_role(auth.uid(), 'admin')
  OR assigned_agent_id = auth.uid()
);

CREATE POLICY "Agents can manage conversations"
ON live_chat_conversations FOR UPDATE
USING (
  company_id = get_user_company_id(auth.uid()) 
  OR has_role(auth.uid(), 'admin')
  OR assigned_agent_id = auth.uid()
);

CREATE POLICY "Anyone can create conversations"
ON live_chat_conversations FOR INSERT
WITH CHECK (true);

-- Update message policies
DROP POLICY IF EXISTS "Users can view conversation messages" ON live_chat_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON live_chat_messages;
DROP POLICY IF EXISTS "Users can update their messages" ON live_chat_messages;

CREATE POLICY "Users can view conversation messages"
ON live_chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM live_chat_conversations
    WHERE live_chat_conversations.id = live_chat_messages.conversation_id
    AND (
      live_chat_conversations.user_id = auth.uid()
      OR live_chat_conversations.company_id = get_user_company_id(auth.uid())
      OR live_chat_conversations.assigned_agent_id = auth.uid()
      OR has_role(auth.uid(), 'admin')
    )
  )
);

CREATE POLICY "Anyone can insert messages"
ON live_chat_messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their messages"
ON live_chat_messages FOR UPDATE
USING (
  sender_id = auth.uid() 
  OR has_role(auth.uid(), 'admin')
);

-- Add realtime to new tables
ALTER PUBLICATION supabase_realtime ADD TABLE live_chat_typing;

-- Update trigger to use new table name
DROP TRIGGER IF EXISTS update_conversation_timestamp ON live_chat_messages;
CREATE TRIGGER update_conversation_timestamp
AFTER INSERT ON live_chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Create function to increment unread count
CREATE OR REPLACE FUNCTION increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE live_chat_conversations
  SET unread_count = unread_count + 1
  WHERE id = NEW.conversation_id
  AND NEW.sender_type != 'user';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER increment_unread_on_message
AFTER INSERT ON live_chat_messages
FOR EACH ROW
EXECUTE FUNCTION increment_unread_count();