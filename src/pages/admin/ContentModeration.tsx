import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, AlertTriangle, CheckCircle2, XCircle, Search, Filter, Globe, Clock, Eye, LayoutList, LayoutGrid, RefreshCw, ArrowUpDown, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createNotification } from "@/lib/notifications";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ContentModeration = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("draft");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"queue" | "kanban">("queue");
  const [hideNew, setHideNew] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [recheckingPostId, setRecheckingPostId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [postToReject, setPostToReject] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [postToApprove, setPostToApprove] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["moderation-posts", statusFilter, platformFilter, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from("social_media_posts")
        .select("*")
        .order("created_at", { ascending: sortOrder === "asc" });

      // Handle flagged filter specially
      if (statusFilter === "flagged") {
        query = query.eq("flagged", true);
      } else if (statusFilter !== "all") {
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

      const { data: rejectedPosts } = await supabase
        .from("social_media_posts")
        .select("id", { count: "exact" })
        .eq("status", "rejected");

      return {
        flagged: flaggedPosts?.length || 0,
        pending: pendingPosts?.length || 0,
        approved: approvedPosts?.length || 0,
        rejected: rejectedPosts?.length || 0,
      };
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, updates, post }: { id: string; updates: any; post?: any }) => {
      const { error } = await supabase
        .from("social_media_posts")
        .update(updates)
        .eq("id", id);
      if (error) throw error;

      // Send notifications if post is rejected or flagged
      if (updates.status === "rejected" && post) {
        // Get admin users to notify supervisors
        const { data: adminUsers } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        // Notify post creator
        if (post.user_id) {
          await createNotification({
            userId: post.user_id,
            companyId: post.company_id,
            title: "Post Rejected",
            message: updates.rejection_reason 
              ? `Your post has been rejected. Reason: ${updates.rejection_reason}`
              : "Your post has been rejected by the moderation team.",
            type: "error",
            actionUrl: "/composer",
            actionLabel: "Edit Post",
            metadata: { postId: id }
          });
        }

        // Notify supervisors/admins
        if (adminUsers && adminUsers.length > 0) {
          for (const admin of adminUsers) {
            await createNotification({
              userId: admin.user_id,
              companyId: post.company_id,
              title: "Post Rejected",
              message: `A post has been rejected. ${updates.rejection_reason ? `Reason: ${updates.rejection_reason}` : ''}`,
              type: "warning",
              actionUrl: "/admin/moderation",
              actionLabel: "View Details",
              metadata: { postId: id }
            });
          }
        }
      }

      return { post };
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
      try {
        // Primary: secure backend path
        const { data, error } = await supabase.functions.invoke('approve-post', {
          body: { postId: post.id },
        });
        if (error) throw error;
        return data as { scheduled?: boolean; scheduledFor?: string; alreadyPublished?: boolean };
      } catch (err) {
        // Fallback: client-side update (in case function unavailable)
        console.error('approve-post: function failed, using fallback', err);
        const { data: { user } } = await supabase.auth.getUser();
        const now = new Date().toISOString();
        const scheduledFor = post.scheduled_at || post.scheduled_for;
        const isScheduled = scheduledFor && new Date(scheduledFor) > new Date();

        const updates: any = {
          flagged: false,
          approved_by: user?.id,
          approved_at: now,
        };
        if (isScheduled) {
          updates.status = 'scheduled';
          updates.scheduled_for = scheduledFor;
        } else if (post.status !== 'published') {
          updates.status = 'published';
          updates.published_at = now;
        }

        const { error: updateError } = await supabase
          .from('social_media_posts')
          .update(updates)
          .eq('id', post.id);
        if (updateError) throw updateError;

        return { scheduled: !!isScheduled, scheduledFor, alreadyPublished: post.status === 'published' };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["moderation-posts"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-stats"] });
      if (result.scheduled) {
        toast.success(`Post approved and scheduled for ${new Date(result.scheduledFor).toLocaleString()}`);
      } else if (result.alreadyPublished) {
        toast.success("Published post has been approved");
      } else {
        toast.success("Post approved and marked as published");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to approve post");
      console.error("Error approving post:", error);
    },
  });

  const filteredPosts = posts?.filter((post) => {
    // Search filter (only if search term exists)
    if (searchTerm.trim()) {
      const matchesSearch = post.content?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
    }

    // View mode filter
    if (viewMode === "queue") {
      // Queue shows draft and scheduled posts (not flagged or rejected)
      if (post.status !== "draft" && post.status !== "scheduled") return false;
      if (post.flagged) return false; // Exclude flagged posts from queue
      if (hideNew) return false; // Hide if "hide new" is enabled
    } else {
      // Kanban shows rejected and flagged posts
      if (post.status !== "rejected" && !post.flagged) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil((filteredPosts?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPosts = filteredPosts?.slice(startIndex, endIndex);

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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
              <Shield className="h-10 w-10 text-primary animate-pulse" />
              AI Content Moderation Center
            </h1>
            <p className="text-muted-foreground text-lg">
              Comprehensive content review powered by advanced AI algorithms
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["moderation-posts"] });
                queryClient.invalidateQueries({ queryKey: ["moderation-stats"] });
                toast.success("Data refreshed");
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
              <Globe className="h-4 w-4" />
              Multi-Language
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card 
            className="border-2 hover:border-destructive/50 transition-all group cursor-pointer hover:shadow-lg"
            onClick={() => {
              setStatusFilter("flagged");
              setPlatformFilter("all");
              setViewMode("kanban");
              setCurrentPage(1);
              // Scroll to content list
              setTimeout(() => {
                document.getElementById("content-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 group-hover:text-destructive transition-colors">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Flagged Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{stats?.flagged || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to review flagged posts</p>
            </CardContent>
          </Card>

          <Card 
            className="border-2 hover:border-yellow-500/50 transition-all group cursor-pointer hover:shadow-lg"
            onClick={() => {
              setStatusFilter("draft");
              setPlatformFilter("all");
              setViewMode("queue");
              setCurrentPage(1);
              setTimeout(() => {
                document.getElementById("content-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 group-hover:text-yellow-600 transition-colors">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">{stats?.pending || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to review pending posts</p>
            </CardContent>
          </Card>

          <Card 
            className="border-2 hover:border-green-500/50 transition-all group cursor-pointer hover:shadow-lg"
            onClick={() => {
              setStatusFilter("published");
              setPlatformFilter("all");
              setViewMode("queue");
              setCurrentPage(1);
              setTimeout(() => {
                document.getElementById("content-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 group-hover:text-green-700 transition-colors">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Approved Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.approved || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to view published posts</p>
            </CardContent>
          </Card>

          <Card 
            className="border-2 hover:border-red-500/50 transition-all group cursor-pointer hover:shadow-lg"
            onClick={() => {
              setStatusFilter("rejected");
              setPlatformFilter("all");
              setViewMode("kanban");
              setCurrentPage(1);
              setTimeout(() => {
                document.getElementById("content-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 group-hover:text-red-700 transition-colors">
                <XCircle className="h-4 w-4 text-red-600" />
                Rejected Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats?.rejected || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to review rejected posts</p>
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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="flagged">🚩 Flagged by AI</SelectItem>
                    <SelectItem value="draft">Pending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={platformFilter} onValueChange={(value) => {
                  setPlatformFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Filter by platform" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
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

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="gap-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {sortOrder === "desc" ? "Newest First" : "Oldest First"}
                </Button>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredPosts?.length || 0} posts
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content List */}
        <Card id="content-list" className="border-2 scroll-mt-6">
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
            ) : paginatedPosts && paginatedPosts.length > 0 ? (
              <TooltipProvider>
                <div className="space-y-4">
                  {paginatedPosts.map((post) => (
                    <Card key={post.id} className="border hover:border-primary/50 transition-all hover:shadow-md">
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
                            <p className="text-sm leading-relaxed line-clamp-3">{post.content}</p>
                            
                            {/* Display rejection reason */}
                            {post.rejection_reason && (
                              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                                  <XCircle className="h-4 w-4" />
                                  Rejection Reason:
                                </p>
                                <p className="text-sm text-muted-foreground mt-1 italic">"{post.rejection_reason}"</p>
                              </div>
                            )}

                            {/* Display AI flag reason */}
                            {post.flagged && post.flag_reason && (
                              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  AI Flagged:
                                </p>
                                <p className="text-sm text-muted-foreground mt-1 italic">"{post.flag_reason}"</p>
                              </div>
                            )}

                            {post.scheduled_at && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Scheduled: {new Date(post.scheduled_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
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
                              </TooltipTrigger>
                              <TooltipContent>View full details</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => recheckContentMutation.mutate(post)}
                                  disabled={recheckingPostId === post.id}
                                  className="gap-2"
                                >
                                  <RefreshCw className={`h-4 w-4 ${recheckingPostId === post.id ? 'animate-spin' : ''}`} />
                                  <span className="hidden md:inline">AI Recheck</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Recheck with AI moderation</TooltipContent>
                            </Tooltip>
                            
                            {(post.flagged || post.status === "draft") && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => {
                                      setPostToApprove(post);
                                      setIsApproveDialogOpen(true);
                                    }}
                                    disabled={approvePostMutation.isPending}
                                    className="gap-2"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="hidden md:inline">Approve</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Approve and publish</TooltipContent>
                              </Tooltip>
                            )}
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setPostToReject(post);
                                    setRejectionReason("");
                                    setIsRejectDialogOpen(true);
                                  }}
                                  disabled={updatePostMutation.isPending}
                                  className="gap-2"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span className="hidden md:inline">Reject</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reject this post</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TooltipProvider>
            ) : (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">No content to review</p>
                <p className="text-sm text-muted-foreground mt-2">All content has been moderated</p>
              </div>
            )}

            {/* Pagination */}
            {filteredPosts && filteredPosts.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} • {filteredPosts.length} total posts
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Post Details & History
              </DialogTitle>
            </DialogHeader>
            {selectedPost && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(selectedPost.status, selectedPost.flagged)}
                    {selectedPost.platforms?.map((platform: string) => (
                      <Badge key={platform} variant="outline" className="capitalize">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Content</h3>
                    <p className="text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
                      {selectedPost.content}
                    </p>
                  </div>

                  {selectedPost.media_urls && selectedPost.media_urls.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Media</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedPost.media_urls.map((media: any, idx: number) => {
                          const mediaUrl = typeof media === 'string' ? media : media.url;
                          const mediaType = typeof media === 'string' ? 'photo' : media.type;
                          
                          if (mediaType === 'video') {
                            return (
                              <video 
                                key={idx}
                                controls
                                className="rounded-lg w-full h-48 object-cover"
                              >
                                <source src={mediaUrl} type="video/mp4" />
                              </video>
                            );
                          }
                          
                          return (
                            <img
                              key={idx}
                              src={mediaUrl}
                              alt={`Media ${idx + 1}`}
                              className="rounded-lg w-full h-48 object-cover"
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Hashtags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedPost.hashtags.map((tag: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* History Section */}
                  <div className="space-y-3 border-t pt-4">
                    <h3 className="font-semibold text-lg">History & Timeline</h3>
                    <div className="space-y-3">
                      {selectedPost.created_at && (
                        <div className="flex items-start gap-3 text-sm">
                          <Badge variant="outline" className="mt-0.5">Created</Badge>
                          <div>
                            <p className="font-medium">{new Date(selectedPost.created_at).toLocaleString()}</p>
                            {selectedPost.user_id && <p className="text-muted-foreground">By user: {selectedPost.user_id.slice(0, 8)}...</p>}
                          </div>
                        </div>
                      )}

                      {selectedPost.approved_at && selectedPost.approved_by && (
                        <div className="flex items-start gap-3 text-sm">
                          <Badge variant="outline" className="mt-0.5 bg-green-500/10">Approved</Badge>
                          <div>
                            <p className="font-medium">{new Date(selectedPost.approved_at).toLocaleString()}</p>
                            <p className="text-muted-foreground">By: {selectedPost.approved_by.slice(0, 8)}...</p>
                            {selectedPost.approval_comment && (
                              <p className="text-sm mt-1 italic">"{selectedPost.approval_comment}"</p>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedPost.flagged && selectedPost.flag_reason && (
                        <div className="flex items-start gap-3 text-sm">
                          <Badge variant="destructive" className="mt-0.5">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            AI Flagged
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium text-destructive">Flagged by AI Moderation</p>
                            <p className="text-sm mt-1 bg-destructive/10 border border-destructive/30 rounded p-2">
                              <span className="font-medium">Reason:</span> "{selectedPost.flag_reason}"
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedPost.rejected_at && selectedPost.rejected_by && (
                        <div className="flex items-start gap-3 text-sm">
                          <Badge variant="destructive" className="mt-0.5">Rejected</Badge>
                          <div className="flex-1">
                            <p className="font-medium">{new Date(selectedPost.rejected_at).toLocaleString()}</p>
                            <p className="text-muted-foreground">By: {selectedPost.rejected_by.slice(0, 8)}...</p>
                            {selectedPost.rejection_reason && (
                              <p className="text-sm mt-2 bg-destructive/10 border border-destructive/30 rounded p-2">
                                <span className="font-medium">Reason:</span> "{selectedPost.rejection_reason}"
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedPost.scheduled_for && (
                        <div className="flex items-start gap-3 text-sm">
                          <Badge variant="outline" className="mt-0.5 bg-blue-500/10">
                            <Clock className="h-3 w-3 mr-1" />
                            Scheduled
                          </Badge>
                          <div>
                            <p className="font-medium">{new Date(selectedPost.scheduled_for).toLocaleString()}</p>
                            <p className="text-muted-foreground">Will publish at this time</p>
                          </div>
                        </div>
                      )}

                      {selectedPost.published_at && (
                        <div className="flex items-start gap-3 text-sm">
                          <Badge variant="outline" className="mt-0.5 bg-green-500/10">Published</Badge>
                          <div>
                            <p className="font-medium">{new Date(selectedPost.published_at).toLocaleString()}</p>
                            {selectedPost.platform_post_url && (
                              <a
                                href={selectedPost.platform_post_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm"
                              >
                                View on platform →
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4 flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (selectedPost) {
                        recheckContentMutation.mutate(selectedPost);
                      }
                    }}
                    disabled={recheckingPostId === selectedPost?.id || recheckContentMutation.isPending}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${recheckingPostId === selectedPost?.id ? 'animate-spin' : ''}`} />
                    {recheckingPostId === selectedPost?.id ? "Rechecking..." : "AI Recheck"}
                  </Button>

                  {(selectedPost.flagged || selectedPost.status === "draft" || selectedPost.status === "scheduled") && (
                    <Button
                      variant="default"
                      onClick={() => {
                        if (selectedPost) {
                          setPostToApprove(selectedPost);
                          setIsApproveDialogOpen(true);
                          setIsViewDialogOpen(false);
                        }
                      }}
                      disabled={approvePostMutation.isPending}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {approvePostMutation.isPending ? "Approving..." : "Approve & Publish"}
                    </Button>
                  )}

                  {selectedPost.status !== "rejected" && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setPostToReject(selectedPost);
                        setRejectionReason("");
                        setIsViewDialogOpen(false);
                        setIsRejectDialogOpen(true);
                      }}
                      disabled={updatePostMutation.isPending}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Approve Confirmation Dialog */}
        <AlertDialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Confirm Approval
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve this post? It will be published to all selected platforms.
                {postToApprove?.scheduled_at && (
                  <span className="block mt-2 text-primary font-medium">
                    This post is scheduled for {new Date(postToApprove.scheduled_at).toLocaleString()}
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIsApproveDialogOpen(false);
                setPostToApprove(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (postToApprove) {
                    approvePostMutation.mutate(postToApprove);
                  }
                  setIsApproveDialogOpen(false);
                  setPostToApprove(null);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Approval
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Rejection Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Post</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this post. This will be shared with the post creator.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter the reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setPostToReject(null);
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!postToReject) return;
                  const { data: { user } } = await supabase.auth.getUser();
                  updatePostMutation.mutate({ 
                    id: postToReject.id,
                    post: postToReject,
                    updates: { 
                      status: "rejected", 
                      flagged: false,
                      rejected_by: user?.id,
                      rejected_at: new Date().toISOString(),
                      rejection_reason: rejectionReason.trim() || null,
                    }
                  });
                  setIsRejectDialogOpen(false);
                  setPostToReject(null);
                  setRejectionReason("");
                }}
                disabled={updatePostMutation.isPending}
              >
                {updatePostMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Confirm Rejection"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ContentModeration;
