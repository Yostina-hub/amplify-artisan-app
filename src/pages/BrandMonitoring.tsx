import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Plus, TrendingUp, MessageCircle, Hash, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type Keyword = {
  id: string;
  keyword: string;
  is_active: boolean;
  created_at: string;
};

type Mention = {
  id: string;
  platform: string;
  author_name: string;
  content: string;
  mention_type: string;
  engagement_count: number;
  sentiment: string | null;
  mentioned_at: string;
  post_url: string | null;
};

type TrendingTopic = {
  id: string;
  platform: string;
  topic: string;
  hashtag: string | null;
  volume: number;
  growth_rate: number;
  category: string | null;
  detected_at: string;
};

export default function BrandMonitoring() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [keywordsRes, mentionsRes, trendsRes] = await Promise.all([
        supabase.from("tracked_keywords").select("*").order("created_at", { ascending: false }),
        supabase.from("social_media_mentions").select("*").order("mentioned_at", { ascending: false }).limit(50),
        supabase.from("trending_topics").select("*").order("volume", { ascending: false }).limit(20),
      ]);

      if (keywordsRes.error) throw keywordsRes.error;
      if (mentionsRes.error) throw mentionsRes.error;
      if (trendsRes.error) throw trendsRes.error;

      setKeywords(keywordsRes.data || []);
      setMentions(mentionsRes.data || []);
      setTrends(trendsRes.data || []);
    } catch (error: any) {
      toast.error("Failed to load data: " + error.message);
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
      });

      if (error) throw error;

      toast.success("Keyword added successfully");
      setNewKeyword("");
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

      toast.success(`Keyword ${!currentStatus ? "activated" : "deactivated"}`);
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
    if (!sentiment) return "bg-muted";
    if (sentiment === "positive") return "bg-success/10 text-success";
    if (sentiment === "negative") return "bg-destructive/10 text-destructive";
    return "bg-muted";
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: "text-[#1DA1F2]",
      instagram: "text-[#E4405F]",
      facebook: "text-[#1877F2]",
      linkedin: "text-[#0A66C2]",
    };
    return colors[platform.toLowerCase()] || "text-foreground";
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Brand Monitoring</h1>
        <p className="text-muted-foreground mt-1">
          Track mentions, keywords, and trending topics across social media
        </p>
      </div>

      <Tabs defaultValue="keywords" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
          <TabsTrigger value="trends">Trending Topics</TabsTrigger>
        </TabsList>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tracked Keywords</CardTitle>
              <CardDescription>
                Add keywords and hashtags to monitor across your social media accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter keyword or #hashtag..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
                />
                <Button onClick={handleAddKeyword}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {keywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No keywords added yet. Add your first keyword to start monitoring.
                  </p>
                ) : (
                  keywords.map((keyword) => (
                    <div
                      key={keyword.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{keyword.keyword}</span>
                        {keyword.is_active ? (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={keyword.is_active}
                          onCheckedChange={() => handleToggleKeyword(keyword.id, keyword.is_active)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteKeyword(keyword.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Mentions</CardTitle>
              <CardDescription>
                Recent mentions of your tracked keywords across platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mentions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No mentions found yet. Add keywords to start tracking mentions.
                </p>
              ) : (
                <div className="space-y-3">
                  {mentions.map((mention) => (
                    <div
                      key={mention.id}
                      className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageCircle className={`w-4 h-4 ${getPlatformColor(mention.platform)}`} />
                          <span className="font-medium text-sm">{mention.author_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {mention.platform}
                          </Badge>
                          {mention.sentiment && (
                            <Badge className={`text-xs ${getSentimentColor(mention.sentiment)}`}>
                              {mention.sentiment}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(mention.mentioned_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{mention.content}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {mention.engagement_count} engagements
                        </span>
                        {mention.post_url && (
                          <a
                            href={mention.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Post
                          </a>
                        )}
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
              <CardDescription>
                Popular topics and hashtags trending across platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No trending topics available yet.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {trends.map((trend) => (
                    <div
                      key={trend.id}
                      className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className={`w-4 h-4 ${getPlatformColor(trend.platform)}`} />
                          <h4 className="font-semibold">{trend.topic}</h4>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {trend.platform}
                        </Badge>
                      </div>
                      {trend.hashtag && (
                        <p className="text-sm text-primary mb-2">{trend.hashtag}</p>
                      )}
                      {trend.category && (
                        <Badge variant="secondary" className="text-xs mb-2">
                          {trend.category}
                        </Badge>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{trend.volume.toLocaleString()} posts</span>
                        <span className={trend.growth_rate > 0 ? "text-success" : "text-destructive"}>
                          {trend.growth_rate > 0 ? "+" : ""}{trend.growth_rate}% growth
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
