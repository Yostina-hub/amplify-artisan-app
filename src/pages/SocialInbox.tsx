import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Inbox, MessageCircle, Send, RefreshCw, Search, Filter, Sparkles, Languages, Star, Tag, AlertCircle, Heart, Eye, Share2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PageHelp } from "@/components/PageHelp";
import { pageHelpContent } from "@/lib/pageHelpContent";

const PLATFORMS_CONFIG = {
  twitter: { color: "bg-[#1DA1F2]", name: "Twitter" },
  instagram: { color: "bg-gradient-to-r from-[#E4405F] to-[#d62d4f]", name: "Instagram" },
  facebook: { color: "bg-[#1877F2]", name: "Facebook" },
  linkedin: { color: "bg-[#0A66C2]", name: "LinkedIn" },
  telegram: { color: "bg-[#0088cc]", name: "Telegram" },
  whatsapp: { color: "bg-[#25D366]", name: "WhatsApp" },
};

const SENTIMENTS = {
  positive: { color: "text-green-600 bg-green-50 dark:bg-green-950", label: "Positive", icon: "😊" },
  negative: { color: "text-red-600 bg-red-50 dark:bg-red-950", label: "Negative", icon: "😞" },
  neutral: { color: "text-gray-600 bg-gray-50 dark:bg-gray-950", label: "Neutral", icon: "😐" },
  urgent: { color: "text-orange-600 bg-orange-50 dark:bg-orange-950", label: "Urgent", icon: "⚠️" },
};

