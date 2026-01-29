import { useState, useEffect } from "react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, TrendingUp, Sparkles, BarChart3, Smile, Frown, Meh, MessageCircle, Hash, Search, Plus, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PageHelp } from "@/components/PageHelp";
import { pageHelpContent } from "@/lib/pageHelpContent";

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
  post_url?: string | null;
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

export default function SocialIntelligence() {
  const [activeTab, setActiveTab] = useState("overview");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [isCompetitor, setIsCompetitor] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch sentiment data
  const { data: sentimentData, isLoading: sentimentLoading } = useQuery({
    queryKey: ['sentiment-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sentiment_analysis')
        .select('*')
        .order('analyzed_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    fetchListeningData();
  }, []);

  const fetchListeningData = async () => {
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

      toast.success("Keyword added successfully");
      setNewKeyword("");
      setIsCompetitor(false);
      setIsAddDialogOpen(false);
      fetchListeningData();
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
      fetchListeningData();
    } catch (error: any) {
      toast.error("Failed to update keyword: " + error.message);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    try {
      const { error } = await supabase.from("tracked_keywords").delete().eq("id", id);
      if (error) throw error;
      toast.success("Keyword deleted");
      fetchListeningData();
    } catch (error: any) {
      toast.error("Failed to delete keyword: " + error.message);
    }
  };

  // Calculate sentiment statistics from sentiment_analysis table
  const stats = sentimentData?.reduce(
    (acc, item) => {
      acc[item.sentiment]++;
      acc.total++;
      return acc;
    },
    { positive: 0, negative: 0, neutral: 0, mixed: 0, total: 0 }
  );

  const total = stats?.total || 0;

  // Listening stats
  const totalMentions = mentions.length;
  const avgEngagement = mentions.length > 0 
    ? Math.round(mentions.reduce((sum, m) => sum + m.engagement_count, 0) / mentions.length)
    : 0;

  // Calculate sentiment distribution for chart
  const sentimentChartData = [
    { name: "Positive", value: stats?.positive || 0, color: "hsl(var(--chart-2))" },
    { name: "Negative", value: stats?.negative || 0, color: "hsl(var(--destructive))" },
    { name: "Neutral", value: stats?.neutral || 0, color: "hsl(var(--muted-foreground))" },
  ].filter(d => d.value > 0);

  // Mention volume over time (last 7 days)
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

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="h-5 w-5 text-green-500" />;
      case 'negative': return <Frown className="h-5 w-5 text-red-500" />;
      default: return <Meh className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSentimentColor = (sentiment: string | null) => {
    if (!sentiment) return "bg-muted text-muted-foreground";
    if (sentiment === "positive") return "text-green-600 bg-green-50 dark:bg-green-950";
    if (sentiment === "negative") return "text-red-600 bg-red-50 dark:bg-red-950";
    return "text-muted-foreground bg-muted";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 animate-in fade-in-50 duration-700">
      <div className="container mx-auto p-6 space-y-6">
        <PageHelp
          title={pageHelpContent.socialIntelligence.title}
          description={pageHelpContent.socialIntelligence.description}
          features={pageHelpContent.socialIntelligence.features}
          tips={pageHelpContent.socialIntelligence.tips}
        />

        {/* Header */}
        <div className="backdrop-blur-sm bg-card/80 p-8 rounded-2xl border-2 border-primary/20 shadow-2xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Brain className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Social Intelligence
                </h1>
                <p className="text-muted-foreground mt-2 text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI-powered sentiment • Brand monitoring • Real-time insights
                </p>
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-accent">
                  <Plus className="h-4 w-4 mr-2" />
                  Track Keyword
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
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
                    <Label htmlFor="competitor" className="text-sm">Track as competitor</Label>
                  </div>
                  <Button onClick={handleAddKeyword} className="w-full">Add Keyword</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="backdrop-blur-sm bg-card/95 border-2 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
              <div className="p-2 rounded-lg bg-green-500/10">
                <Smile className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.positive || 0}</div>
              <Progress value={total > 0 ? (stats!.positive / total) * 100 : 0} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {total > 0 ? ((stats!.positive / total) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-card/95 border-2 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Mentions</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalMentions}</div>
              <p className="text-xs text-muted-foreground mt-2">Across all platforms</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-card/95 border-2 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{avgEngagement}</div>
              <p className="text-xs text-muted-foreground mt-2">Per mention</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-card/95 border-2 hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Trending Topics</CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/10">
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{trends.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Active topics</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs - Reduced from 5 to 4 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
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

          {/* Overview Tab - Now includes sentiment details */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {sentimentChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={sentimentChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sentimentChartData.map((entry, index) => (
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

            {/* Recent Sentiment Analysis - merged from Sentiment tab */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sentiment Analysis</CardTitle>
                <CardDescription>Latest AI-analyzed content from your social channels</CardDescription>
              </CardHeader>
              <CardContent>
                {sentimentLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading analysis...</div>
                ) : sentimentData && sentimentData.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {sentimentData.slice(0, 10).map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getSentimentIcon(item.sentiment)}
                              <Badge variant="outline" className={getSentimentColor(item.sentiment)}>
                                {item.sentiment}
                              </Badge>
                              <Badge variant="secondary">{item.platform}</Badge>
                            </div>
                            <p className="text-sm mb-2 line-clamp-2">{item.content_text}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.analyzed_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No sentiment data yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mentions Tab */}
          <TabsContent value="mentions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Mentions</CardTitle>
                <CardDescription>Mentions of your tracked keywords across platforms</CardDescription>
              </CardHeader>
              <CardContent>
                {mentions.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No mentions found. Add keywords to start tracking.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mentions.map((mention) => (
                      <div key={mention.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{mention.author_name}</span>
                            <Badge variant="outline" className="text-xs">{mention.platform}</Badge>
                            {mention.sentiment && (
                              <Badge className={getSentimentColor(mention.sentiment)}>{mention.sentiment}</Badge>
                            )}
                          </div>
                          <p className="text-sm">{mention.content}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{new Date(mention.mentioned_at).toLocaleDateString()}</span>
                            <span>{mention.engagement_count} engagements</span>
                            {mention.post_url && (
                              <a href={mention.post_url} target="_blank" rel="noopener noreferrer" 
                                 className="text-primary hover:underline flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> View
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tracked Keywords</CardTitle>
                <CardDescription>Keywords and hashtags you're monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                {keywords.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No keywords yet. Start tracking brands or hashtags.
                    </p>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Keyword
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {keywords.map((keyword) => (
                      <div key={keyword.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{keyword.keyword}</span>
                          <Badge variant={keyword.is_active ? "default" : "secondary"}>
                            {keyword.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleToggleKeyword(keyword.id, keyword.is_active)}>
                            {keyword.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteKeyword(keyword.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trending Topics</CardTitle>
                <CardDescription>Current trending topics in your industry</CardDescription>
              </CardHeader>
              <CardContent>
                {trends.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No trending topics detected yet</p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {trends.map((trend) => (
                      <div key={trend.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              {trend.hashtag ? `#${trend.hashtag}` : trend.topic}
                              {trend.growth_rate > 0 && (
                                <Badge variant="default" className="bg-green-500">
                                  +{trend.growth_rate}%
                                </Badge>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground">{trend.platform}</p>
                          </div>
                          <Badge variant="outline">{trend.volume.toLocaleString()} mentions</Badge>
                        </div>
                        {trend.category && (
                          <Badge variant="secondary" className="text-xs">{trend.category}</Badge>
                        )}
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
