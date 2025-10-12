-- Fix RLS policies for guest users - drop all existing policies first

-- Drop ALL existing policies for live_chat_conversations
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'live_chat_conversations') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON live_chat_conversations';
    END LOOP;
END $$;

-- Drop ALL existing policies for live_chat_messages
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'live_chat_messages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON live_chat_messages';
    END LOOP;
END $$;

-- Live Chat Conversations Policies (Allow both authenticated users and guests)
CREATE POLICY "Anyone can create conversations"
ON live_chat_conversations FOR INSERT
TO authenticated, anon
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
    ELSE user_id IS NULL AND guest_email IS NOT NULL
  END
);

CREATE POLICY "Users can view their conversations"
ON live_chat_conversations FOR SELECT
TO authenticated, anon
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
    ELSE user_id IS NULL
  END
  OR has_role(auth.uid(), 'admin'::text)
);

CREATE POLICY "Users can update their conversations"
ON live_chat_conversations FOR UPDATE
TO authenticated, anon
USING (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
    ELSE user_id IS NULL
  END
  OR has_role(auth.uid(), 'admin'::text)
);

CREATE POLICY "Admins can manage all conversations"
ON live_chat_conversations FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));

-- Live Chat Messages Policies (Allow both authenticated users and guests)
CREATE POLICY "Anyone can send messages"
ON live_chat_messages FOR INSERT
TO authenticated, anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM live_chat_conversations 
    WHERE id = conversation_id
    AND (
      CASE 
        WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
        ELSE user_id IS NULL
      END
    )
  )
);

CREATE POLICY "Users can view conversation messages"
ON live_chat_messages FOR SELECT
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM live_chat_conversations 
    WHERE id = conversation_id
    AND (
      CASE 
        WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
        ELSE user_id IS NULL
      END
      OR has_role(auth.uid(), 'admin'::text)
    )
  )
);

CREATE POLICY "Admins can manage all messages"
ON live_chat_messages FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::text));