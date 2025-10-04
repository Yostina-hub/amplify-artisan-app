import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Twitter, Facebook, Instagram, Linkedin, Youtube, TrendingUp, MessageCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { querySocialMediaAccountsSafe } from "@/lib/safeQuery";

type Comment = {
  id: string;
  platform_comment_id: string;
  author_name: string;
  content: string;
  replied: boolean;
  reply_content: string | null;
  created_at: string;
  account_id: string;
};

type Metric = {
  id: string;
  account_id: string;
  followers_count: number;
  posts_count: number;
  engagement_rate: number;
  last_synced_at: string;
};

type Account = {
  id: string;
  platform: string;
  account_name: string;
};

export default function SocialMediaMetrics() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyText, setReplyText] = useState("");
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, commentsRes] = await Promise.all([
        querySocialMediaAccountsSafe().select('*').eq('is_active', true),
        supabase.from('social_media_comments').select('*').order('created_at', { ascending: false }),
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (commentsRes.error) throw commentsRes.error;

      setAccounts(accountsRes.data || []);
      setMetrics([]);
      setComments(commentsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReply = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('social_media_comments')
        .update({
          replied: true,
          reply_content: replyText,
          replied_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: "Reply sent",
        description: "Your reply has been posted successfully",
      });

      setReplyText("");
      setSelectedComment(null);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return <Twitter className="h-5 w-5" />;
      case 'facebook': return <Facebook className="h-5 w-5" />;
      case 'instagram': return <Instagram className="h-5 w-5" />;
      case 'linkedin': return <Linkedin className="h-5 w-5" />;
      case 'youtube': return <Youtube className="h-5 w-5" />;
      default: return null;
    }
  };

  const getMetricsForAccount = (accountId: string) => {
    return metrics.find(m => m.account_id === accountId);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Social Media Metrics</h1>
        <p className="text-muted-foreground mt-1">
          Monitor performance across all connected platforms
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => {
          const accountMetrics = getMetricsForAccount(account.id);
          return (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {getPlatformIcon(account.platform)}
                  {account.account_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Followers
                    </span>
                    <span className="font-bold">{accountMetrics?.followers_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      Posts
                    </span>
                    <span className="font-bold">{accountMetrics?.posts_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      Engagement
                    </span>
                    <span className="font-bold">{accountMetrics?.engagement_rate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Comments & Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No comments yet</p>
            ) : (
              comments.map((comment) => {
                const account = accounts.find(a => a.id === comment.account_id);
                return (
                  <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {account && getPlatformIcon(account.platform)}
                        <div>
                          <p className="font-medium">{comment.author_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {comment.replied && <Badge variant="secondary">Replied</Badge>}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    {comment.replied && comment.reply_content && (
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Your Reply:</p>
                        <p className="text-sm">{comment.reply_content}</p>
                      </div>
                    )}
                    {!comment.replied && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedComment(comment)}>
                            Reply
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reply to {comment.author_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="bg-muted p-3 rounded-md">
                              <p className="text-sm">{comment.content}</p>
                            </div>
                            <Textarea
                              placeholder="Write your reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              rows={4}
                            />
                            <Button 
                              className="w-full"
                              onClick={() => handleReply(comment.id)}
                              disabled={!replyText.trim()}
                            >
                              Send Reply
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}