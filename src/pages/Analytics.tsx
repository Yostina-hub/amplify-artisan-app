import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHelp } from "@/components/PageHelp";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, TrendingUp, Eye, Heart, Share2, MousePointer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Analytics() {
  const { user } = useAuth();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["analytics-posts", user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from("social_media_posts")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("status", "published")
        .order("engagement_rate", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calculate metrics
  const totalViews = posts?.reduce((sum, post) => sum + (post.views || 0), 0) || 0;
  const totalLikes = posts?.reduce((sum, post) => sum + (post.likes || 0), 0) || 0;
  const totalShares = posts?.reduce((sum, post) => sum + (post.shares || 0), 0) || 0;
  const totalClicks = posts?.reduce((sum, post) => sum + (post.clicks || 0), 0) || 0;
  const avgEngagementRate = posts?.length
    ? (posts.reduce((sum, post) => sum + (post.engagement_rate || 0), 0) / posts.length).toFixed(2)
    : "0";

  // Top performing posts
  const topPosts = posts?.slice(0, 5) || [];

  // Platform breakdown
  const platformStats = posts?.reduce((acc, post) => {
    post.platforms?.forEach((platform: string) => {
      if (!acc[platform]) {
        acc[platform] = { posts: 0, views: 0, likes: 0, shares: 0 };
      }
      acc[platform].posts++;
      acc[platform].views += post.views || 0;
      acc[platform].likes += post.likes || 0;
      acc[platform].shares += post.shares || 0;
    });
    return acc;
  }, {} as Record<string, { posts: number; views: number; likes: number; shares: number }>) || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <PageHelp
        title="Analytics"
        description="Track performance metrics across all your platforms. Analyze engagement, growth trends, and content performance to optimize your social media strategy."
        features={[
          "Top performing posts across all platforms",
          "Platform-specific performance metrics",
          "Real-time engagement tracking",
          "Engagement metrics and trends",
          "Comparative platform analysis",
          "Content performance insights"
        ]}
        tips={[
          "Review top performing posts to identify successful content patterns",
          "Monitor platform growth to focus efforts on high-performing channels",
          "Track engagement metrics to optimize posting times",
          "Compare platform performance to allocate resources effectively",
          "Use analytics insights to inform your content strategy"
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your performance across all platforms
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLikes.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShares.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagementRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {topPosts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No published posts yet. Create and publish posts to see analytics.
                </p>
              ) : (
                <div className="space-y-4">
                  {topPosts.map((post, i) => (
                    <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm line-clamp-1">{post.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {post.platforms?.map((platform: string) => (
                            <Badge key={platform} variant="secondary" className="text-xs">
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-bold">{post.engagement_rate?.toFixed(1) || 0}%</div>
                        <div className="text-xs text-muted-foreground">
                          {post.views || 0} views
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {posts?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No engagement data available yet.
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Likes</span>
                        <span className="text-sm text-muted-foreground">{totalLikes}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{
                            width: `${totalLikes > 0 ? Math.min((totalLikes / (totalViews || 1)) * 100, 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Shares</span>
                        <span className="text-sm text-muted-foreground">{totalShares}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{
                            width: `${totalShares > 0 ? Math.min((totalShares / (totalViews || 1)) * 100, 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Clicks</span>
                        <span className="text-sm text-muted-foreground">{totalClicks}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{
                            width: `${totalClicks > 0 ? Math.min((totalClicks / (totalViews || 1)) * 100, 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Posts</span>
                        <span className="text-sm text-muted-foreground">{posts?.length || 0}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(platformStats).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No platform data available yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(platformStats).map(([platform, stats]) => (
                    <div key={platform} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{platform}</span>
                        <span className="text-muted-foreground">
                          {stats.posts} post{stats.posts !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-muted/50 rounded p-2">
                          <div className="text-muted-foreground">Views</div>
                          <div className="font-semibold">{stats.views.toLocaleString()}</div>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <div className="text-muted-foreground">Likes</div>
                          <div className="font-semibold">{stats.likes.toLocaleString()}</div>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <div className="text-muted-foreground">Shares</div>
                          <div className="font-semibold">{stats.shares.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
                            style={{
                              width: `${Math.min((stats.views / (totalViews || 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
