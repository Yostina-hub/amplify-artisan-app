import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle2, XCircle, Search, Filter, Globe, Clock, Eye, LayoutList, LayoutGrid, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ContentModeration = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"queue" | "kanban">("queue");
  const [hideNew, setHideNew] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [recheckingPostId, setRecheckingPostId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["moderation-posts", statusFilter, platformFilter],
    queryFn: async () => {
      let query = supabase
        .from("social_media_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (platformFilter !== "all") {
        query = query.contains("platforms", [platformFilter]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["moderation-stats"],
    queryFn: async () => {
      const { data: flaggedPosts } = await supabase
        .from("social_media_posts")
        .select("id", { count: "exact" })
        .eq("flagged", true);

      const { data: pendingPosts } = await supabase
        .from("social_media_posts")
        .select("id", { count: "exact" })
        .eq("status", "draft");

      const { data: approvedPosts } = await supabase
        .from("social_media_posts")
        .select("id", { count: "exact" })
        .eq("status", "published");

      return {
        flagged: flaggedPosts?.length || 0,
        pending: pendingPosts?.length || 0,
        approved: approvedPosts?.length || 0,
      };
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("social_media_posts")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-posts"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-stats"] });
      toast.success("Content updated successfully");
    },
    onError: () => {
      toast.error("Failed to update content");
    },
  });

  const recheckContentMutation = useMutation({
    mutationFn: async (post: any) => {
      setRecheckingPostId(post.id);
      const { data, error } = await supabase.functions.invoke("moderate-content", {
        body: {
          postId: post.id,
          content: post.content,
          platforms: post.platforms || [],
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, post) => {
      queryClient.invalidateQueries({ queryKey: ["moderation-posts"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-stats"] });
      setRecheckingPostId(null);
      if (data.shouldFlag) {
        toast.warning(`Content flagged: ${data.flagReason}`);
      } else {
        toast.success("Content passed AI moderation");
      }
    },
    onError: () => {
      setRecheckingPostId(null);
      toast.error("Failed to recheck content");
    },
  });

  const approvePostMutation = useMutation({
    mutationFn: async (post: any) => {
      // First update the post status
      const { error: updateError } = await supabase
        .from("social_media_posts")
        .update({ 
          status: "published",
          flagged: false,
        })
        .eq("id", post.id);

      if (updateError) throw updateError;

      // If the post is for Telegram, trigger the posting
      if (post.platforms?.includes("telegram")) {
        const { error: telegramError } = await supabase.functions.invoke("post-to-telegram", {
          body: { 
            postId: post.id,
            companyId: post.company_id
          }
        });

        if (telegramError) {
          console.error("Error posting to Telegram:", telegramError);
          throw new Error("Post approved but failed to send to Telegram");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-posts"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-stats"] });
      toast.success("Post approved and published to Telegram");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to approve post");
      console.error("Error approving post:", error);
    },
  });

  const filteredPosts = posts?.filter((post) => {
    // View mode filter first
    if (viewMode === "queue") {
      // Queue only shows draft (new/pending) posts
      if (post.status !== "draft") return false;
      if (hideNew) return false; // Hide if "hide new" is enabled
    } else {
      // Kanban shows rejected and flagged posts
      if (post.status !== "rejected" && !post.flagged) return false;
    }

    // Search filter (only if search term exists)
    if (searchTerm.trim()) {
      const matchesSearch = post.content?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string, flagged: boolean) => {
    if (flagged) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Flagged</Badge>;
    }
    switch (status) {
      case "published":
        return <Badge className="gap-1 bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30"><CheckCircle2 className="h-3 w-3" />Published</Badge>;
      case "draft":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
              <Shield className="h-10 w-10 text-primary animate-pulse" />
              AI Content Moderation Center
            </h1>
            <p className="text-muted-foreground text-lg">
              Comprehensive content review powered by advanced AI algorithms
            </p>
          </div>
          <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
            <Globe className="h-4 w-4" />
            Multi-Language Support
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-all group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Flagged Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats?.flagged || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires immediate review</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{stats?.pending || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting moderation</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Approved Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.approved || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Published successfully</p>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle and Filters */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Filters
              </CardTitle>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "queue" | "kanban")} className="w-auto">
                <TabsList>
                  <TabsTrigger value="queue" className="gap-2">
                    <LayoutList className="h-4 w-4" />
                    Content Queue
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Kanban Board
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Pending</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hideNew"
                  checked={hideNew}
                  onChange={(e) => setHideNew(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="hideNew" className="text-sm font-medium">
                  Hide New
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content List */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {viewMode === "queue" ? <LayoutList className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
              {viewMode === "queue" ? "Content Queue" : "Kanban Board"}
            </CardTitle>
            <CardDescription>
              {viewMode === "queue" 
                ? "Review new and pending content" 
                : "Manage rejected and flagged content"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading content...</p>
              </div>
            ) : filteredPosts && filteredPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="border hover:border-primary/50 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(post.status, post.flagged)}
                            {post.platforms?.map((platform: string) => (
                              <Badge key={platform} variant="outline" className="capitalize">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm leading-relaxed">{post.content}</p>
                          {post.scheduled_at && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Scheduled: {new Date(post.scheduled_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPost(post);
                              setIsViewDialogOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => recheckContentMutation.mutate(post)}
                            disabled={recheckingPostId === post.id}
                            className="gap-2"
                          >
                            <RefreshCw className={`h-4 w-4 ${recheckingPostId === post.id ? 'animate-spin' : ''}`} />
                            AI Recheck
                          </Button>
                          {(post.flagged || post.status === "draft") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approvePostMutation.mutate(post)}
                              className="gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Approve
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updatePostMutation.mutate({ 
                              id: post.id, 
                              updates: { status: "rejected", flagged: true } 
                            })}
                            className="gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">No content to review</p>
                <p className="text-sm text-muted-foreground mt-2">All content has been moderated</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Content Details</DialogTitle>
              <DialogDescription>Full content and metadata</DialogDescription>
            </DialogHeader>
            {selectedPost && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <div className="flex gap-2">
                    {getStatusBadge(selectedPost.status, selectedPost.flagged)}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Platforms</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPost.platforms?.map((platform: string) => (
                      <Badge key={platform} variant="outline" className="capitalize">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Content</h4>
                  <p className="text-sm leading-relaxed bg-muted p-4 rounded-lg">
                    {selectedPost.content}
                  </p>
                </div>
                {selectedPost.flag_reason && (
                  <div>
                    <h4 className="font-semibold mb-2 text-destructive">Flag Reason</h4>
                    <p className="text-sm bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                      {selectedPost.flag_reason}
                    </p>
                  </div>
                )}
                {selectedPost.scheduled_at && (
                  <div>
                    <h4 className="font-semibold mb-2">Scheduled For</h4>
                    <p className="text-sm">{new Date(selectedPost.scheduled_at).toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold mb-2">Created At</h4>
                  <p className="text-sm">{new Date(selectedPost.created_at).toLocaleString()}</p>
                </div>
                {selectedPost.media_urls && selectedPost.media_urls.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Media</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPost.media_urls.map((media: any, idx: number) => {
                        const mediaUrl = typeof media === 'string' ? media : media.url;
                        const mediaType = typeof media === 'string' ? 'photo' : media.type;
                        
                        if (mediaType === 'video') {
                          return (
                            <video 
                              key={idx}
                              controls
                              className="rounded-lg border w-full h-48 object-cover"
                            >
                              <source src={mediaUrl} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          );
                        }
                        
                        return (
                          <img 
                            key={idx} 
                            src={mediaUrl} 
                            alt={`Media ${idx + 1}`} 
                            className="rounded-lg border w-full h-48 object-cover"
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ContentModeration;
