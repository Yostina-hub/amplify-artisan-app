import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Eye, MousePointerClick, Ban, Sparkles, AlertTriangle, Users, BarChart3, Heart, Share2, Bookmark, Video, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AnalyticsData {
  totalUsers: number;
  averageReachScore: number;
  totalImpressions: number;
  totalClicks: number;
  totalDismissals: number;
  clickThroughRate: number;
  topPerformingCampaigns: Array<{
    name: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
}

interface AIInsights {
  overview: string;
  top_performers: Array<{ name: string; metric: string; value: string }>;
  recommendations: string[];
  sentiment_summary: string;
  growth_opportunities: string[];
  risk_alerts: string[];
  platform_specific_tips: string[];
}

interface PostMetrics {
  id: string;
  content: string;
  platforms: string[];
  status: string;
  views: number;
  shares: number;
  likes: number;
  saves: number;
  clicks: number;
  reach: number;
  engagement_rate: number;
  video_watch_time_seconds: number;
  created_at: string;
}

interface SocialAggregateMetrics {
  totalViews: number;
  totalShares: number;
  totalLikes: number;
  totalSaves: number;
  totalClicks: number;
  totalReach: number;
  avgEngagementRate: number;
  totalVideoWatchTime: number;
  totalPosts: number;
}

export default function ReachAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [isCampaignDetailsOpen, setIsCampaignDetailsOpen] = useState(false);
  const { toast } = useToast();

  // Social Analytics State
  const [posts, setPosts] = useState<PostMetrics[]>([]);
  const [socialMetrics, setSocialMetrics] = useState<SocialAggregateMetrics>({
    totalViews: 0,
    totalShares: 0,
    totalLikes: 0,
    totalSaves: 0,
    totalClicks: 0,
    totalReach: 0,
    avgEngagementRate: 0,
    totalVideoWatchTime: 0,
    totalPosts: 0,
  });
  const [timeRange, setTimeRange] = useState<string>("30");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const platforms = [
    { value: 'all', label: 'All Platforms', icon: '🌐' },
    { value: 'facebook', label: 'Facebook', icon: '📘' },
    { value: 'instagram', label: 'Instagram', icon: '📷' },
    { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
    { value: 'tiktok', label: 'TikTok', icon: '🎵' },
    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { value: 'youtube', label: 'YouTube', icon: '📹' },
  ];

  useEffect(() => {
    fetchAnalytics();
    fetchAIInsights();
    fetchSocialAnalytics();
  }, [timeRange, platformFilter]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const { data: reachScores, error: scoresError } = await supabase
        .from("user_reach_scores")
        .select("reach_score");

      if (scoresError) throw scoresError;

      const { data: impressions, error: impressionsError } = await supabase
        .from("ad_impressions")
        .select("*, ad_campaigns(name)");

      if (impressionsError) throw impressionsError;

      const totalUsers = reachScores?.length || 0;
      const averageReachScore = reachScores?.reduce((sum, s) => sum + (s.reach_score || 0), 0) / totalUsers || 0;
      
      const views = impressions?.filter(i => i.impression_type === 'view').length || 0;
      const clicks = impressions?.filter(i => i.impression_type === 'click').length || 0;
      const dismissals = impressions?.filter(i => i.impression_type === 'dismiss').length || 0;
      const ctr = views > 0 ? (clicks / views) * 100 : 0;

      const campaignStats: Record<string, any> = {};
      impressions?.forEach((imp: any) => {
        const campaignName = imp.ad_campaigns?.name || 'Unknown';
        if (!campaignStats[campaignName]) {
          campaignStats[campaignName] = { name: campaignName, impressions: 0, clicks: 0 };
        }
        if (imp.impression_type === 'view') campaignStats[campaignName].impressions++;
        if (imp.impression_type === 'click') campaignStats[campaignName].clicks++;
      });

      const topCampaigns = Object.values(campaignStats)
        .map((c: any) => ({
          ...c,
          ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0
        }))
        .sort((a: any, b: any) => b.clicks - a.clicks)
        .slice(0, 5);

      setAnalytics({
        totalUsers,
        averageReachScore,
        totalImpressions: views,
        totalClicks: clicks,
        totalDismissals: dismissals,
        clickThroughRate: ctr,
        topPerformingCampaigns: topCampaigns,
      });
    } catch (error: any) {
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSocialAnalytics = async () => {
    try {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      let query = supabase
        .from('social_media_posts')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('engagement_rate', { ascending: false });

      const { data: postsData } = await query;

      let filteredPosts = postsData || [];
      if (platformFilter !== 'all') {
        filteredPosts = filteredPosts.filter(post => 
          post.platforms.includes(platformFilter)
        );
      }

      const aggregate = filteredPosts.reduce((acc, post) => ({
        totalViews: acc.totalViews + (post.views || 0),
        totalShares: acc.totalShares + (post.shares || 0),
        totalLikes: acc.totalLikes + (post.likes || 0),
        totalSaves: acc.totalSaves + (post.saves || 0),
        totalClicks: acc.totalClicks + (post.clicks || 0),
        totalReach: acc.totalReach + (post.reach || 0),
        avgEngagementRate: acc.avgEngagementRate + (post.engagement_rate || 0),
        totalVideoWatchTime: acc.totalVideoWatchTime + (post.video_watch_time_seconds || 0),
        totalPosts: acc.totalPosts + 1,
      }), {
        totalViews: 0,
        totalShares: 0,
        totalLikes: 0,
        totalSaves: 0,
        totalClicks: 0,
        totalReach: 0,
        avgEngagementRate: 0,
        totalVideoWatchTime: 0,
        totalPosts: 0,
      });

      aggregate.avgEngagementRate = aggregate.totalPosts > 0 
        ? aggregate.avgEngagementRate / aggregate.totalPosts 
        : 0;

      setPosts(filteredPosts);
      setSocialMetrics(aggregate);
    } catch (error) {
      console.error('Error fetching social analytics:', error);
    }
  };

  const fetchAIInsights = async (platform: string = selectedPlatform) => {
    try {
      setAnalyzingAI(true);
      const { data, error } = await supabase.functions.invoke('analyze-social-insights', {
        body: { analysisType: 'comprehensive', platform }
      });

      if (error) throw error;
      setAiInsights(data.insights);
    } catch (error: any) {
      console.error('AI Analysis error:', error);
    } finally {
      setAnalyzingAI(false);
    }
  };

  const recalculateAllScores = async () => {
    try {
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id");

      if (error) throw error;

      toast({
        title: "Recalculating scores",
        description: `Processing ${users?.length || 0} users...`,
      });

      for (const user of users || []) {
        await supabase.functions.invoke('calculate-reach-score', {
          body: { userId: user.id }
        });
      }

      toast({
        title: "Success",
        description: "All reach scores have been recalculated",
      });

      fetchAnalytics();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatWatchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Social media performance, ad campaigns, and AI-powered insights
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchAIInsights()} disabled={analyzingAI}>
          <Sparkles className="h-4 w-4 mr-2" />
          {analyzingAI ? 'Analyzing...' : 'Refresh AI Analysis'}
        </Button>
      </div>

      <Tabs defaultValue="social" className="space-y-6">
        <TabsList>
          <TabsTrigger value="social">Social Analytics</TabsTrigger>
          <TabsTrigger value="ads">Ad Campaigns</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Social Analytics Tab */}
        <TabsContent value="social" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Organic Post Performance</h2>
            <div className="flex gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="Twitter">Twitter</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Key Social Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{socialMetrics.totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Avg {Math.round(socialMetrics.totalViews / Math.max(socialMetrics.totalPosts, 1))} per post
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
                <Heart className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(socialMetrics.totalLikes + socialMetrics.totalShares + socialMetrics.totalSaves).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {socialMetrics.avgEngagementRate.toFixed(2)}% avg rate
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                <Target className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{socialMetrics.totalReach.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Unique users reached</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-primary-glow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{socialMetrics.totalClicks.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  CTR: {((socialMetrics.totalClicks / Math.max(socialMetrics.totalViews, 1)) * 100).toFixed(2)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Social Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shares</CardTitle>
                <Share2 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{socialMetrics.totalShares.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Likes</CardTitle>
                <Heart className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{socialMetrics.totalLikes.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saves</CardTitle>
                <Bookmark className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{socialMetrics.totalSaves.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
                <Video className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatWatchTime(socialMetrics.totalVideoWatchTime)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Posts */}
          <Card className="border-2 hover:shadow-xl transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Top Performing Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No posts found for the selected period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.slice(0, 5).map((post, index) => (
                    <div 
                      key={post.id} 
                      className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-primary/30"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-gradient-to-r from-primary/10 to-accent/10">
                              #{index + 1}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString()}
                            </span>
                            {post.platforms.map(platform => (
                              <Badge key={platform} variant="secondary">{platform}</Badge>
                            ))}
                          </div>
                          <p className="text-sm font-medium line-clamp-2">{post.content}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3 text-muted-foreground" />
                              <span>{post.views.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-red-500" />
                              <span>{post.likes.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Share2 className="h-3 w-3 text-blue-500" />
                              <span>{post.shares.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bookmark className="h-3 w-3 text-green-500" />
                              <span>{post.saves.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MousePointerClick className="h-3 w-3 text-primary" />
                              <span>{post.clicks.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3 text-accent" />
                              <span>{post.engagement_rate.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ad Campaigns Tab */}
        <TabsContent value="ads" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Ad Campaign Performance</h2>
            <Button onClick={recalculateAllScores}>
              Recalculate All Scores
            </Button>
          </div>

          {/* Key Ad Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users Tracked</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg Score: {analytics?.averageReachScore.toFixed(1) || 0}/100
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ad Impressions</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalImpressions || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total views</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalClicks || 0}</div>
                <p className="text-xs text-success mt-1">
                  CTR: {analytics?.clickThroughRate.toFixed(2)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Dismissals</CardTitle>
                <Ban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalDismissals || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">User dismissed ads</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Campaigns</CardTitle>
              <CardDescription>Based on click-through rate and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topPerformingCampaigns.map((campaign, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {campaign.impressions} impressions • {campaign.clicks} clicks
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{campaign.ctr.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">CTR</p>
                    </div>
                  </div>
                ))}
                {(!analytics?.topPerformingCampaigns || analytics.topPerformingCampaigns.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No campaign data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6">
          {/* Platform Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Select Platform</CardTitle>
              <CardDescription>Choose a specific platform to analyze or view all platforms combined</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {platforms.map((platform) => (
                  <Button
                    key={platform.value}
                    variant={selectedPlatform === platform.value ? "default" : "outline"}
                    onClick={() => {
                      setSelectedPlatform(platform.value);
                      fetchAIInsights(platform.value);
                    }}
                    className="flex flex-col h-auto py-3"
                    disabled={analyzingAI}
                  >
                    <span className="text-2xl mb-1">{platform.icon}</span>
                    <span className="text-xs">{platform.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {analyzingAI ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
                <p className="text-muted-foreground">Analyzing social media data with AI...</p>
              </CardContent>
            </Card>
          ) : aiInsights ? (
            <>
              {/* AI Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-Powered Overview
                    <Badge variant="secondary">
                      {platforms.find(p => p.value === selectedPlatform)?.label}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed">{aiInsights.overview}</p>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiInsights.top_performers.map((performer, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{performer.name}</p>
                            <p className="text-sm text-muted-foreground">{performer.metric}</p>
                          </div>
                          <Badge variant="secondary">{performer.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Sentiment Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Sentiment Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed">{aiInsights.sentiment_summary}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiInsights.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-success mt-1">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Growth Opportunities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Growth Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiInsights.growth_opportunities.map((opp, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-1">→</span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Risk Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Risk Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiInsights.risk_alerts.map((alert, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-destructive mt-1">⚠</span>
                          <span>{alert}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Platform Specific Tips */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform-Specific Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {aiInsights.platform_specific_tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">💡</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Click "Refresh AI Analysis" to generate insights</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}