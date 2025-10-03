import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, AlertTriangle, Eye, Calendar, User, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: number;
  user: string;
  platform: string;
  content: string;
  status: string;
  flagged: boolean;
  timestamp: string;
  fullContent?: string;
  media?: string[];
  engagement?: { likes: number; shares: number; comments: number };
  flagReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
}

export default function ContentModeration() {
  const [pendingPosts] = useState<Post[]>([
    {
      id: 1,
      user: "john@example.com",
      platform: "Twitter",
      content: "Check out our new product launch! Amazing features coming soon...",
      fullContent: "Check out our new product launch! Amazing features coming soon. We've been working hard on this and can't wait to share it with you all. Limited time offer - first 100 customers get 30% off!",
      status: "pending",
      flagged: false,
      timestamp: "2024-10-02 10:30 AM",
      media: ["product-image-1.jpg", "product-image-2.jpg"],
      engagement: { likes: 45, shares: 12, comments: 8 }
    },
    {
      id: 2,
      user: "sarah@example.com",
      platform: "Instagram",
      content: "Summer sale starting now! Get 50% off everything!",
      fullContent: "🌞 Summer sale starting now! Get 50% off everything! 🎉 Don't miss out on these amazing deals. Shop now at our store!",
      status: "pending",
      flagged: true,
      flagReason: "Possible misleading discount claim",
      timestamp: "2024-10-02 09:15 AM",
      media: ["sale-banner.jpg"],
      engagement: { likes: 89, shares: 34, comments: 15 }
    },
    {
      id: 3,
      user: "mike@example.com",
      platform: "LinkedIn",
      content: "Excited to announce our latest partnership with...",
      fullContent: "Excited to announce our latest partnership with TechCorp! This collaboration will bring innovative solutions to our customers and expand our market reach significantly.",
      status: "pending",
      flagged: false,
      timestamp: "2024-10-02 08:45 AM",
      engagement: { likes: 156, shares: 45, comments: 23 }
    },
  ]);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleApprove = (postId: number) => {
    toast.success("Post approved and published");
  };

  const handleReject = (postId: number) => {
    toast.error("Post rejected");
  };

  const handleFlag = (postId: number) => {
    toast.warning("Post flagged for review");
  };

  const handleViewDetails = (post: Post) => {
    setSelectedPost(post);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve user-generated content
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Review (3)</TabsTrigger>
          <TabsTrigger value="flagged">Flagged Content (1)</TabsTrigger>
          <TabsTrigger value="history">Review History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingPosts.filter(post => !post.flagged).map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {post.user}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{post.platform}</Badge>
                      <span className="text-xs text-muted-foreground">{post.timestamp}</span>
                    </div>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{post.content}</p>
                <div className="flex gap-2">
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
                    className="bg-success hover:bg-success/90"
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
          ))}
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4">
          {pendingPosts.filter(post => post.flagged).map((post) => (
            <Card key={post.id} className="border-destructive">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {post.user}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{post.platform}</Badge>
                      <span className="text-xs text-muted-foreground">{post.timestamp}</span>
                    </div>
                  </div>
                  <Badge variant="destructive">Flagged</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{post.content}</p>
                {post.flagReason && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-xs text-destructive font-medium mb-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Flag Reason:
                    </p>
                    <p className="text-xs text-destructive">{post.flagReason}</p>
                  </div>
                )}
                <div className="flex gap-2">
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
                    className="bg-success hover:bg-success/90"
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
          ))}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Moderation Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "Approved", user: "emma@example.com", content: "Product announcement", time: "1 hour ago" },
                  { action: "Rejected", user: "david@example.com", content: "Spam content detected", time: "2 hours ago" },
                  { action: "Approved", user: "lisa@example.com", content: "Customer testimonial", time: "3 hours ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{item.user}</p>
                      <p className="text-xs text-muted-foreground">{item.content}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.action === "Approved" ? "default" : "destructive"}>
                        {item.action}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
                    <span className="font-medium">{selectedPost.user}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{selectedPost.timestamp}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{selectedPost.platform}</Badge>
                  {selectedPost.flagged && (
                    <Badge variant="destructive">Flagged</Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Full Content
                </h4>
                <p className="text-sm text-foreground leading-relaxed bg-muted p-3 rounded-lg">
                  {selectedPost.fullContent || selectedPost.content}
                </p>
              </div>

              {selectedPost.media && selectedPost.media.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Media Attachments</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedPost.media.map((media, i) => (
                      <Badge key={i} variant="secondary">{media}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedPost.engagement && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Engagement Metrics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">{selectedPost.engagement.likes}</div>
                      <div className="text-xs text-muted-foreground">Likes</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">{selectedPost.engagement.shares}</div>
                      <div className="text-xs text-muted-foreground">Shares</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold">{selectedPost.engagement.comments}</div>
                      <div className="text-xs text-muted-foreground">Comments</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedPost.flagReason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Flag Reason
                  </h4>
                  <p className="text-sm text-destructive">{selectedPost.flagReason}</p>
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
                  className="bg-success hover:bg-success/90"
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
