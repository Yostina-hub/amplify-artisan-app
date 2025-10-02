import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function ContentModeration() {
  const [pendingPosts] = useState([
    {
      id: 1,
      user: "john@example.com",
      platform: "Twitter",
      content: "Check out our new product launch! Amazing features coming soon...",
      status: "pending",
      flagged: false,
      timestamp: "2024-10-02 10:30 AM"
    },
    {
      id: 2,
      user: "sarah@example.com",
      platform: "Instagram",
      content: "Summer sale starting now! Get 50% off everything!",
      status: "pending",
      flagged: true,
      timestamp: "2024-10-02 09:15 AM"
    },
    {
      id: 3,
      user: "mike@example.com",
      platform: "LinkedIn",
      content: "Excited to announce our latest partnership with...",
      status: "pending",
      flagged: false,
      timestamp: "2024-10-02 08:45 AM"
    },
  ]);

  const handleApprove = (postId: number) => {
    toast.success("Post approved and published");
  };

  const handleReject = (postId: number) => {
    toast.error("Post rejected");
  };

  const handleFlag = (postId: number) => {
    toast.warning("Post flagged for review");
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
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    This content has been flagged for potential policy violations
                  </p>
                </div>
                <div className="flex gap-2">
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
    </div>
  );
}
