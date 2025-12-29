import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Eye, Heart, 
  MessageCircle, Share2, RefreshCw, Zap, Activity, Target,
  ThumbsUp, ThumbsDown, Minus, Globe, Calendar, Clock,
  PieChart, LineChart, Sparkles, AlertCircle, CheckCircle2,
  Facebook, Twitter, Instagram, Linkedin, Youtube, Send, Play
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, 
  PieChart as RechartsPie, Pie, Cell, Tooltip as RechartsTooltip,
  BarChart, Bar, LineChart as RechartsLineChart, Line, Legend,
  CartesianGrid
} from 'recharts';

// Platform configurations
const platformConfig: Record<string, { icon: any; color: string; bgColor: string; name: string }> = {
  twitter: { icon: Twitter, color: 'text-sky-400', bgColor: 'bg-sky-500/10', name: 'X / Twitter' },
  facebook: { icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-600/10', name: 'Facebook' },
  instagram: { icon: Instagram, color: 'text-pink-500', bgColor: 'bg-pink-500/10', name: 'Instagram' },
  youtube: { icon: Youtube, color: 'text-red-600', bgColor: 'bg-red-600/10', name: 'YouTube' },
  telegram: { icon: Send, color: 'text-blue-400', bgColor: 'bg-blue-400/10', name: 'Telegram' },
  linkedin: { icon: Linkedin, color: 'text-blue-700', bgColor: 'bg-blue-700/10', name: 'LinkedIn' },
  tiktok: { icon: Play, color: 'text-foreground', bgColor: 'bg-foreground/5', name: 'TikTok' },
};

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function SocialAnalytics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  // Fetch connected accounts
  const { data: connectedAccounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['social-accounts-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_platform_tokens')
        .select('*')
        .eq('is_active', true)
        .order('platform');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch media mentions with sentiment
  const { data: mentions, isLoading: mentionsLoading } = useQuery({
    queryKey: ['analytics-mentions', dateRange, selectedPlatform],
    queryFn: async () => {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const startDate = subDays(new Date(), days).toISOString();
      
      let query = supabase
        .from('media_mentions')
        .select('*')
        .gte('published_at', startDate)
        .order('published_at', { ascending: false });

      if (selectedPlatform !== 'all') {
        query = query.eq('platform', selectedPlatform);
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch sentiment analysis data
  const { data: sentimentData } = useQuery({
    queryKey: ['sentiment-analytics', dateRange],
    queryFn: async () => {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const startDate = subDays(new Date(), days).toISOString();
      
      const { data, error } = await supabase
        .from('sentiment_analysis')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('social-sync', {
        body: { analyzeSentiments: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced} new posts from ${data.accounts} accounts`);
      queryClient.invalidateQueries({ queryKey: ['analytics-mentions'] });
      queryClient.invalidateQueries({ queryKey: ['sentiment-analytics'] });
    },
    onError: (error) => {
      toast.error('Sync failed: ' + error.message);
    },
  });

  // Telegram metrics sync mutation
  const telegramMetricsSyncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-telegram-metrics');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.synced > 0) {
        toast.success(data.message || `Synced Telegram metrics for ${data.synced} posts`);
      } else {
        toast.info(data.error || 'No Telegram posts to sync');
      }
      queryClient.invalidateQueries({ queryKey: ['analytics-mentions'] });
      queryClient.invalidateQueries({ queryKey: ['social-media-posts'] });
    },
    onError: (error) => {
      toast.error('Telegram sync failed: ' + error.message);
    },
  });

  // Computed analytics
  const analytics = useMemo(() => {
    if (!mentions) return null;

    const totalPosts = mentions.length;
    const totalReach = mentions.reduce((acc, m) => acc + (m.reach_estimate || 0), 0);
    const totalEngagement = mentions.reduce((acc, m) => 
      acc + (m.engagement_likes || 0) + (m.engagement_shares || 0) + (m.engagement_comments || 0), 0);
    const totalViews = mentions.reduce((acc, m) => acc + (m.engagement_views || 0), 0);
    
    // Sentiment breakdown
    const positive = mentions.filter(m => m.sentiment_label === 'positive').length;
    const negative = mentions.filter(m => m.sentiment_label === 'negative').length;
    const neutral = mentions.filter(m => m.sentiment_label === 'neutral').length;
    
    const avgSentiment = mentions.length > 0
      ? mentions.reduce((acc, m) => acc + (m.sentiment_score || 0), 0) / mentions.length
      : 0;

    // Platform breakdown
    const platformStats = mentions.reduce((acc, m) => {
      if (!acc[m.platform]) {
        acc[m.platform] = { 
          count: 0, 
          engagement: 0, 
          reach: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
        };
      }
      acc[m.platform].count++;
      acc[m.platform].engagement += (m.engagement_likes || 0) + (m.engagement_shares || 0) + (m.engagement_comments || 0);
      acc[m.platform].reach += m.reach_estimate || 0;
      if (m.sentiment_label === 'positive') acc[m.platform].positive++;
      else if (m.sentiment_label === 'negative') acc[m.platform].negative++;
      else acc[m.platform].neutral++;
      return acc;
    }, {} as Record<string, any>);

    // Time series data (last N days)
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const timeSeriesData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayMentions = mentions.filter(m => {
        const pubDate = new Date(m.published_at);
        return pubDate >= dayStart && pubDate <= dayEnd;
      });

      timeSeriesData.push({
        date: format(date, 'MMM dd'),
        mentions: dayMentions.length,
        engagement: dayMentions.reduce((acc, m) => 
          acc + (m.engagement_likes || 0) + (m.engagement_shares || 0) + (m.engagement_comments || 0), 0),
        sentiment: dayMentions.length > 0 
          ? dayMentions.reduce((acc, m) => acc + (m.sentiment_score || 0), 0) / dayMentions.length
          : 0,
        positive: dayMentions.filter(m => m.sentiment_label === 'positive').length,
        negative: dayMentions.filter(m => m.sentiment_label === 'negative').length,
      });
    }

    // Top topics from sentiment analysis
    const topicCounts: Record<string, number> = {};
    mentions.forEach(m => {
      (m.topics || []).forEach((topic: string) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    return {
      totalPosts,
      totalReach,
      totalEngagement,
      totalViews,
      positive,
      negative,
      neutral,
      avgSentiment,
      platformStats,
      timeSeriesData,
      topTopics,
      engagementRate: totalReach > 0 ? (totalEngagement / totalReach * 100).toFixed(2) : '0',
    };
  }, [mentions, dateRange]);

  const sentimentPieData = analytics ? [
    { name: 'Positive', value: analytics.positive, color: '#10B981' },
    { name: 'Neutral', value: analytics.neutral, color: '#94A3B8' },
    { name: 'Negative', value: analytics.negative, color: '#EF4444' },
  ] : [];

  const platformPieData = analytics 
    ? Object.entries(analytics.platformStats).map(([platform, stats]: [string, any], index) => ({
        name: platformConfig[platform]?.name || platform,
        value: stats.count,
        color: COLORS[index % COLORS.length],
      }))
    : [];

  const isLoading = accountsLoading || mentionsLoading;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <div className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Social Analytics</h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    Unified insights across all connected platforms
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
                  <SelectTrigger className="w-32">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="w-40">
                    <Globe className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    {Object.entries(platformConfig).map(([id, config]) => (
                      <SelectItem key={id} value={id}>
                        <div className="flex items-center gap-2">
                          <config.icon className={`h-4 w-4 ${config.color}`} />
                          {config.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => syncMutation.mutate()} 
                  disabled={syncMutation.isPending}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  Sync All
                </Button>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => telegramMetricsSyncMutation.mutate()} 
                      disabled={telegramMetricsSyncMutation.isPending}
                      className="relative"
                    >
                      <Send className={`h-4 w-4 ${telegramMetricsSyncMutation.isPending ? 'animate-pulse' : ''}`} />
                      {telegramMetricsSyncMutation.isPending && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-ping" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sync Telegram Reactions & Views</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6 space-y-6">
          {/* Connected Accounts Summary */}
          <div className="flex gap-2 flex-wrap">
            {connectedAccounts?.map((account) => {
              const config = platformConfig[account.platform] || { icon: Globe, color: 'text-muted-foreground', name: account.platform };
              const Icon = config.icon;
              return (
                <Badge key={account.id} variant="outline" className="gap-2 px-3 py-1.5">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <span>{account.account_name || config.name}</span>
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                </Badge>
              );
            })}
            {(!connectedAccounts || connectedAccounts.length === 0) && (
              <Badge variant="secondary" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                No accounts connected
              </Badge>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <MetricCard
              icon={MessageCircle}
              label="Total Posts"
              value={analytics?.totalPosts.toLocaleString() || '0'}
              color="primary"
            />
            <MetricCard
              icon={Eye}
              label="Total Reach"
              value={formatNumber(analytics?.totalReach || 0)}
              color="blue"
            />
            <MetricCard
              icon={Zap}
              label="Engagement"
              value={formatNumber(analytics?.totalEngagement || 0)}
              color="amber"
            />
            <MetricCard
              icon={Target}
              label="Eng. Rate"
              value={`${analytics?.engagementRate || 0}%`}
              color="purple"
            />
            <MetricCard
              icon={ThumbsUp}
              label="Positive"
              value={analytics?.positive.toString() || '0'}
              color="emerald"
            />
            <MetricCard
              icon={ThumbsDown}
              label="Negative"
              value={analytics?.negative.toString() || '0'}
              color="rose"
            />
            <MetricCard
              icon={Minus}
              label="Neutral"
              value={analytics?.neutral.toString() || '0'}
              color="slate"
            />
            <MetricCard
              icon={Sparkles}
              label="Avg Sentiment"
              value={((analytics?.avgSentiment || 0) * 100).toFixed(0) + '%'}
              color={(analytics?.avgSentiment || 0) > 0 ? 'emerald' : 'rose'}
            />
          </div>

          {/* Main Charts */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Engagement Over Time */}
            <Card className="lg:col-span-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Engagement Over Time
                </CardTitle>
                <CardDescription>Posts, engagement, and sentiment trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={analytics?.timeSeriesData || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <RechartsTooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }} 
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="mentions" stroke="#3B82F6" strokeWidth={2} name="Posts" />
                      <Line yAxisId="left" type="monotone" dataKey="engagement" stroke="#F59E0B" strokeWidth={2} name="Engagement" />
                      <Bar yAxisId="right" dataKey="positive" fill="#10B981" name="Positive" opacity={0.6} />
                      <Bar yAxisId="right" dataKey="negative" fill="#EF4444" name="Negative" opacity={0.6} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sentiment Distribution */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Sentiment Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={sentimentPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {sentimentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-around mt-4">
                  {sentimentPieData.map((item) => (
                    <div key={item.name} className="text-center">
                      <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: item.color }} />
                      <p className="text-xs text-muted-foreground">{item.name}</p>
                      <p className="text-lg font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Performance & Topics */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Platform Performance */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Platform Performance
                </CardTitle>
                <CardDescription>Breakdown by connected platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {analytics && Object.entries(analytics.platformStats).map(([platform, stats]: [string, any]) => {
                      const config = platformConfig[platform] || { icon: Globe, color: 'text-muted-foreground', name: platform, bgColor: 'bg-muted' };
                      const Icon = config.icon;
                      const total = stats.positive + stats.negative + stats.neutral;
                      const bgColor = 'bgColor' in config ? config.bgColor : 'bg-muted';
                      
                      return (
                        <div key={platform} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-lg ${bgColor}`}>
                                <Icon className={`h-4 w-4 ${config.color}`} />
                              </div>
                              <div>
                                <p className="font-medium">{config.name}</p>
                                <p className="text-xs text-muted-foreground">{stats.count} posts</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatNumber(stats.engagement)}</p>
                              <p className="text-xs text-muted-foreground">engagement</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <div 
                              className="h-2 rounded-l bg-emerald-500" 
                              style={{ width: `${stats.positive / total * 100}%` }} 
                            />
                            <div 
                              className="h-2 bg-slate-300" 
                              style={{ width: `${stats.neutral / total * 100}%` }} 
                            />
                            <div 
                              className="h-2 rounded-r bg-rose-500" 
                              style={{ width: `${stats.negative / total * 100}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                    {(!analytics || Object.keys(analytics.platformStats).length === 0) && (
                      <div className="text-center text-muted-foreground py-8">
                        No platform data yet. Connect accounts and sync to see analytics.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Top Topics */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Top Topics
                </CardTitle>
                <CardDescription>Most discussed topics from AI analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {analytics?.topTopics.map((item, index) => (
                      <div key={item.topic} className="flex items-center gap-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium capitalize">{item.topic}</p>
                          <Progress value={item.count / (analytics.topTopics[0]?.count || 1) * 100} className="h-1.5" />
                        </div>
                        <span className="text-sm text-muted-foreground">{item.count}</span>
                      </div>
                    ))}
                    {(!analytics?.topTopics || analytics.topTopics.length === 0) && (
                      <div className="text-center text-muted-foreground py-8">
                        No topics detected yet. Sync data to analyze topics.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Recent Mentions with Sentiment */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Recent Posts with Sentiment
              </CardTitle>
              <CardDescription>Latest content from connected accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-4">
                  {mentions?.slice(0, 20).map((mention) => {
                    const config = platformConfig[mention.platform] || { icon: Globe, color: 'text-muted-foreground', bgColor: 'bg-muted' };
                    const Icon = config.icon;
                    const bgColor = 'bgColor' in config ? config.bgColor : 'bg-muted';
                    const sentimentColor = mention.sentiment_label === 'positive' 
                      ? 'text-emerald-500 bg-emerald-500/10' 
                      : mention.sentiment_label === 'negative' 
                        ? 'text-rose-500 bg-rose-500/10' 
                        : 'text-slate-400 bg-slate-400/10';
                    
                    return (
                      <div key={mention.id} className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className={`p-2 rounded-lg ${bgColor} h-fit`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium truncate">{mention.author_name || mention.author_handle}</span>
                            <Badge variant="outline" className={`text-xs ${sentimentColor}`}>
                              {mention.sentiment_label || 'unknown'}
                            </Badge>
                            {mention.sentiment_score && (
                              <span className="text-xs text-muted-foreground">
                                ({(mention.sentiment_score * 100).toFixed(0)}%)
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{mention.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" /> {mention.engagement_likes || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Share2 className="h-3 w-3" /> {mention.engagement_shares || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" /> {mention.engagement_comments || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> 
                              {mention.published_at ? format(new Date(mention.published_at), 'MMM d, HH:mm') : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {(!mentions || mentions.length === 0) && (
                    <div className="text-center text-muted-foreground py-8">
                      No posts found. Connect accounts and sync to see data.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Helper components
function MetricCard({ icon: Icon, label, value, color = 'primary' }: { 
  icon: any; 
  label: string; 
  value: string; 
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    primary: 'from-primary/10 to-primary/5 text-primary',
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-600',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-600',
    purple: 'from-purple-500/10 to-purple-500/5 text-purple-600',
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
    rose: 'from-rose-500/10 to-rose-500/5 text-rose-600',
    slate: 'from-slate-500/10 to-slate-500/5 text-slate-600',
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color] || colorClasses.primary} border-0`}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4" />
          <span className="text-xs font-medium opacity-70">{label}</span>
        </div>
        <p className="text-xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}