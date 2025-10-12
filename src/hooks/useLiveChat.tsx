import { useState, useEffect, useCallback } from 'react';
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
}

interface Conversation {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  status: string;
  last_message_at: string;
}

export const useLiveChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize or fetch conversation
  const initConversation = useCallback(async (guestName?: string, guestEmail?: string) => {
    setLoading(true);
    try {
      // Check for existing conversation
      let query = supabase
        .from('chat_conversations')
        .select('*')
        .eq('status', 'active');

      if (user) {
        query = query.eq('user_id', user.id);
      } else if (guestEmail) {
        query = query.eq('guest_email', guestEmail);
      }

      const { data: existing } = await query.order('created_at', { ascending: false }).limit(1).single();

      if (existing) {
        setConversation(existing);
        return existing.id;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user?.id || null,
          guest_name: guestName || null,
          guest_email: guestEmail || null,
        })
        .select()
        .single();

      if (error) throw error;
      setConversation(newConv);
      return newConv.id;
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
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages((data || []) as Message[]);
  }, []);

  // Send message
  const sendMessage = useCallback(async (text: string, conversationId: string) => {
    if (!text.trim()) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user?.id || null,
        sender_type: user ? 'user' : 'guest',
        message: text.trim(),
      });

    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

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
          table: 'chat_messages',
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id, fetchMessages]);

  return {
    conversation,
    messages,
    loading,
    isTyping,
    initConversation,
    sendMessage,
  };
};
