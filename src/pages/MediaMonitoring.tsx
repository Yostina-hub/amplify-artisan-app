import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Search, RefreshCw, Bell, TrendingUp, MessageSquare, 
  Globe, AlertTriangle, Plus, ExternalLink, Clock,
  ThumbsUp, ThumbsDown, Minus, Eye, Share2, BarChart3,
  Zap, Activity, Radio, Flame, Hash, MapPin, Languages,
  Sparkles, Target, Filter, ChevronRight, Play, Pause,
  ArrowUpRight, ArrowDownRight, Volume2, Users, Layers,
  PieChart, LineChart, Newspaper, Twitter, Facebook, Youtube,
  Instagram, Linkedin, Send, Rss, AlertCircle, CheckCircle2,
  XCircle, TrendingDown, Maximize2, MoreHorizontal, Star
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip as RechartsTooltip, BarChart, Bar } from 'recharts';

// Platform configurations with icons and colors
const platformConfig: Record<string, { icon: any; color: string; bgColor: string; name: string }> = {
  twitter: { icon: Twitter, color: 'text-sky-400', bgColor: 'bg-sky-500/10', name: 'X / Twitter' },
  facebook: { icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-600/10', name: 'Facebook' },
  instagram: { icon: Instagram, color: 'text-pink-500', bgColor: 'bg-gradient-to-br from-pink-500/10 to-orange-500/10', name: 'Instagram' },
  youtube: { icon: Youtube, color: 'text-red-600', bgColor: 'bg-red-600/10', name: 'YouTube' },
  telegram: { icon: Send, color: 'text-blue-400', bgColor: 'bg-blue-400/10', name: 'Telegram' },
  linkedin: { icon: Linkedin, color: 'text-blue-700', bgColor: 'bg-blue-700/10', name: 'LinkedIn' },
  tiktok: { icon: Play, color: 'text-foreground', bgColor: 'bg-foreground/5', name: 'TikTok' },
  news: { icon: Newspaper, color: 'text-amber-600', bgColor: 'bg-amber-600/10', name: 'News' },
  rss: { icon: Rss, color: 'text-orange-500', bgColor: 'bg-orange-500/10', name: 'RSS Feed' },
};

// Sentiment configurations
const sentimentConfig = {
  positive: { icon: ThumbsUp, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  negative: { icon: ThumbsDown, color: 'text-rose-500', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/30' },
  neutral: { icon: Minus, color: 'text-slate-400', bgColor: 'bg-slate-400/10', borderColor: 'border-slate-400/30' },
};

// Mock trend data for visualization
const generateTrendData = () => {
  const data = [];
  for (let i = 23; i >= 0; i--) {
    data.push({
      hour: `${23 - i}h`,
      mentions: Math.floor(Math.random() * 100) + 20,
      sentiment: Math.random() * 2 - 1,
    });
  }
  return data;
};

export default function MediaMonitoring() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [activeView, setActiveView] = useState<'feed' | 'grid' | 'analytics'>('feed');

  // Fetch mentions
  const { data: mentions, isLoading: mentionsLoading } = useQuery({
    queryKey: ['media-mentions', selectedPlatform, selectedSentiment, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('media_mentions')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(100);

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
    refetchInterval: isLiveMode ? 30000 : false,
  });

  // Fetch clusters
  const { data: clusters } = useQuery({
    queryKey: ['media-clusters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_clusters')
        .select('*')
        .order('last_updated_at', { ascending: false })
        .limit(20);
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
        .limit(30);
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
      toast.success(`Synced: ${data.new} new mentions found`);
      queryClient.invalidateQueries({ queryKey: ['media-mentions'] });
    },
    onError: (error) => {
      toast.error('Sync failed: ' + error.message);
    },
  });

  // Computed stats
  const stats = useMemo(() => {
    const totalMentions = mentions?.length || 0;
    const positive = mentions?.filter(m => m.sentiment_label === 'positive').length || 0;
    const negative = mentions?.filter(m => m.sentiment_label === 'negative').length || 0;
    const neutral = mentions?.filter(m => m.sentiment_label === 'neutral').length || 0;
    const totalEngagement = mentions?.reduce((acc, m) => 
      acc + (m.engagement_likes || 0) + (m.engagement_shares || 0) + (m.engagement_comments || 0), 0) || 0;
    const totalReach = mentions?.reduce((acc, m) => acc + (m.reach_estimate || 0), 0) || 0;
    const trending = clusters?.filter(c => c.is_trending).length || 0;
    const unreadAlerts = alerts?.filter(a => !a.is_acknowledged).length || 0;
    
    // Platform breakdown
    const platformBreakdown = mentions?.reduce((acc, m) => {
      acc[m.platform] = (acc[m.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      totalMentions,
      positive,
      negative,
      neutral,
      totalEngagement,
      totalReach,
      trending,
      unreadAlerts,
      platformBreakdown,
      sentimentScore: totalMentions > 0 ? ((positive - negative) / totalMentions * 100).toFixed(1) : '0',
    };
  }, [mentions, clusters, alerts]);

  const trendData = useMemo(() => generateTrendData(), []);

  const pieData = [
    { name: 'Positive', value: stats.positive, color: '#10B981' },
    { name: 'Neutral', value: stats.neutral, color: '#94A3B8' },
    { name: 'Negative', value: stats.negative, color: '#F43F5E' },
  ];

  const platformPieData = Object.entries(stats.platformBreakdown).map(([platform, count]) => ({
    name: platformConfig[platform]?.name || platform,
    value: count,
    color: platform === 'twitter' ? '#38BDF8' : platform === 'facebook' ? '#2563EB' : platform === 'instagram' ? '#EC4899' : platform === 'youtube' ? '#DC2626' : '#6B7280',
  }));

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Immersive Header with Glassmorphism */}
        <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/25">
                    <Radio className="h-7 w-7 text-primary-foreground" />
                  </div>
                  {isLiveMode && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background"></span>
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Media Intelligence Hub
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Activity className="h-3 w-3" />
                    Real-time brand monitoring & sentiment analysis
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Live Mode Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isLiveMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsLiveMode(!isLiveMode)}
                      className={isLiveMode ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}
                    >
                      {isLiveMode ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                      {isLiveMode ? 'Live' : 'Paused'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Toggle real-time updates</TooltipContent>
                </Tooltip>

                <Button variant="outline" size="sm" onClick={() => ingestMutation.mutate()} disabled={ingestMutation.isPending}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${ingestMutation.isPending ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
                
                <Button size="sm" className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-6 space-y-6">
          {/* Command Center - Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <MetricCard
              icon={MessageSquare}
              label="Total Mentions"
              value={stats.totalMentions.toLocaleString()}
              trend="+12%"
              trendUp={true}
              color="primary"
            />
            <MetricCard
              icon={Users}
              label="Total Reach"
              value={formatNumber(stats.totalReach)}
              trend="+8%"
              trendUp={true}
              color="secondary"
            />
            <MetricCard
              icon={Zap}
              label="Engagement"
              value={formatNumber(stats.totalEngagement)}
              trend="+15%"
              trendUp={true}
              color="amber"
            />
            <MetricCard
              icon={Target}
              label="Sentiment"
              value={`${stats.sentimentScore}%`}
              trend={Number(stats.sentimentScore) > 0 ? "Positive" : "Negative"}
              trendUp={Number(stats.sentimentScore) > 0}
              color={Number(stats.sentimentScore) > 0 ? "emerald" : "rose"}
            />
            <MetricCard
              icon={ThumbsUp}
              label="Positive"
              value={stats.positive.toString()}
              color="emerald"
            />
            <MetricCard
              icon={ThumbsDown}
              label="Negative"
              value={stats.negative.toString()}
              color="rose"
            />
            <MetricCard
              icon={Flame}
              label="Trending"
              value={stats.trending.toString()}
              color="orange"
            />
            <MetricCard
              icon={Bell}
              label="Alerts"
              value={stats.unreadAlerts.toString()}
              color="yellow"
              highlight={stats.unreadAlerts > 0}
            />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left Panel - Analytics Overview */}
            <div className="lg:col-span-3 space-y-4">
              {/* Sentiment Distribution */}
              <Card className="border-0 shadow-lg shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-primary" />
                    Sentiment Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={60}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ 
                            background: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }} 
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-around mt-2">
                    {pieData.map((item) => (
                      <div key={item.name} className="text-center">
                        <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: item.color }} />
                        <p className="text-xs text-muted-foreground">{item.name}</p>
                        <p className="text-sm font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Platform Breakdown */}
              <Card className="border-0 shadow-lg shadow-primary/5 bg-gradient-to-br from-card to-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    Platform Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(stats.platformBreakdown).slice(0, 5).map(([platform, count]) => {
                    const config = platformConfig[platform] || { icon: Globe, color: 'text-muted-foreground', name: platform };
                    const Icon = config.icon;
                    const percentage = stats.totalMentions > 0 ? (count / stats.totalMentions * 100) : 0;
                    return (
                      <div key={platform} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${config.color}`} />
                            <span className="font-medium">{config.name}</span>
                          </div>
                          <span className="text-muted-foreground">{count}</span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    );
                  })}
                  {Object.keys(stats.platformBreakdown).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No platform data yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Hashtags */}
              <Card className="border-0 shadow-lg shadow-primary/5 bg-gradient-to-br from-card to-card/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    Trending Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {['#tech', '#AI', '#innovation', '#startup', '#digital', '#future'].map((tag) => (
                      <Badge key={tag} variant="secondary" className="px-2 py-1 text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Center Panel - Main Content */}
            <div className="lg:col-span-6 space-y-4">
              {/* Trend Chart */}
              <Card className="border-0 shadow-lg shadow-primary/5 bg-gradient-to-br from-card to-card/80">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <LineChart className="h-4 w-4 text-primary" />
                      Mention Volume (24h)
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      <Activity className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="mentionGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                        <YAxis hide />
                        <RechartsTooltip 
                          contentStyle={{ 
                            background: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="mentions" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          fill="url(#mentionGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-muted/30 backdrop-blur border border-border/50">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mentions, keywords, authors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background/80 border-border/50"
                  />
                </div>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="w-[140px] bg-background/80">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    {Object.entries(platformConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className={`h-4 w-4 ${config.color}`} />
                          {config.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
                  <SelectTrigger className="w-[130px] bg-background/80">
                    <SelectValue placeholder="Sentiment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sentiments</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1 ml-auto">
                  {(['feed', 'grid', 'analytics'] as const).map((view) => (
                    <Button
                      key={view}
                      variant={activeView === view ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveView(view)}
                      className="px-3"
                    >
                      {view === 'feed' && <MessageSquare className="h-4 w-4" />}
                      {view === 'grid' && <Layers className="h-4 w-4" />}
                      {view === 'analytics' && <BarChart3 className="h-4 w-4" />}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Mentions Feed */}
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {mentionsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-0 animate-pulse bg-muted/30">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              <div className="w-12 h-12 rounded-xl bg-muted" />
                              <div className="flex-1 space-y-2">
                                <div className="h-4 w-1/3 bg-muted rounded" />
                                <div className="h-3 w-full bg-muted rounded" />
                                <div className="h-3 w-2/3 bg-muted rounded" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : mentions?.length === 0 ? (
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/50">
                      <CardContent className="py-16 text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                          <Radio className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Mentions Yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                          Add sources and configure watchlists to start monitoring media mentions in real-time.
                        </p>
                        <Button className="bg-gradient-to-r from-primary to-secondary">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Source
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    mentions?.map((mention: any) => (
                      <MentionCard key={mention.id} mention={mention} />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right Panel - Alerts & Stories */}
            <div className="lg:col-span-3 space-y-4">
              {/* Active Alerts */}
              <Card className="border-0 shadow-lg shadow-primary/5 bg-gradient-to-br from-card to-card/80 overflow-hidden">
                <CardHeader className="pb-2 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Active Alerts
                    </CardTitle>
                    {stats.unreadAlerts > 0 && (
                      <Badge variant="destructive" className="text-xs px-1.5">
                        {stats.unreadAlerts}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[200px]">
                    {alerts?.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                        No active alerts
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {alerts?.slice(0, 5).map((alert: any) => (
                          <AlertRow key={alert.id} alert={alert} />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Trending Stories */}
              <Card className="border-0 shadow-lg shadow-primary/5 bg-gradient-to-br from-card to-card/80">
                <CardHeader className="pb-2 border-b border-border/50">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Trending Stories
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[280px]">
                    {clusters?.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                        Stories will appear here
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {clusters?.slice(0, 5).map((cluster: any) => (
                          <StoryRow key={cluster.id} cluster={cluster} />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-lg shadow-primary/5 bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="justify-start">
                      <Target className="h-4 w-4 mr-2" />
                      New Alert Rule
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <FileReport className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Filter className="h-4 w-4 mr-2" />
                      Watchlist
                    </Button>
                    <Button variant="outline" size="sm" className="justify-start">
                      <Languages className="h-4 w-4 mr-2" />
                      Translate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Utility Components
function MetricCard({ icon: Icon, label, value, trend, trendUp, color, highlight }: {
  icon: any;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  color: string;
  highlight?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    secondary: 'text-secondary bg-secondary/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    rose: 'text-rose-500 bg-rose-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    orange: 'text-orange-500 bg-orange-500/10',
    yellow: 'text-yellow-500 bg-yellow-500/10',
  };

  return (
    <Card className={`border-0 shadow-sm hover:shadow-md transition-all ${highlight ? 'ring-2 ring-yellow-500/50 animate-pulse' : ''}`}>
      <CardContent className="p-3">
        <div className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-2`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xl font-bold">{value}</p>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
          {trend && (
            <span className={`text-[10px] flex items-center ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MentionCard({ mention }: { mention: any }) {
  const platform = platformConfig[mention.platform] || { icon: Globe, color: 'text-muted-foreground', bgColor: 'bg-muted', name: mention.platform };
  const PlatformIcon = platform.icon;
  const sentiment = sentimentConfig[mention.sentiment_label as keyof typeof sentimentConfig] || sentimentConfig.neutral;
  const SentimentIcon = sentiment.icon;

  return (
    <Card className={`border-0 shadow-sm hover:shadow-lg transition-all group cursor-pointer border-l-2 ${sentiment.borderColor}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Avatar / Platform */}
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-xl ${platform.bgColor} flex items-center justify-center relative`}>
              <PlatformIcon className={`h-6 w-6 ${platform.color}`} />
              {mention.author_verified && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm truncate">{mention.author_name || 'Unknown'}</span>
              {mention.author_handle && (
                <span className="text-xs text-muted-foreground truncate">@{mention.author_handle}</span>
              )}
              <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                {mention.published_at && formatDistanceToNow(new Date(mention.published_at), { addSuffix: true })}
              </span>
            </div>
            
            <p className="text-sm text-foreground/90 mb-3 line-clamp-2">{mention.content}</p>
            
            {/* Metrics Row */}
            <div className="flex items-center gap-4 text-xs">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${sentiment.bgColor} ${sentiment.color}`}>
                    <SentimentIcon className="h-3 w-3" />
                    {mention.sentiment_label}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Sentiment Score: {mention.sentiment_score?.toFixed(2)}</TooltipContent>
              </Tooltip>
              
              <span className="flex items-center gap-1 text-muted-foreground">
                <Eye className="h-3 w-3" />
                {formatNumber(mention.engagement_views || 0)}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <ThumbsUp className="h-3 w-3" />
                {formatNumber(mention.engagement_likes || 0)}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Share2 className="h-3 w-3" />
                {formatNumber(mention.engagement_shares || 0)}
              </span>
              
              {mention.language && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {mention.language.toUpperCase()}
                </Badge>
              )}
              
              {mention.permalink && (
                <a 
                  href={mention.permalink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="ml-auto flex items-center gap-1 text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  View
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertRow({ alert }: { alert: any }) {
  const severityColors = {
    critical: 'text-rose-500 bg-rose-500/10',
    high: 'text-orange-500 bg-orange-500/10',
    medium: 'text-amber-500 bg-amber-500/10',
    low: 'text-blue-500 bg-blue-500/10',
  };
  const color = severityColors[alert.severity as keyof typeof severityColors] || severityColors.medium;

  return (
    <div className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${!alert.is_acknowledged ? 'bg-amber-500/5' : ''}`}>
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{alert.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{alert.summary}</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {alert.created_at && formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
          </p>
        </div>
        {!alert.is_acknowledged && (
          <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}

function StoryRow({ cluster }: { cluster: any }) {
  const sentiment = sentimentConfig[cluster.dominant_sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral;

  return (
    <div className="p-3 hover:bg-muted/50 transition-colors cursor-pointer group">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {cluster.is_trending && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                <Flame className="h-3 w-3 mr-0.5" />
                HOT
              </Badge>
            )}
            <span className={`flex items-center gap-1 text-xs ${sentiment.color}`}>
              <sentiment.icon className="h-3 w-3" />
            </span>
          </div>
          <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
            {cluster.title}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {cluster.mention_count}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {formatNumber(cluster.total_reach || 0)}
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-2" />
      </div>
    </div>
  );
}

// Fake FileReport icon since it doesn't exist
function FileReport(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="16" y2="17"/>
    </svg>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
