-- Retry without IF NOT EXISTS (not supported in create policy)

-- Messages: allow assigned agents to insert
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Assigned agents can send messages"
    ON live_chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM live_chat_conversations c
        WHERE c.id = conversation_id AND c.assigned_agent_id = auth.uid()
      )
    );
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- Messages: explicit admin insert policy
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Admins can send any messages"
    ON live_chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (has_role(auth.uid(), 'admin'::text));
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;

-- Conversations: allow assigned agent to update
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Assigned agents can update conversations"
    ON live_chat_conversations FOR UPDATE
    TO authenticated
    USING (assigned_agent_id = auth.uid())
    WITH CHECK (assigned_agent_id = auth.uid());
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;