import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Eye, MousePointerClick, Ban, Sparkles, AlertTriangle, TrendingDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

export default function ReachAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const { toast } = useToast();

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
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Get user reach scores
      const { data: reachScores, error: scoresError } = await supabase
        .from("user_reach_scores")
        .select("reach_score");

      if (scoresError) throw scoresError;

      // Get impressions data
      const { data: impressions, error: impressionsError } = await supabase
        .from("ad_impressions")
        .select("*, ad_campaigns(name)");

      if (impressionsError) throw impressionsError;

      // Calculate analytics
      const totalUsers = reachScores?.length || 0;
      const averageReachScore = reachScores?.reduce((sum, s) => sum + (s.reach_score || 0), 0) / totalUsers || 0;
      
      const views = impressions?.filter(i => i.impression_type === 'view').length || 0;
      const clicks = impressions?.filter(i => i.impression_type === 'click').length || 0;
      const dismissals = impressions?.filter(i => i.impression_type === 'dismiss').length || 0;
      const ctr = views > 0 ? (clicks / views) * 100 : 0;

      // Calculate top campaigns
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
      toast({
        title: "AI Analysis unavailable",
        description: "Could not load AI insights",
        variant: "destructive",
      });
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

  if (loading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Media & Reach Analytics</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered insights across social metrics, influencers, and brand monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchAIInsights()} disabled={analyzingAI}>
            <Sparkles className="h-4 w-4 mr-2" />
            {analyzingAI ? 'Analyzing...' : 'Refresh AI Analysis'}
          </Button>
          <Button onClick={recalculateAllScores}>
            Recalculate All Scores
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
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
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
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

              {/* Platform-Specific Tips */}
              {aiInsights.platform_specific_tips && aiInsights.platform_specific_tips.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {platforms.find(p => p.value === selectedPlatform)?.icon}
                      {platforms.find(p => p.value === selectedPlatform)?.label} Pro Tips
                    </CardTitle>
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
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <TrendingDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">No AI insights available yet</p>
                <Button onClick={() => fetchAIInsights()}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Metrics</CardTitle>
              <CardDescription>Coming soon: Deep dive into campaign performance</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
