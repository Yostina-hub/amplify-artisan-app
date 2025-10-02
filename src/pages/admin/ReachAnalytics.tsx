import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Eye, MousePointerClick, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function ReachAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
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

      // Trigger calculation for all users (in batches to avoid rate limits)
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
          <h1 className="text-3xl font-bold">Reach & Ad Performance Analytics</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered recommendation engine performance metrics
          </p>
        </div>
        <Button onClick={recalculateAllScores}>
          Recalculate All Scores
        </Button>
      </div>

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
    </div>
  );
}
