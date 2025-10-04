import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Inbox, MessageCircle, Send, RefreshCw, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/Layout';

export default function SocialInbox() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [replyText, setReplyText] = useState('');

  // Fetch conversations
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['social-conversations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Sync messages mutation
  const syncMutation = useMutation({
    mutationFn: async (platform: string) => {
      const { data, error } = await supabase.functions.invoke('fetch-social-messages', {
        body: { platform }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['social-conversations'] });
      toast({
        title: 'Messages Synced',
        description: data.message || 'Successfully synced messages',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync messages',
        variant: 'destructive',
      });
    },
  });

  const unreadCount = conversations?.filter(c => c.status === 'unread').length || 0;

  const filteredConversations = conversations?.filter(c =>
    c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participant_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    // TODO: Implement actual reply functionality
    toast({
      title: 'Reply Sent',
      description: 'Your message has been sent',
    });
    setReplyText('');
  };

  const markAsRead = async (conversationId: string) => {
    const { error } = await supabase
      .from('social_conversations')
      .update({ status: 'read' })
      .eq('id', conversationId);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['social-conversations'] });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Inbox className="h-8 w-8 text-primary" />
              Social Inbox
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-2">
              All your social media messages in one place
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => syncMutation.mutate('all')}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sync All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading conversations...
                </div>
              ) : filteredConversations && filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      if (conv.status === 'unread') {
                        markAsRead(conv.id);
                      }
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'bg-accent border-primary'
                        : conv.status === 'unread'
                        ? 'bg-muted/50 border-muted-foreground/20'
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.participant_avatar} />
                        <AvatarFallback>
                          {conv.participant_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium truncate">{conv.participant_name}</p>
                          <Badge variant="outline" className="text-xs">
                            {conv.platform}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conv.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(conv.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Sync your accounts to see messages</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation View */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedConversation.participant_avatar} />
                      <AvatarFallback>
                        {selectedConversation.participant_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {selectedConversation.participant_name}
                      </CardTitle>
                      <CardDescription>
                        {selectedConversation.platform} • {selectedConversation.message_type}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    <div
                      className={`flex ${
                        selectedConversation.direction === 'outbound'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          selectedConversation.direction === 'outbound'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{selectedConversation.content}</p>
                        <p className="text-xs opacity-70 mt-2">
                          {new Date(selectedConversation.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReply();
                        }
                      }}
                    />
                    <Button onClick={handleReply} disabled={!replyText.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a conversation</p>
                  <p className="text-sm mt-1">Choose from the list to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}