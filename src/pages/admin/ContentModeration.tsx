import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, AlertTriangle, Eye, Calendar, User, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Post {
  id: string;
  user_id: string;
  company_id: string | null;
  user_email?: string;
  user_name?: string;
  platforms: string[];
  content: string;
  media_urls?: Array<{ url: string; type?: string }>;
  status: string;
  flagged: boolean;
  flag_reason: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  moderated_by: string | null;
  moderated_at: string | null;
  likes?: number;
  shares?: number;
  views?: number;
}

export default function ContentModeration() {
  const { user, isSuperAdmin, isCompanyAdmin } = useAuth();
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<Post[]>([]);
  const [history, setHistory] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [batchScanning, setBatchScanning] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [user, isSuperAdmin, isCompanyAdmin]);

  const fetchPosts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('social_media_posts')
        .select('*, media_urls')
        .order('created_at', { ascending: false });

      // Filter based on role
      if (isCompanyAdmin && !isSuperAdmin) {
        // Company admins see only their company's posts
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (profile?.company_id) {
          query = query.eq('company_id', profile.company_id);
        }
      }
      // Super admins see all posts

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user profiles separately (only if we have posts)
      const userIds = [...new Set((data || []).map(p => p.user_id))];
      let profileMap = new Map();
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        
        profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      }

      // Transform and categorize posts
      const transformedPosts = (data || []).map(post => ({
        ...post,
        media_urls: (post.media_urls as any) || [],
        user_email: profileMap.get(post.user_id)?.email || 'Unknown',
        user_name: profileMap.get(post.user_id)?.full_name || 'Unknown User',
      }));

      setPendingPosts(
        transformedPosts.filter(
          p => (p.status === 'draft' || p.status === 'pending') && !p.flagged && !p.moderated_by
        )
      );
      setFlaggedPosts(transformedPosts.filter(p => p.flagged && !p.moderated_by));
      setHistory(
        transformedPosts.filter(
          p => p.moderated_by && (p.status === 'scheduled' || p.status === 'published' || p.status === 'failed')
        ).slice(0, 10)
      );
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('social_media_posts')
        .update({
          status: 'scheduled',
          flagged: false,
          flag_reason: null,
          moderated_by: user?.id,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;

      // Get post owner to send notification
      const post = pendingPosts.find(p => p.id === postId) || flaggedPosts.find(p => p.id === postId);
      if (post?.user_id) {
        // Send notification (don't wait for it)
        supabase.functions.invoke('notify-post-status', {
          body: {
            postId,
            userId: post.user_id,
            action: 'approved'
          }
        }).catch(err => console.error('Notification error:', err));
      }

      // Post to configured platforms
      if (post?.company_id) {
        // Post to Telegram
        if (post.platforms?.includes('telegram')) {
          supabase.functions.invoke('post-to-telegram', {
            body: { postId, companyId: post.company_id }
          }).then(({ error: telegramError }) => {
            if (telegramError) {
              console.error('Telegram posting error:', telegramError);
              toast({
                title: "Post approved",
                description: "But Telegram posting failed. Check configuration.",
                variant: "destructive",
              });
            }
          }).catch(err => console.error('Telegram error:', err));
        }

        // Post to TikTok
        if (post.platforms?.includes('tiktok')) {
          supabase.functions.invoke('post-to-tiktok', {
            body: { postId, companyId: post.company_id }
          }).then(({ error: tiktokError }) => {
            if (tiktokError) {
              console.error('TikTok posting error:', tiktokError);
              toast({
                title: "Post approved",
                description: "But TikTok posting failed. Check configuration.",
                variant: "destructive",
              });
            }
          }).catch(err => console.error('TikTok error:', err));
        }
      }

      toast({
        title: "Success",
        description: "Post approved and scheduled for publishing",
      });
      fetchPosts();
    } catch (error) {
      console.error('Error approving post:', error);
      toast({
        title: "Error",
        description: "Failed to approve post",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('social_media_posts')
        .update({
          status: 'rejected',
          moderated_by: user?.id,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', postId);

      if (error) throw error;

      // Get post owner and flag reason to send notification
      const post = pendingPosts.find(p => p.id === postId) || flaggedPosts.find(p => p.id === postId);
      if (post?.user_id) {
        // Send notification (don't wait for it)
        supabase.functions.invoke('notify-post-status', {
          body: {
            postId,
            userId: post.user_id,
            action: 'rejected',
            reason: post.flag_reason || 'Content does not meet platform guidelines'
          }
        }).catch(err => console.error('Notification error:', err));
      }

      toast({
        title: "Post Rejected",
        description: "The post has been rejected",
        variant: "destructive",
      });
      fetchPosts();
    } catch (error) {
      console.error('Error rejecting post:', error);
      toast({
        title: "Error",
        description: "Failed to reject post",
        variant: "destructive",
      });
    }
  };

  const handleFlag = async (postId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('social_media_posts')
        .update({
          flagged: true,
          flag_reason: reason || 'Flagged for manual review',
        })
        .eq('id', postId);

      if (error) throw error;

      // Get post owner to send notification
      const post = pendingPosts.find(p => p.id === postId) || flaggedPosts.find(p => p.id === postId);
      if (post?.user_id) {
        // Send notification (don't wait for it)
        supabase.functions.invoke('notify-post-status', {
          body: {
            postId,
            userId: post.user_id,
            action: 'flagged',
            reason: reason || 'Flagged for manual review'
          }
        }).catch(err => console.error('Notification error:', err));
      }

      toast({
        title: "Post Flagged",
        description: "The post has been flagged for review",
      });
      fetchPosts();
    } catch (error) {
      console.error('Error flagging post:', error);
      toast({
        title: "Error",
        description: "Failed to flag post",
        variant: "destructive",
      });
    }
  };

  const handleRunModerationCheck = async (postId: string) => {
    const post = pendingPosts.find(p => p.id === postId) || flaggedPosts.find(p => p.id === postId);
    if (!post) return;

    try {
      toast({
        title: "Running AI Analysis",
        description: "Checking content for policy violations...",
      });

      const { data, error } = await supabase.functions.invoke('moderate-content', {
        body: {
          postId: post.id,
          content: `${post.content}\n\n${(post.media_urls || []).filter((m:any) => ((m.type || '') !== 'photo' && (m.type || '') !== 'video')).map((m:any) => m.url).join('\n')}`.trim(),
          platforms: post.platforms
        }
      });

      if (error) throw error;

      if (data?.shouldFlag) {
        toast({
          title: "Violations Detected",
          description: `${data.violations?.join(', ') || 'Policy violations found'}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Content Safe",
          description: "No policy violations detected",
        });
      }

      fetchPosts();
    } catch (error) {
      console.error('Error running moderation check:', error);
      toast({
        title: "Error",
        description: "Failed to analyze content",
        variant: "destructive",
      });
    }
  };

  const handleBatchScanAll = async () => {
    if (pendingPosts.length === 0) {
      toast({
        title: "No Posts",
        description: "No pending posts to scan",
      });
      return;
    }

    setBatchScanning(true);
    let scanned = 0;
    let flagged = 0;

    try {
      toast({
        title: "Batch Scanning Started",
        description: `Analyzing ${pendingPosts.length} posts...`,
      });

      for (const post of pendingPosts) {
        try {
          const { data, error } = await supabase.functions.invoke('moderate-content', {
            body: {
              postId: post.id,
              content: `${post.content}\n\n${(post.media_urls || []).filter((m:any) => ((m.type || '') !== 'photo' && (m.type || '') !== 'video')).map((m:any) => m.url).join('\n')}`.trim(),
              platforms: post.platforms
            }
          });

          if (!error) {
            scanned++;
            if (data?.shouldFlag) {
              flagged++;
            }
          }
        } catch (err) {
          console.error(`Error scanning post ${post.id}:`, err);
        }
      }

      toast({
        title: "Batch Scan Complete",
        description: `Scanned ${scanned} posts, flagged ${flagged} for review`,
      });

      fetchPosts();
    } catch (error) {
      console.error('Batch scan error:', error);
      toast({
        title: "Error",
        description: "Batch scan failed",
        variant: "destructive",
      });
    } finally {
      setBatchScanning(false);
    }
  };

  const handleViewDetails = (post: Post) => {
    setSelectedPost(post);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve user-generated content
          </p>
        </div>
        {pendingPosts.length > 0 && (
          <Button
            onClick={handleBatchScanAll}
            disabled={batchScanning}
            variant="outline"
            className="border-purple-500 text-purple-700 hover:bg-purple-50"
          >
            {batchScanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                AI Scan All ({pendingPosts.length})
              </>
            )}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Review ({pendingPosts.length})
            </TabsTrigger>
            <TabsTrigger value="flagged">
              Flagged Content ({flaggedPosts.length})
            </TabsTrigger>
            <TabsTrigger value="history">Review History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingPosts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No pending posts to review
                </CardContent>
              </Card>
            ) : (
              pendingPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {post.user_name || post.user_email}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {post.platforms.map((platform, i) => (
                            <Badge key={i} variant="outline">{platform}</Badge>
                          ))}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(post.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm line-clamp-3">{post.content}</p>
                    {post.media_urls && post.media_urls.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {post.media_urls.map((media, idx) => {
                        const t = media.type || '';
                        if (t === 'video' || t === 'photo') {
                          return (
                            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                              {t === 'video' ? (
                                <video src={media.url} className="w-full h-full object-cover" />
                              ) : (
                                <img src={media.url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
                              )}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                    )}
                    {post.media_urls && post.media_urls.some((m) => ((m.type || '') !== 'photo' && (m.type || '') !== 'video')) && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Links</h4>
                        <div className="flex gap-2 flex-wrap">
                          {post.media_urls.filter((m) => ((m.type || '') !== 'photo' && (m.type || '') !== 'video')).map((media, idx) => (
                            <a
                              key={`link-${idx}`}
                              href={media.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 text-xs rounded-md border bg-muted hover:underline"
                              title={media.url}
                            >
                              {(media.type || 'link')}: {(() => { try { return new URL(media.url).hostname; } catch { return media.url; } })()}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {(() => {
                      const linksFromMedia = (post.media_urls || [])
                        .filter((m: any) => ((m.type || '') !== 'photo' && (m.type || '') !== 'video'))
                        .map((m: any) => m.url);
                      const linksFromContent = Array.from(new Set((post.content.match(/https?:\/\/[^\s]+/g) || [])))
                        .filter((u: string) => !linksFromMedia.includes(u));
                      if (linksFromContent.length === 0) return null;
                      return (
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-muted-foreground">Links from content</h4>
                          <div className="flex gap-2 flex-wrap">
                            {linksFromContent.map((url: string, idx: number) => (
                              <a
                                key={`cnt-link-${idx}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-xs rounded-md border bg-muted hover:underline"
                                title={url}
                              >
                                {(() => { try { return new URL(url).hostname; } catch { return url; } })()}
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(post)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-500 text-purple-700 hover:bg-purple-50"
                        onClick={() => handleRunModerationCheck(post.id)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Run AI Check
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(post.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(post.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFlag(post.id)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Flag
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="flagged" className="space-y-4">
            {flaggedPosts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No flagged posts
                </CardContent>
              </Card>
            ) : (
              flaggedPosts.map((post) => (
                <Card key={post.id} className="border-destructive">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {post.user_name || post.user_email}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          {post.platforms.map((platform, i) => (
                            <Badge key={i} variant="outline">{platform}</Badge>
                          ))}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(post.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      </div>
                      <Badge variant="destructive">Flagged</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm line-clamp-3">{post.content}</p>
                    {post.media_urls && post.media_urls.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {post.media_urls.map((media, idx) => {
                          const t = media.type || '';
                          if (t === 'video' || t === 'photo') {
                            return (
                              <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                                {t === 'video' ? (
                                  <video src={media.url} className="w-full h-full object-cover" />
                                ) : (
                                  <img src={media.url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
                                )}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                    {post.media_urls && post.media_urls.some((m) => ((m.type || '') !== 'photo' && (m.type || '') !== 'video')) && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Links</h4>
                        <div className="flex gap-2 flex-wrap">
                          {post.media_urls.filter((m) => ((m.type || '') !== 'photo' && (m.type || '') !== 'video')).map((media, idx) => (
                            <a
                              key={`flag-link-${idx}`}
                              href={media.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 text-xs rounded-md border bg-muted hover:underline"
                              title={media.url}
                            >
                              {(media.type || 'link')}: {(() => { try { return new URL(media.url).hostname; } catch { return media.url; } })()}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {(() => {
                      const linksFromMedia = (post.media_urls || [])
                        .filter((m: any) => ((m.type || '') !== 'photo' && (m.type || '') !== 'video'))
                        .map((m: any) => m.url);
                      const linksFromContent = Array.from(new Set((post.content.match(/https?:\/\/[^\s]+/g) || [])))
                        .filter((u: string) => !linksFromMedia.includes(u));
                      if (linksFromContent.length === 0) return null;
                      return (
                        <div className="space-y-2">
                          <h4 className="text-xs font-medium text-muted-foreground">Links from content</h4>
                          <div className="flex gap-2 flex-wrap">
                            {linksFromContent.map((url: string, idx: number) => (
                              <a
                                key={`flag-cnt-link-${idx}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-xs rounded-md border bg-muted hover:underline"
                                title={url}
                              >
                                {(() => { try { return new URL(url).hostname; } catch { return url; } })()}
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    {post.flag_reason && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <p className="text-xs text-destructive font-medium mb-1">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Flag Reason:
                        </p>
                        <p className="text-xs text-destructive">{post.flag_reason}</p>
                      </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(post)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-500 text-purple-700 hover:bg-purple-50"
                        onClick={() => handleRunModerationCheck(post.id)}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Re-analyze
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(post.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(post.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Recent Moderation Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No moderation history yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {history.map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            {post.user_name || post.user_email}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {post.content}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={post.status === 'scheduled' || post.status === 'published' ? "default" : "destructive"}>
                            {post.status === 'scheduled' ? 'Approved' : post.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {post.moderated_at && format(new Date(post.moderated_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Content Details</DialogTitle>
            <DialogDescription>Full information about this post</DialogDescription>
          </DialogHeader>
          
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {selectedPost.user_name || selectedPost.user_email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(selectedPost.created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {selectedPost.platforms.map((platform, i) => (
                    <Badge key={i} variant="outline">{platform}</Badge>
                  ))}
                  {selectedPost.flagged && (
                    <Badge variant="destructive">Flagged</Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Content
                </h4>
                <p className="text-sm text-foreground leading-relaxed bg-muted p-3 rounded-lg whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
              </div>

              {selectedPost.media_urls && selectedPost.media_urls.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Media</h4>
                  <div className="grid grid-cols-2 gap-4">
                      {selectedPost.media_urls.map((media, idx) => {
                        const t = media.type || '';
                        if (t === 'video' || t === 'photo') {
                          return (
                            <div key={idx} className="relative rounded-lg overflow-hidden border aspect-video">
                              {t === 'video' ? (
                                <video 
                                  src={media.url} 
                                  controls 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img 
                                  src={media.url} 
                                  alt={`Media ${idx + 1}`} 
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                          );
                        }
                        // External links (YouTube, Vimeo, generic)
                        return (
                          <a
                            key={idx}
                            href={media.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center border rounded-lg p-2 text-xs bg-muted"
                            title={media.url}
                          >
                            {(t || 'link')}: {(() => { try { return new URL(media.url).hostname; } catch { return media.url; } })()}
                          </a>
                        );
                      })}
                  </div>
                </div>
              )}

              {(selectedPost.likes || selectedPost.shares || selectedPost.views) && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Engagement Metrics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedPost.likes !== undefined && (
                      <div className="bg-muted p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold">{selectedPost.likes}</div>
                        <div className="text-xs text-muted-foreground">Likes</div>
                      </div>
                    )}
                    {selectedPost.shares !== undefined && (
                      <div className="bg-muted p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold">{selectedPost.shares}</div>
                        <div className="text-xs text-muted-foreground">Shares</div>
                      </div>
                    )}
                    {selectedPost.views !== undefined && (
                      <div className="bg-muted p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold">{selectedPost.views}</div>
                        <div className="text-xs text-muted-foreground">Views</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedPost.flag_reason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Flag Reason
                  </h4>
                  <p className="text-sm text-destructive">{selectedPost.flag_reason}</p>
                </div>
              )}

              {selectedPost.scheduled_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Scheduled for: {format(new Date(selectedPost.scheduled_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
              )}

              <Separator />

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    handleApprove(selectedPost.id);
                    setIsDetailsOpen(false);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleReject(selectedPost.id);
                    setIsDetailsOpen(false);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
