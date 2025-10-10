import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, TrendingUp, Eye, FileText, MessageSquare } from "lucide-react";

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
        .eq("company_id", profile.company_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Calculate simple metrics
  const totalPosts = posts?.length || 0;
  const publishedPosts = posts?.filter(p => p.status === "published").length || 0;
  const scheduledPosts = posts?.filter(p => p.status === "scheduled").length || 0;
  const draftPosts = posts?.filter(p => p.status === "draft").length || 0;
  const totalViews = posts?.reduce((sum, post) => sum + (post.views || 0), 0) || 0;
  const totalLikes = posts?.reduce((sum, post) => sum + (post.likes || 0), 0) || 0;
  const totalShares = posts?.reduce((sum, post) => sum + (post.shares || 0), 0) || 0;
  const totalClicks = posts?.reduce((sum, post) => sum + (post.clicks || 0), 0) || 0;
  const avgEngagementRate = publishedPosts
    ? (posts.filter(p => p.status === "published").reduce((sum, post) => sum + (post.engagement_rate || 0), 0) / publishedPosts).toFixed(1)
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Metrics Overview</h1>
        <p className="text-muted-foreground mt-1">
          Quick overview of your content performance
        </p>
      </div>

      {/* Simple Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Content impressions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLikes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Reactions received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shares</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShares.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Content shared
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Link clicks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Content Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Published</p>
                <p className="text-sm text-muted-foreground">Live on social platforms</p>
              </div>
              <div className="text-2xl font-bold text-green-600">{publishedPosts}</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Scheduled</p>
                <p className="text-sm text-muted-foreground">Ready to post</p>
              </div>
              <div className="text-2xl font-bold text-blue-600">{scheduledPosts}</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Drafts</p>
                <p className="text-sm text-muted-foreground">Work in progress</p>
              </div>
              <div className="text-2xl font-bold text-orange-600">{draftPosts}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts with Reactions</CardTitle>
        </CardHeader>
        <CardContent>
          {posts?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No posts yet. Start creating content to see metrics.
            </p>
          ) : (
            <div className="space-y-3">
              {posts?.slice(0, 10).map((post) => (
                <div key={post.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-2">{post.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(post.created_at).toLocaleDateString()} • {post.platforms?.join(", ")}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      post.status === "published" ? "bg-green-100 text-green-800" :
                      post.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  
                  {/* Reaction metrics */}
                  {post.status === "published" && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.views || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{post.likes || 0} likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{post.shares || 0} shares</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{post.clicks || 0} clicks</span>
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
