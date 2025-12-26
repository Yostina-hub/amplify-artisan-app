import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Search, RefreshCw, Bell, TrendingUp, MessageSquare, Users, 
  Globe, AlertTriangle, Filter, Plus, ExternalLink, Clock,
  ThumbsUp, ThumbsDown, Minus, Eye, Share2, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

const platformColors: Record<string, string> = {
  twitter: 'bg-sky-500',
  facebook: 'bg-blue-600',
  instagram: 'bg-pink-500',
  youtube: 'bg-red-600',
  telegram: 'bg-blue-400',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-black',
  news: 'bg-gray-600',
};

export default function MediaMonitoring() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');

  // Fetch mentions
  const { data: mentions, isLoading: mentionsLoading } = useQuery({
    queryKey: ['media-mentions', selectedPlatform, selectedSentiment, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('media_mentions')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      if (selectedPlatform !== 'all') {
        query = query.eq('platform', selectedPlatform);
      }
      if (selectedSentiment !== 'all') {
        query = query.eq('sentiment_label', selectedSentiment);
      }
      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch clusters
  const { data: clusters } = useQuery({
    queryKey: ['media-clusters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_clusters')
        .select('*')
        .order('last_updated_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch alerts
  const { data: alerts } = useQuery({
    queryKey: ['media-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  // Ingest mutation
  const ingestMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('media-monitor-ingest', {
        body: {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Ingestion complete: ${data.new} new mentions`);
      queryClient.invalidateQueries({ queryKey: ['media-mentions'] });
    },
    onError: (error) => {
      toast.error('Ingestion failed: ' + error.message);
    },
  });

  // Stats
  const stats = {
    totalMentions: mentions?.length || 0,
    positive: mentions?.filter(m => m.sentiment_label === 'positive').length || 0,
    negative: mentions?.filter(m => m.sentiment_label === 'negative').length || 0,
    neutral: mentions?.filter(m => m.sentiment_label === 'neutral').length || 0,
    trending: clusters?.filter(c => c.is_trending).length || 0,
    unreadAlerts: alerts?.filter(a => !a.is_acknowledged).length || 0,
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'negative': return <ThumbsDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Monitoring</h1>
          <p className="text-muted-foreground">Track mentions across social media, news, and web</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => ingestMutation.mutate()} disabled={ingestMutation.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${ingestMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMentions}</p>
                <p className="text-xs text-muted-foreground">Total Mentions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.positive}</p>
                <p className="text-xs text-muted-foreground">Positive</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.negative}</p>
                <p className="text-xs text-muted-foreground">Negative</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Minus className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{stats.neutral}</p>
                <p className="text-xs text-muted-foreground">Neutral</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.trending}</p>
                <p className="text-xs text-muted-foreground">Trending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.unreadAlerts}</p>
                <p className="text-xs text-muted-foreground">Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="mentions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="clusters">Stories</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="mentions" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mentions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Platforms</option>
              <option value="twitter">Twitter/X</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="telegram">Telegram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="news">News</option>
            </select>
            <select
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          {/* Mentions List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {mentionsLoading ? (
                <p className="text-center py-8 text-muted-foreground">Loading mentions...</p>
              ) : mentions?.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No mentions found. Add sources and sync to start monitoring.</p>
                  </CardContent>
                </Card>
              ) : (
                mentions?.map((mention: any) => (
                  <Card key={mention.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full ${platformColors[mention.platform] || 'bg-gray-500'} flex items-center justify-center text-white text-xs font-bold`}>
                            {mention.platform?.substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{mention.author_name || 'Unknown'}</span>
                            <span className="text-muted-foreground text-sm">{mention.author_handle}</span>
                            {mention.author_verified && (
                              <Badge variant="secondary" className="text-xs">Verified</Badge>
                            )}
                            <span className="text-muted-foreground text-xs ml-auto">
                              {mention.published_at && format(new Date(mention.published_at), 'MMM d, HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm mb-2">{mention.content}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {getSentimentIcon(mention.sentiment_label)}
                              {mention.sentiment_label}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {mention.engagement_views?.toLocaleString() || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {mention.engagement_likes?.toLocaleString() || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="h-3 w-3" />
                              {mention.engagement_shares?.toLocaleString() || 0}
                            </span>
                            <Badge variant="outline" className="text-xs">{mention.language?.toUpperCase()}</Badge>
                            {mention.permalink && (
                              <a href={mention.permalink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                View
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="clusters">
          <div className="grid gap-4">
            {clusters?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No story clusters yet. Stories will be grouped automatically.</p>
                </CardContent>
              </Card>
            ) : (
              clusters?.map((cluster: any) => (
                <Card key={cluster.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cluster.title}</CardTitle>
                        <CardDescription>{cluster.summary}</CardDescription>
                      </div>
                      {cluster.is_trending && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Trending
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>{cluster.mention_count} mentions</span>
                      <span>{cluster.total_reach?.toLocaleString()} reach</span>
                      <span className="flex items-center gap-1">
                        {getSentimentIcon(cluster.dominant_sentiment)}
                        {cluster.dominant_sentiment}
                      </span>
                      <span className="ml-auto">
                        First seen: {cluster.first_seen_at && format(new Date(cluster.first_seen_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="grid gap-4">
            {alerts?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No alerts triggered. Configure alert rules to get notified.</p>
                </CardContent>
              </Card>
            ) : (
              alerts?.map((alert: any) => (
                <Card key={alert.id} className={!alert.is_acknowledged ? 'border-l-4 border-l-yellow-500' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className={`h-5 w-5 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'high' ? 'text-orange-500' :
                        'text-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{alert.title}</span>
                          <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.summary}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {alert.created_at && format(new Date(alert.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle>Configure Sources</CardTitle>
              <CardDescription>Add and manage your media monitoring sources</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Configure social media accounts, news sites, and RSS feeds to monitor.</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
