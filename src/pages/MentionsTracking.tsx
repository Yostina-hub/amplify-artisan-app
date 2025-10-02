import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, TrendingUp, MessageCircle, Hash, Search, X } from "lucide-react";
import { toast } from "sonner";

interface Keyword {
  id: string;
  keyword: string;
  is_active: boolean;
  created_at: string;
}

interface Mention {
  id: string;
  platform: string;
  author_name: string;
  content: string;
  mention_type: string;
  engagement_count: number;
  sentiment: string | null;
  mentioned_at: string;
}

interface TrendingTopic {
  id: string;
  platform: string;
  topic: string;
  hashtag: string | null;
  volume: number;
  growth_rate: number;
  category: string | null;
}

export default function MentionsTracking() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [keywordsData, mentionsData, trendsData] = await Promise.all([
        supabase.from("tracked_keywords").select("*").order("created_at", { ascending: false }),
        supabase.from("social_media_mentions").select("*").order("mentioned_at", { ascending: false }).limit(50),
        supabase.from("trending_topics").select("*").order("volume", { ascending: false }).limit(20)
      ]);

      if (keywordsData.error) throw keywordsData.error;
      if (mentionsData.error) throw mentionsData.error;
      if (trendsData.error) throw trendsData.error;

      setKeywords(keywordsData.data || []);
      setMentions(mentionsData.data || []);
      setTrends(trendsData.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("tracked_keywords").insert({
        user_id: user.id,
        keyword: newKeyword.trim(),
        is_active: true
      });

      if (error) throw error;

      toast.success("Keyword added successfully");
      setNewKeyword("");
      setIsAddDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to add keyword: " + error.message);
    }
  };

  const handleToggleKeyword = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("tracked_keywords")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(currentStatus ? "Keyword deactivated" : "Keyword activated");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update keyword: " + error.message);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    try {
      const { error } = await supabase.from("tracked_keywords").delete().eq("id", id);
      if (error) throw error;

      toast.success("Keyword deleted");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete keyword: " + error.message);
    }
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive": return "bg-success/10 text-success";
      case "negative": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentions & Trends</h1>
          <p className="text-muted-foreground mt-1">
            Track mentions, keywords, and trending topics
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent">
              <Plus className="h-4 w-4 mr-2" />
              Add Keyword
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Keyword to Track</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Enter keyword or hashtag..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
              />
              <Button onClick={handleAddKeyword} className="w-full">
                Add Keyword
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="mentions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mentions">
            <MessageCircle className="h-4 w-4 mr-2" />
            Mentions
          </TabsTrigger>
          <TabsTrigger value="keywords">
            <Search className="h-4 w-4 mr-2" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mentions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Mentions</CardTitle>
            </CardHeader>
            <CardContent>
              {mentions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No mentions found. Add keywords to start tracking.
                </p>
              ) : (
                <div className="space-y-4">
                  {mentions.map((mention) => (
                    <div
                      key={mention.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{mention.author_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {mention.platform}
                          </Badge>
                          {mention.sentiment && (
                            <Badge className={getSentimentColor(mention.sentiment)}>
                              {mention.sentiment}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{mention.content}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{new Date(mention.mentioned_at).toLocaleDateString()}</span>
                          <span>{mention.engagement_count} engagements</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tracked Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              {keywords.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No keywords yet. Click "Add Keyword" to start tracking.
                </p>
              ) : (
                <div className="space-y-2">
                  {keywords.map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{keyword.keyword}</span>
                        <Badge variant={keyword.is_active ? "default" : "secondary"}>
                          {keyword.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleKeyword(keyword.id, keyword.is_active)}
                        >
                          {keyword.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteKeyword(keyword.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trending Topics</CardTitle>
            </CardHeader>
            <CardContent>
              {trends.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No trending topics available yet.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {trends.map((trend) => (
                    <div
                      key={trend.id}
                      className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="font-medium">{trend.topic}</span>
                        </div>
                        <Badge variant="outline">{trend.platform}</Badge>
                      </div>
                      {trend.hashtag && (
                        <p className="text-sm text-muted-foreground mb-2">{trend.hashtag}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {trend.volume.toLocaleString()} mentions
                        </span>
                        <span className="text-success">
                          +{trend.growth_rate}% growth
                        </span>
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
