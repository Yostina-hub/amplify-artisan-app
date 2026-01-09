-- Fix 1: Drop security definer views and recreate as regular views
DROP VIEW IF EXISTS public.social_media_accounts_safe CASCADE;
DROP VIEW IF EXISTS public.profiles_safe CASCADE;
DROP VIEW IF EXISTS public.email_configurations_safe CASCADE;
DROP VIEW IF EXISTS public.audit_log_view CASCADE;

-- Recreate views without SECURITY DEFINER (regular views respect RLS)
CREATE VIEW public.social_media_accounts_safe AS
SELECT id, user_id, company_id, platform, account_name, account_id,
       is_active, created_at, updated_at
FROM public.social_media_accounts;

CREATE VIEW public.profiles_safe AS
SELECT id, full_name, avatar_url, company_id, branch_id, created_at
FROM public.profiles;

CREATE VIEW public.email_configurations_safe AS
SELECT id, company_id, sender_name, sender_email, is_active, is_verified, created_at
FROM public.email_configurations;

CREATE VIEW public.audit_log_view AS
SELECT sal.id, sal.user_id, sal.action, sal.table_name, sal.record_id, 
       sal.details, sal.ip_address, sal.user_agent, sal.created_at,
       p.full_name as user_name
FROM public.security_audit_log sal
LEFT JOIN public.profiles p ON sal.user_id = p.id;

-- Fix 2: Set immutable search_path on all security definer functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.case_number := 'CASE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.live_chat_conversations
  SET unread_count = unread_count + 1
  WHERE id = NEW.conversation_id
  AND NEW.sender_type != 'user';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_scheduled_posts()
RETURNS VOID AS $$
BEGIN
  UPDATE public.social_media_posts
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{ready_to_publish}',
    'true'::jsonb
  )
  WHERE scheduled_for IS NOT NULL
    AND scheduled_for <= NOW()
    AND status = 'scheduled'
    AND (metadata->>'ready_to_publish')::boolean IS NOT TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 3: Add RLS policies for live_chat_messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Agents can view all messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Agents can send messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Anyone can view messages" ON public.live_chat_messages;

-- Messages: users can only access their own conversation messages
CREATE POLICY "Users can view their conversation messages"
ON public.live_chat_messages FOR SELECT TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM public.live_chat_conversations 
    WHERE user_id = auth.uid() OR assigned_agent_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can send messages to their conversations"
ON public.live_chat_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  conversation_id IN (
    SELECT id FROM public.live_chat_conversations 
    WHERE user_id = auth.uid() OR assigned_agent_id = auth.uid()
  )
);

CREATE POLICY "Admins can send messages"
ON public.live_chat_messages FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix 4: Add RLS policies for live_chat_conversations  
DROP POLICY IF EXISTS "Users can view their conversations" ON public.live_chat_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.live_chat_conversations;
DROP POLICY IF EXISTS "Agents can view all conversations" ON public.live_chat_conversations;
DROP POLICY IF EXISTS "Agents can update conversations" ON public.live_chat_conversations;
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.live_chat_conversations;
DROP POLICY IF EXISTS "Anyone can view conversations" ON public.live_chat_conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON public.live_chat_conversations;

-- Conversations: users can only see their own or assigned
CREATE POLICY "Users can view their own conversations"
ON public.live_chat_conversations FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR 
  assigned_agent_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create their own conversations"
ON public.live_chat_conversations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Agents can update assigned conversations"
ON public.live_chat_conversations FOR UPDATE TO authenticated
USING (
  assigned_agent_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin')
);

-- Fix 5: Clean up overlapping profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

-- Create clean, non-overlapping policies
CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid() OR 
  public.is_super_admin(auth.uid()) OR
  (company_id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "profiles_update_policy"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_update_policy"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "profiles_insert_policy"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_policy"
ON public.profiles FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));