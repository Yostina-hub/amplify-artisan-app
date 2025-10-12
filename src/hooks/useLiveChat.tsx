import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_type: 'user' | 'agent' | 'guest';
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: {
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
    reactions?: Record<string, string[]>;
  };
}

interface Conversation {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  status: string;
  last_message_at: string;
  typing_users?: string[];
}

export const useLiveChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'online' | 'away' | 'offline'>('offline');
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize or fetch conversation
  const initConversation = useCallback(async (guestName?: string, guestEmail?: string) => {
    setLoading(true);
    try {
      // Check for existing conversation
      let query = supabase
        .from('live_chat_conversations')
        .select('*')
        .in('status', ['active', 'pending']);

      if (user) {
        query = query.eq('user_id', user.id);
      } else if (guestEmail) {
        query = query.eq('guest_email', guestEmail);
      }

      const { data: existing } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (existing) {
        setConversation(existing as Conversation);
        return existing.id;
      }

      // Create new conversation
      if (user) {
        const { data: newConv, error } = await supabase
          .from('live_chat_conversations')
          .insert({
            user_id: user.id,
            guest_name: guestName || null,
            guest_email: guestEmail || null,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;
        setConversation(newConv as Conversation);
        return newConv.id;
      } else {
        // Guest flow: use backend function (bypasses RLS safely)
        const { data: fnData, error: fnError } = await supabase.functions.invoke('live-chat-init', {
          body: {
            guest_name: guestName || null,
            guest_email: guestEmail || null,
          },
        });
        if (fnError) throw fnError;
        const conv = (fnData as any)?.conversation || (fnData as any);
        setConversation(conv as Conversation);
        return conv.id as string;
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start chat',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Fetch messages
  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data, error } = await supabase
      .from('live_chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages((data || []) as Message[]);
  }, []);

  // Send message with optional attachment
  const sendMessage = useCallback(async (
    text: string, 
    conversationId: string,
    attachment?: { url: string; name: string; type: string }
  ) => {
    if (!text.trim() && !attachment) return;

    const metadata = attachment ? {
      attachment_url: attachment.url,
      attachment_name: attachment.name,
      attachment_type: attachment.type,
    } : {};

    if (user) {
      const { error } = await supabase
        .from('live_chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: 'user',
          message: text.trim() || 'Sent a file',
          metadata,
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
        return;
      }

      try {
        await supabase.functions.invoke('live-chat-ai-responder', {
          body: { conversation_id: conversationId },
        });
      } catch (invokeError) {
        console.error('AI responder invoke failed:', invokeError);
      }
    } else {
      // Guest flow: send via backend (also triggers AI)
      const { error: fnError } = await supabase.functions.invoke('live-chat-send', {
        body: {
          conversation_id: conversationId,
          message: text.trim(),
          attachment,
        },
      });

      if (fnError) {
        console.error('Guest send failed:', fnError);
        toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
        return;
      }
    }
  }, [user, toast]);

  // Upload file
  const uploadFile = useCallback(async (file: File, conversationId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${conversationId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      return { url: publicUrl, name: file.name, type: file.type };
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Typing indicator
  const setTypingIndicator = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const userId = user?.id || 'guest';
    const currentTypers = conversation?.typing_users || [];
    
    let newTypers = isTyping 
      ? [...new Set([...currentTypers, userId])]
      : currentTypers.filter(id => id !== userId);

    await supabase
      .from('live_chat_conversations')
      .update({ typing_users: newTypers })
      .eq('id', conversationId);

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setTypingIndicator(conversationId, false);
      }, 3000);
    }
  }, [conversation, user]);

  // Add reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const userId = user?.id || 'guest';
    const reactions = message.metadata?.reactions || {};
    const emojiReactions = reactions[emoji] || [];
    
    const newReactions = {
      ...reactions,
      [emoji]: emojiReactions.includes(userId) 
        ? emojiReactions.filter(id => id !== userId)
        : [...emojiReactions, userId]
    };

    const { error } = await supabase
      .from('live_chat_messages')
      .update({ 
        metadata: { 
          ...message.metadata, 
          reactions: newReactions 
        } 
      })
      .eq('id', messageId);

    if (error) {
      console.error('Error adding reaction:', error);
    }
  }, [messages, user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!conversation?.id) return;

    fetchMessages(conversation.id);

    const channel = supabase
      .channel(`chat:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          setMessages((prev) => [...prev, {
            ...newMessage,
            sender_type: newMessage.sender_type as 'user' | 'agent' | 'guest'
          }]);
          setIsTyping(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_chat_conversations',
          filter: `id=eq.${conversation.id}`,
        },
        (payload) => {
          const updated = payload.new as Conversation;
          setConversation(updated);
          const typingUsers = updated.typing_users || [];
          setIsTyping(typingUsers.length > 0 && !typingUsers.includes(user?.id || 'guest'));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_agent_status',
        },
        (payload) => {
          const status = payload.new as any;
          if (status.status === 'online' || status.status === 'away' || status.status === 'offline') {
            setAgentStatus(status.status);
          }
        }
      )
      .subscribe();

    // Fetch initial agent status
    supabase
      .from('chat_agent_status')
      .select('status')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data && (data.status === 'online' || data.status === 'away' || data.status === 'offline')) {
          setAgentStatus(data.status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, fetchMessages, user?.id]);

  return {
    conversation,
    messages,
    loading,
    isTyping,
    agentStatus,
    initConversation,
    sendMessage,
    uploadFile,
    setTypingIndicator,
    addReaction,
  };
};
