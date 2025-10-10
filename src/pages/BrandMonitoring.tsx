import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Plus, TrendingUp, MessageCircle, Hash, Eye, ExternalLink, Calendar, ThumbsUp, Shield, Globe, Sparkles, BarChart3, Target } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

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
  const [selectedMention, setSelectedMention] = useState<Mention | null>(null);

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

  const stats = {
    totalMentions: mentions.length,
    avgSentiment: mentions.length > 0 
      ? Math.round((mentions.filter(m => m.sentiment === 'positive').length / mentions.length) * 100)
      : 0,
    avgEngagement: mentions.length > 0
      ? Math.round(mentions.reduce((sum, m) => sum + m.engagement_count, 0) / mentions.length)
      : 0,
    trendingTopics: trends.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-emerald-500/5 to-teal-500/5 animate-in fade-in-50 duration-700">
      <div className="container mx-auto p-6 space-y-6">
        {/* Enhanced Header */}
        <div className="backdrop-blur-sm bg-card/80 p-8 rounded-2xl border-2 border-primary/20 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Brand Monitoring 360°
              </h1>
              <p className="text-muted-foreground mt-2 text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                360° brand protection • Real-time alerts • Crisis prevention • Global coverage
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Mentions", value: stats.totalMentions, icon: MessageCircle, color: "from-emerald-500 to-teal-500" },
            { label: "Brand Sentiment", value: `${stats.avgSentiment}%`, icon: TrendingUp, color: "from-teal-500 to-cyan-500" },
            { label: "Avg. Engagement", value: stats.avgEngagement, icon: Target, color: "from-cyan-500 to-blue-500" },
            { label: "Trending Topics", value: stats.trendingTopics, icon: BarChart3, color: "from-blue-500 to-indigo-500" }
          ].map((stat, idx) => (
            <Card key={idx} className="backdrop-blur-sm bg-card/95 border-2 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardHeader className="pb-2">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
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
                      <div className="flex items-center justify-between">
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
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View Post
                            </a>
                          )}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedMention(mention)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Mention Details</DialogTitle>
                              <DialogDescription>
                                Complete information about this brand mention
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[70vh]">
                              <div className="space-y-6 pr-4">
                                <div className="flex items-center gap-4">
                                  <MessageCircle className={`h-8 w-8 ${getPlatformColor(mention.platform)}`} />
                                  <div className="flex-1">
                                    <h3 className="font-semibold">{mention.author_name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {mention.platform}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs capitalize">
                                        {mention.mention_type}
                                      </Badge>
                                      {mention.sentiment && (
                                        <Badge className={`text-xs ${getSentimentColor(mention.sentiment)}`}>
                                          {mention.sentiment}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                <div>
                                  <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                                    <MessageCircle className="h-4 w-4" />
                                    Content
                                  </Label>
                                  <p className="text-sm bg-muted p-4 rounded-lg">
                                    {mention.content}
                                  </p>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                                      <Calendar className="h-3 w-3" />
                                      Mentioned At
                                    </Label>
                                    <p className="font-medium">
                                      {format(new Date(mention.mentioned_at), "PPpp")}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground flex items-center gap-2 mb-2">
                                      <ThumbsUp className="h-3 w-3" />
                                      Engagement
                                    </Label>
                                    <p className="font-medium">
                                      {mention.engagement_count.toLocaleString()} interactions
                                    </p>
                                  </div>
                                </div>

                                {mention.post_url && (
                                  <>
                                    <Separator />
                                    <div>
                                      <Label className="text-muted-foreground mb-2 block">Original Post</Label>
                                      <Button 
                                        variant="outline" 
                                        className="w-full"
                                        onClick={() => window.open(mention.post_url!, '_blank')}
                                      >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Original Post on {mention.platform}
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
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
    </div>
  );
}
