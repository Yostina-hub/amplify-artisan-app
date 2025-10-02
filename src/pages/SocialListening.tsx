import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, TrendingUp, MessageCircle, Hash, Search, X, BarChart3, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Keyword {
  id: string;
  keyword: string;
  is_active: boolean;
  is_competitor?: boolean;
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

const SENTIMENT_COLORS = {
  positive: "#22c55e",
  negative: "#ef4444",
  neutral: "#94a3b8",
};

export default function SocialListening() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [isCompetitor, setIsCompetitor] = useState(false);
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
        is_active: true,
        is_competitor: isCompetitor
      });

      if (error) throw error;

      toast.success(`${isCompetitor ? 'Competitor' : 'Keyword'} added successfully`);
      setNewKeyword("");
      setIsCompetitor(false);
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

  // Calculate sentiment distribution
  const sentimentData = [
    { name: "Positive", value: mentions.filter(m => m.sentiment === "positive").length, color: SENTIMENT_COLORS.positive },
    { name: "Negative", value: mentions.filter(m => m.sentiment === "negative").length, color: SENTIMENT_COLORS.negative },
    { name: "Neutral", value: mentions.filter(m => !m.sentiment || m.sentiment === "neutral").length, color: SENTIMENT_COLORS.neutral },
  ].filter(d => d.value > 0);

  // Calculate mention volume over time (last 7 days)
  const volumeData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mentions: mentions.filter(m => m.mentioned_at.startsWith(dateStr)).length
    };
  });

  // Top platforms by mention count
  const platformData = mentions.reduce((acc, m) => {
    acc[m.platform] = (acc[m.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const platformChartData = Object.entries(platformData)
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalMentions = mentions.length;
  const avgEngagement = mentions.length > 0 
    ? Math.round(mentions.reduce((sum, m) => sum + m.engagement_count, 0) / mentions.length)
    : 0;
  const sentimentScore = mentions.length > 0
    ? Math.round((mentions.filter(m => m.sentiment === "positive").length / mentions.length) * 100)
    : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Listening</h1>
          <p className="text-muted-foreground mt-1">
            Uncover trends and actionable insights from social conversations
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent">
              <Plus className="h-4 w-4 mr-2" />
              Track Keyword
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Keyword to Track</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Enter keyword, brand name, or hashtag..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
              />
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="competitor" 
                  checked={isCompetitor}
                  onCheckedChange={(checked) => setIsCompetitor(checked as boolean)}
                />
                <Label htmlFor="competitor" className="text-sm">
                  Track as competitor
                </Label>
              </div>
              <Button onClick={handleAddKeyword} className="w-full">
                Add Keyword
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Insights Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Mentions</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMentions}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all platforms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagement}</div>
            <p className="text-xs text-muted-foreground mt-1">Per mention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sentiment Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sentimentScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Positive sentiment</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">
            <BarChart3 className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
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

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {sentimentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No sentiment data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mention Volume (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="mentions" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Top Platforms by Mentions</CardTitle>
              </CardHeader>
              <CardContent>
                {platformChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={platformChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No platform data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mentions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Mentions</CardTitle>
            </CardHeader>
            <CardContent>
              {mentions.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No mentions found. Add keywords to start tracking conversations.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mentions.map((mention) => (
                    <div
                      key={mention.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
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
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No keywords yet. Start tracking brands, hashtags, or competitors.
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Keyword
                  </Button>
                </div>
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
                        {keyword.is_competitor && (
                          <Badge variant="outline" className="bg-accent/10">
                            Competitor
                          </Badge>
                        )}
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
