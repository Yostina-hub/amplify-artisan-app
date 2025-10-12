-- Create chat conversations table
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  guest_name TEXT,
  guest_email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'agent', 'guest')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_conversations
CREATE POLICY "Anyone can create conversations"
  ON public.chat_conversations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own conversations"
  ON public.chat_conversations
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR company_id = get_user_company_id(auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Agents can update company conversations"
  ON public.chat_conversations
  FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'admin'));

-- Policies for chat_messages
CREATE POLICY "Anyone can insert messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view conversation messages"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id
      AND (
        user_id = auth.uid()
        OR company_id = get_user_company_id(auth.uid())
        OR has_role(auth.uid(), 'admin')
      )
    )
  );

CREATE POLICY "Users can update their messages"
  ON public.chat_messages
  FOR UPDATE
  USING (sender_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_chat_conversations_user ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_company ON public.chat_conversations(company_id);
CREATE INDEX idx_chat_conversations_status ON public.chat_conversations(status);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Trigger to update last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();