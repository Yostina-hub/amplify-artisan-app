import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  TrendingUp, 
  Eye, 
  Share2, 
  Heart, 
  Bookmark, 
  MousePointer, 
  Video,
  Calendar,
  BarChart3,
  Award,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  metrics_last_synced_at: string | null;
}

interface AggregateMetrics {
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

export default function SocialMediaAnalytics() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostMetrics[]>([]);
  const [aggregateMetrics, setAggregateMetrics] = useState<AggregateMetrics>({
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
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>("30");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange, platformFilter]);

  const fetchAnalytics = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      // Calculate date range
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      let query = supabase
        .from('social_media_posts')
        .select('*')
        .eq('company_id', profile.company_id)
        .gte('created_at', startDate.toISOString())
        .order('engagement_rate', { ascending: false });

      const { data: postsData } = await query;

      // Filter by platform if needed
      let filteredPosts = postsData || [];
      if (platformFilter !== 'all') {
        filteredPosts = filteredPosts.filter(post => 
          post.platforms.includes(platformFilter)
        );
      }

      // Calculate aggregate metrics
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
      setAggregateMetrics(aggregate);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatWatchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getTopPerformingPosts = () => {
    return posts.slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Media Analytics</h1>
          <p className="text-muted-foreground">Track your performance across all platforms</p>
        </div>
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

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateMetrics.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg {Math.round(aggregateMetrics.totalViews / Math.max(aggregateMetrics.totalPosts, 1))} per post
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
              {(aggregateMetrics.totalLikes + aggregateMetrics.totalShares + aggregateMetrics.totalSaves).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {aggregateMetrics.avgEngagementRate.toFixed(2)}% avg rate
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Target className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateMetrics.totalReach.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Unique users reached
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-primary-glow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateMetrics.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              CTR: {((aggregateMetrics.totalClicks / Math.max(aggregateMetrics.totalViews, 1)) * 100).toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares</CardTitle>
            <Share2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateMetrics.totalShares.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Likes</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateMetrics.totalLikes.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saves</CardTitle>
            <Bookmark className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregateMetrics.totalSaves.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
            <Video className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatWatchTime(aggregateMetrics.totalVideoWatchTime)}
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
          {getTopPerformingPosts().length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No posts found for the selected period</p>
              <Button className="mt-4" onClick={() => window.location.href = '/composer'}>
                Create Your First Post
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {getTopPerformingPosts().map((post, index) => (
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
                          <MousePointer className="h-3 w-3 text-primary" />
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
    </div>
  );
}