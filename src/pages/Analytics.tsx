import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, TrendingUp, Eye, FileText, MessageSquare, Share2, Heart, Zap, BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Analytics() {
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["analytics-posts", user?.id, platformFilter],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .maybeSingle();

      if (!profile?.company_id) return [];

      let query = supabase
        .from("social_media_posts")
        .select("*")
        .eq("company_id", profile.company_id);

      if (platformFilter !== "all") {
        query = query.contains("platforms", [platformFilter]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const syncAllPlatforms = async () => {
    setSyncing(true);
    const platforms = ['telegram', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'];
    
    for (const platform of platforms) {
      try {
        await supabase.functions.invoke('sync-social-metrics', {
          body: { platform }
        });
      } catch (error) {
        console.error(`Error syncing ${platform}:`, error);
      }
    }
    
    toast.success("All platforms synced successfully!");
    refetch();
    setSyncing(false);
  };

  const filteredPosts = posts || [];
  const totalPosts = filteredPosts.length;
  const publishedPosts = filteredPosts.filter(p => p.status === "published").length;
  const scheduledPosts = filteredPosts.filter(p => p.status === "scheduled").length;
  const draftPosts = filteredPosts.filter(p => p.status === "draft").length;
  const totalViews = filteredPosts.reduce((sum, post) => sum + (post.views || 0), 0);
  const totalLikes = filteredPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalShares = filteredPosts.reduce((sum, post) => sum + (post.shares || 0), 0);
  const totalClicks = filteredPosts.reduce((sum, post) => sum + (post.clicks || 0), 0);
  const totalEngagement = totalLikes + totalShares + totalClicks;
  const avgEngagementRate = publishedPosts
    ? (filteredPosts.filter(p => p.status === "published").reduce((sum, post) => sum + (post.engagement_rate || 0), 0) / publishedPosts).toFixed(1)
    : "0";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Analytics Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights across all your channels
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="telegram">Telegram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={syncAllPlatforms} 
            disabled={syncing}
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync All'}
          </Button>
        </div>
      </div>

      {/* Enhanced Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Eye className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Content impressions
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagements</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              {totalEngagement.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalLikes} likes • {totalShares} shares
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {avgEngagementRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average across all posts
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              {totalPosts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {publishedPosts} live • {scheduledPosts} scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Status with Visual Progress */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Content Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500">Published</Badge>
                  <p className="text-sm text-muted-foreground">Live on social platforms</p>
                </div>
                <div className="text-xl font-bold text-green-600">{publishedPosts}</div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${totalPosts ? (publishedPosts / totalPosts) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-blue-500">Scheduled</Badge>
                  <p className="text-sm text-muted-foreground">Ready to post</p>
                </div>
                <div className="text-xl font-bold text-blue-600">{scheduledPosts}</div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${totalPosts ? (scheduledPosts / totalPosts) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-orange-500">Drafts</Badge>
                  <p className="text-sm text-muted-foreground">Work in progress</p>
                </div>
                <div className="text-xl font-bold text-orange-600">{draftPosts}</div>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                  style={{ width: `${totalPosts ? (draftPosts / totalPosts) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Recent Activity */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Top Performing Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No posts yet. Start creating content to see analytics.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts
                .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
                .slice(0, 10)
                .map((post) => (
                  <div 
                    key={post.id} 
                    className="p-4 border rounded-lg space-y-3 hover:shadow-md transition-all duration-300 hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2 mb-1">{post.content}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                          {post.platforms?.map(p => (
                            <Badge key={p} variant="outline" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge 
                        variant={
                          post.status === "published" ? "default" :
                          post.status === "scheduled" ? "secondary" : "outline"
                        }
                        className={
                          post.status === "published" ? "bg-green-500" :
                          post.status === "scheduled" ? "bg-blue-500" : ""
                        }
                      >
                        {post.status}
                      </Badge>
                    </div>
                    
                    {post.status === "published" && (
                      <div className="grid grid-cols-4 gap-3 pt-3 border-t">
                        <div className="text-center">
                          <Eye className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                          <p className="text-xs font-semibold">{(post.views || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">views</p>
                        </div>
                        <div className="text-center">
                          <Heart className="h-4 w-4 text-pink-500 mx-auto mb-1" />
                          <p className="text-xs font-semibold">{(post.likes || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">likes</p>
                        </div>
                        <div className="text-center">
                          <Share2 className="h-4 w-4 text-green-500 mx-auto mb-1" />
                          <p className="text-xs font-semibold">{(post.shares || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">shares</p>
                        </div>
                        <div className="text-center">
                          <Zap className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                          <p className="text-xs font-semibold">{(post.engagement_rate || 0).toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">engagement</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}