-- Add storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat attachments
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR auth.uid() IS NOT NULL)
);

CREATE POLICY "Users can view chat attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR 
   EXISTS (
     SELECT 1 FROM chat_messages cm
     WHERE cm.metadata->>'attachment_url' LIKE '%' || name || '%'
     AND cm.conversation_id IN (
       SELECT id FROM chat_conversations 
       WHERE user_id = auth.uid() OR company_id = get_user_company_id(auth.uid())
     )
   ))
);

-- Add typing_users jsonb column to track who's typing
ALTER TABLE chat_conversations 
ADD COLUMN IF NOT EXISTS typing_users jsonb DEFAULT '[]'::jsonb;

-- Add agent status tracking
CREATE TABLE IF NOT EXISTS chat_agent_status (
  agent_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  status text DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE chat_agent_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view agent status"
ON chat_agent_status FOR SELECT
USING (true);

CREATE POLICY "Agents can update their status"
ON chat_agent_status FOR ALL
USING (auth.uid() = agent_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE chat_agent_status;