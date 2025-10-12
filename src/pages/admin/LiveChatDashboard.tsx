import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Users, Clock, CheckCircle2, Send, User, Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  status: string;
  priority: string;
  assigned_agent_id: string | null;
  unread_count: number;
  last_message_at: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_type: 'user' | 'agent' | 'guest';
  sender_name: string | null;
  message: string;
  is_ai_response: boolean;
  created_at: string;
}

interface Stats {
  active_chats: number;
  pending_chats: number;
  resolved_chats: number;
  avg_resolution_time_minutes: number;
  chats_today: number;
}

const LiveChatDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchStats();
    fetchConversations();

    const channel = supabase
      .channel('admin-live-chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_chat_conversations' }, () => {
        fetchConversations();
        fetchStats();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_chat_messages' }, (payload) => {
        if (selectedConv && payload.new.conversation_id === selectedConv.id) {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv?.id]);

  const fetchStats = async () => {
    const { data } = await supabase.from('live_chat_stats').select('*').single();
    if (data) setStats(data as Stats);
  };

  const fetchConversations = async () => {
    let query = supabase
      .from('live_chat_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data } = await query;
    if (data) setConversations(data as Conversation[]);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data } = await supabase
      .from('live_chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) setMessages(data as Message[]);
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    fetchMessages(conv.id);
    
    // Mark as read
    supabase
      .from('live_chat_conversations')
      .update({ unread_count: 0 })
      .eq('id', conv.id)
      .then(() => fetchConversations());
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConv) return;

    const { error } = await supabase
      .from('live_chat_messages')
      .insert({
        conversation_id: selectedConv.id,
        sender_id: user?.id,
        sender_type: 'agent',
        message: messageInput.trim(),
        is_ai_response: false,
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } else {
      setMessageInput('');
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedConv) return;

    const { error } = await supabase
      .from('live_chat_conversations')
      .update({ assigned_agent_id: user?.id, status: 'active' })
      .eq('id', selectedConv.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to assign', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Conversation assigned to you' });
      fetchConversations();
    }
  };

  const handleResolve = async () => {
    if (!selectedConv) return;

    const { error } = await supabase
      .from('live_chat_conversations')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: user?.id })
      .eq('id', selectedConv.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to resolve', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Conversation marked as resolved' });
      setSelectedConv(null);
      fetchConversations();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Live Chat Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Manage customer conversations in real-time</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active_chats}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-orange-500/10">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending_chats}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.resolved_chats}</p>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Math.round(stats.avg_resolution_time_minutes)}m</p>
                  <p className="text-sm text-muted-foreground">Avg Time</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.chats_today}</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Chat Interface */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <Card className="md:col-span-1">
            <div className="p-4 border-b">
              <Tabs value={filterStatus} onValueChange={(v) => { setFilterStatus(v); fetchConversations(); }}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <ScrollArea className="h-[600px]">
              <div className="p-2 space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-muted ${
                      selectedConv?.id === conv.id ? 'bg-primary/10 border-2 border-primary' : 'border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-primary/10">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {conv.guest_name || conv.guest_email || 'Anonymous'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      {conv.unread_count > 0 && (
                        <Badge variant="destructive" className="rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant={conv.status === 'active' ? 'default' : conv.status === 'pending' ? 'secondary' : 'outline'}>
                        {conv.status}
                      </Badge>
                      <Badge variant="outline">{conv.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Messages Panel */}
          <Card className="md:col-span-2">
            {selectedConv ? (
              <>
                <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10">
                  <div>
                    <h3 className="font-semibold">{selectedConv.guest_name || selectedConv.guest_email || 'Anonymous'}</h3>
                    <p className="text-sm text-muted-foreground">{selectedConv.guest_email}</p>
                  </div>
                  <div className="flex gap-2">
                    {!selectedConv.assigned_agent_id && (
                      <Button onClick={handleAssignToMe} size="sm">Assign to Me</Button>
                    )}
                    {selectedConv.status !== 'resolved' && (
                      <Button onClick={handleResolve} size="sm" variant="outline">Mark Resolved</Button>
                    )}
                  </div>
                </div>

                <ScrollArea className="h-[450px] p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          msg.sender_type === 'agent'
                            ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground'
                            : msg.is_ai_response
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                            : 'bg-muted'
                        }`}>
                          {msg.is_ai_response && (
                            <div className="flex items-center gap-1 mb-1 text-xs opacity-90">
                              <Bot className="h-3 w-3" />
                              <span>AI Assistant</span>
                            </div>
                          )}
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[600px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
  );
};

export default LiveChatDashboard;