export default function SocialInbox() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [aiTranslating, setAiTranslating] = useState(false);
  const [translatedReply, setTranslatedReply] = useState('');

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['social-conversations', platformFilter, sentimentFilter],
    queryFn: async () => {
      let query = supabase
        .from('social_conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (platformFilter !== 'all') {
        query = query.eq('platform', platformFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch Telegram post metrics
  const { data: telegramPosts } = useQuery({
    queryKey: ['telegram-posts-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_media_posts')
        .select('id, content, likes, shares, views, platform_post_ids, updated_at')
        .contains('platforms', ['telegram'])
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const telegramMetricsSyncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-telegram-metrics');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['telegram-posts-metrics'] });
      toast({
        title: 'Telegram Metrics Synced',
        description: `Synced ${data?.syncedCount || 0} posts`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Could not sync Telegram metrics',
        variant: 'destructive',
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (platform: string) => {
      const { data, error } = await supabase.functions.invoke('fetch-social-messages', {
        body: { platform }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-conversations'] });
      toast({
        title: 'Messages Synced',
        description: 'Successfully synced all platforms',
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ conversationId, chatId, replyText }: { conversationId: string; chatId?: string; replyText: string }) => {
      const { data, error } = await supabase.functions.invoke('reply-to-telegram', {
        body: { conversationId, chatId, replyText }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-conversations'] });
      setReplyText('');
      toast({
        title: 'Reply Sent',
        description: 'Your message was sent successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Send',
        description: error.message || 'Could not send your reply',
        variant: 'destructive',
      });
    },
  });

  const analyzeMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
        body: { 
          contentId: messageId,
          contentType: 'message',
          content: selectedConversation?.content 
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Sentiment Analyzed',
        description: `This message is ${data.sentiment} (${Math.round(data.confidence * 100)}% confidence)`,
      });
    },
  });

  const translateMessage = async (targetLang: string) => {
    if (!selectedConversation) return;
    
    setAiTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-social-content', {
        body: {
          prompt: `Translate this message to ${targetLang}: "${selectedConversation.content}"`,
          platforms: [selectedConversation.platform],
        }
      });
      
      if (error) throw error;
      if (data?.content) {
        setTranslatedReply(data.content);
        toast({ title: 'Translation Ready', description: 'AI translated your message' });
      }
    } catch (error) {
      toast({ title: 'Translation Failed', variant: 'destructive' });
    } finally {
      setAiTranslating(false);
    }
  };

  const unreadCount = conversations?.filter(c => c.status === 'unread').length || 0;
  const urgentCount = 0;

  const filteredConversations = conversations?.filter(c =>
    (c.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participant_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 animate-in fade-in-50 duration-700">
      <div className="container mx-auto p-6 space-y-6">
        <PageHelp
          title={pageHelpContent.socialInbox.title}
          description={pageHelpContent.socialInbox.description}
          features={pageHelpContent.socialInbox.features}
          tips={pageHelpContent.socialInbox.tips}
        />
        {/* Header */}
        <div className="flex items-center justify-between backdrop-blur-sm bg-card/50 p-6 rounded-2xl border-2">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Unified Social Inbox
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              AI-powered multi-platform messaging hub
            </p>
            <div className="flex gap-3 mt-3">
              {unreadCount > 0 && (
                <Badge variant="destructive" className="gap-2 px-3 py-1">
                  <Inbox className="h-4 w-4" />
                  {unreadCount} Unread
                </Badge>
              )}
              {urgentCount > 0 && (
                <Badge variant="default" className="gap-2 px-3 py-1 bg-orange-500">
                  <AlertCircle className="h-4 w-4" />
                  {urgentCount} Urgent
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {Object.entries(PLATFORMS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => syncMutation.mutate('all')}
              disabled={syncMutation.isPending}
              className="shadow-md"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", syncMutation.isPending && "animate-spin")} />
              Sync All
            </Button>
          </div>
        </div>

        {/* Main Inbox */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '700px' }}>
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col border-2 backdrop-blur-sm bg-card/95 shadow-xl">
            <CardHeader>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread">Unread</TabsTrigger>
                    <TabsTrigger value="starred">Starred</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading conversations...</p>
                    </div>
                  ) : filteredConversations && filteredConversations.length > 0 ? (
                    filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={cn(
                          "p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg",
                          selectedConversation?.id === conv.id
                            ? 'bg-gradient-to-r from-primary/10 to-accent/10 border-primary shadow-md'
                            : conv.status === 'unread'
                            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                            : 'hover:bg-muted/50 border-border'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12 ring-2 ring-border">
                            <AvatarImage src={conv.participant_avatar} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                              {conv.participant_name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-semibold truncate">{conv.participant_name}</p>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", PLATFORMS_CONFIG[conv.platform as keyof typeof PLATFORMS_CONFIG]?.color, "text-white border-none")}
                              >
                                {PLATFORMS_CONFIG[conv.platform as keyof typeof PLATFORMS_CONFIG]?.name || conv.platform}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{format(new Date(conv.created_at), 'MMM d, h:mm a')}</span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{conv.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium text-muted-foreground">No conversations yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Connect your accounts to start</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Conversation View */}
          <Card className="lg:col-span-2 flex flex-col border-2 backdrop-blur-sm bg-card/95 shadow-xl overflow-hidden">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b-2 bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 ring-2 ring-primary">
                        <AvatarImage src={selectedConversation.participant_avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold text-lg">
                          {selectedConversation.participant_name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl">{selectedConversation.participant_name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn(PLATFORMS_CONFIG[selectedConversation.platform as keyof typeof PLATFORMS_CONFIG]?.color, "text-white border-none")}>
                            {PLATFORMS_CONFIG[selectedConversation.platform as keyof typeof PLATFORMS_CONFIG]?.name}
                          </Badge>
                          <Badge variant="outline">{selectedConversation.message_type}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => analyzeMessageMutation.mutate(selectedConversation.id)}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                      <Select onValueChange={translateMessage}>
                        <SelectTrigger className="w-[140px]">
                          <Languages className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Translate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                          <SelectItem value="ar">Arabic</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-hidden p-0 flex flex-col min-h-0">
                  <ScrollArea className="flex-1 p-6 min-h-0" style={{ maxHeight: '350px' }}>
                    <div className="space-y-6">
                      {/* Original Message */}
                      <div className={cn(
                        "flex",
                        selectedConversation.direction === 'outbound' ? 'justify-end' : 'justify-start'
                      )}>
                        <div className={cn(
                          "max-w-[80%] rounded-2xl p-5 shadow-md",
                          selectedConversation.direction === 'outbound'
                            ? 'bg-gradient-to-r from-primary to-accent text-white'
                            : 'bg-muted border-2'
                        )}>
                          <p className="whitespace-pre-wrap leading-relaxed">{selectedConversation.content}</p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                            <p className="text-xs opacity-70">
                              {format(new Date(selectedConversation.created_at), 'MMM d, yyyy • h:mm a')}
                            </p>
                            {selectedConversation.sentiment && (
                              <Badge variant="secondary" className={cn("text-xs", SENTIMENTS[selectedConversation.sentiment as keyof typeof SENTIMENTS]?.color)}>
                                {SENTIMENTS[selectedConversation.sentiment as keyof typeof SENTIMENTS]?.icon} {SENTIMENTS[selectedConversation.sentiment as keyof typeof SENTIMENTS]?.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AI Insights */}
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-purple-900 dark:text-purple-300">AI Insights</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                            <span>Response Priority</span>
                            <Badge variant="default" className="bg-purple-600">High</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                            <span>Sentiment</span>
                            <Badge variant="secondary">{selectedConversation.sentiment || 'Analyzing...'}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                            <span>Suggested Action</span>
                            <Badge variant="outline">Reply ASAP</Badge>
                          </div>
                        </div>
                      </div>

                      {/* Telegram Post Metrics */}
                      {selectedConversation.platform === 'telegram' && telegramPosts && telegramPosts.length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 rounded-xl border-2 border-cyan-200 dark:border-cyan-800">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Send className="h-4 w-4 text-cyan-600" />
                              <span className="font-semibold text-cyan-900 dark:text-cyan-300">Telegram Post Metrics</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => telegramMetricsSyncMutation.mutate()}
                              disabled={telegramMetricsSyncMutation.isPending}
                              className="h-7 px-2"
                            >
                              <RefreshCw className={cn("h-3 w-3", telegramMetricsSyncMutation.isPending && "animate-spin")} />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {telegramPosts.slice(0, 3).map((post) => {
                              const platformIds = post.platform_post_ids as Record<string, any> | null;
                              const telegramData = platformIds?.telegram;
                              return (
                                <div key={post.id} className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                                  <p className="text-xs text-muted-foreground truncate mb-2">
                                    {post.content?.substring(0, 50)}...
                                  </p>
                                  <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1">
                                      <Heart className="h-3 w-3 text-red-500" />
                                      <span>{post.likes || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Eye className="h-3 w-3 text-cyan-500" />
                                      <span>{post.views || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Share2 className="h-3 w-3 text-blue-500" />
                                      <span>{post.shares || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Translated Reply Preview */}
                      {translatedReply && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Translated Reply</span>
                            <Button size="sm" variant="ghost" onClick={() => setReplyText(translatedReply)}>
                              Use This
                            </Button>
                          </div>
                          <p className="text-sm">{translatedReply}</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <Separator />

                  {/* Reply Section */}
                  <div className="p-6 bg-gradient-to-r from-card to-accent/5">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // AI-generate suggested reply
                            toast({ title: 'Generating AI reply...' });
                          }}
                          className="gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          AI Suggest
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Tag className="h-4 w-4" />
                          Templates
                        </Button>
                      </div>

                      <Textarea
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="min-h-[100px] resize-none text-base"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && replyText.trim()) {
                            e.preventDefault();
                            if (selectedConversation.platform === 'telegram') {
                              const chatId = selectedConversation.metadata?.chat_id || selectedConversation.participant_id;
                              replyMutation.mutate({
                                conversationId: selectedConversation.id,
                                chatId: chatId,
                                replyText: replyText.trim()
                              });
                            }
                          }
                        }}
                      />

                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          ⌘ + Enter to send {selectedConversation.platform === 'telegram' ? '(Telegram)' : ''}
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setReplyText('')}>
                            Cancel
                          </Button>
                          <Button 
                            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-md"
                            disabled={!replyText.trim() || replyMutation.isPending}
                            onClick={() => {
                              if (selectedConversation.platform === 'telegram') {
                                const chatId = selectedConversation.metadata?.chat_id || selectedConversation.participant_id;
                                console.log('Sending reply to chat_id:', chatId, 'metadata:', selectedConversation.metadata);
                                replyMutation.mutate({
                                  conversationId: selectedConversation.id,
                                  chatId: chatId,
                                  replyText: replyText.trim()
                                });
                              } else {
                                toast({
                                  title: 'Not Supported Yet',
                                  description: `Replying to ${selectedConversation.platform} is coming soon`,
                                  variant: 'default'
                                });
                              }
                            }}
                          >
                            {replyMutation.isPending ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full opacity-20 animate-pulse"></div>
                    <MessageCircle className="h-16 w-16 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-2xl font-semibold mb-2">Select a Conversation</p>
                  <p className="text-muted-foreground">Choose from the list to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}