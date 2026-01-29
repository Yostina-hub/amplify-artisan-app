import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Loader2, TrendingUp, Eye, FileText, MessageSquare, Share2, Heart, Zap, 
  BarChart3, RefreshCw, Sparkles, Brain, Clock, Download, Database, Calendar 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PredictiveInsights } from "@/components/crm/PredictiveInsights";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHelp } from "@/components/PageHelp";
import { pageHelpContent } from "@/lib/pageHelpContent";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Analytics() {
  const { user } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30days");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");

  // Profile query
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Social Analytics Data
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ["analytics-posts", user?.id, platformFilter],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      let query = supabase
        .from("social_media_posts")
        .select("*")
        .eq("company_id", profile.company_id);

      if (platformFilter !== "all") {
        query = query.contains("platforms", [platformFilter]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  // AI Analytics Data
  const { data: aiContent } = useQuery({
    queryKey: ['ai-content-analytics', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_generated_content')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: sentimentData } = useQuery({
    queryKey: ['sentiment-analytics', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sentiment_analysis')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('analyzed_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: workflows } = useQuery({
    queryKey: ['workflow-analytics', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('company_id', profile?.company_id);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: executions } = useQuery({
    queryKey: ['execution-analytics', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: insights } = useQuery({
    queryKey: ['ai-insights-crm', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { 
          insightType: 'crm',
          userId: user?.id,
          companyId: profile?.company_id
        }
      });
      if (error) throw error;
      return data?.insights || [];
    },
    enabled: !!profile?.company_id,
  });

  // Custom Modules Data
  const { data: modules } = useQuery({
    queryKey: ["custom_modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_modules")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: moduleData } = useQuery({
    queryKey: ["custom_module_data", selectedModuleId, dateRange],
    queryFn: async () => {
      if (!selectedModuleId) return [];
      const daysAgo = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : dateRange === "90days" ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from("custom_module_data")
        .select("*")
        .eq("module_id", selectedModuleId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedModuleId,
  });

  const { data: fields } = useQuery({
    queryKey: ["custom_module_fields", selectedModuleId],
    queryFn: async () => {
      if (!selectedModuleId) return [];
      const { data, error } = await supabase
        .from("custom_module_fields")
        .select("*")
        .eq("module_id", selectedModuleId)
        .order("field_order");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedModuleId,
  });

  const syncAllPlatforms = async () => {
    setSyncing(true);
    const platforms = ['telegram', 'facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'];
    
    for (const platform of platforms) {
      try {
        await supabase.functions.invoke('sync-social-metrics', {
          body: { platform }
        });
      } catch (error) {
        console.error(`Error syncing ${platform}:`, error);
      }
    }
    
    toast.success("All platforms synced successfully!");
    refetchPosts();
    setSyncing(false);
  };

  // Social metrics calculations
  const filteredPosts = posts || [];
  const totalPosts = filteredPosts.length;
  const publishedPosts = filteredPosts.filter(p => p.status === "published").length;
  const scheduledPosts = filteredPosts.filter(p => p.status === "scheduled").length;
  const draftPosts = filteredPosts.filter(p => p.status === "draft").length;
  const totalViews = filteredPosts.reduce((sum, post) => sum + (post.views || 0), 0);
  const totalLikes = filteredPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
  const totalShares = filteredPosts.reduce((sum, post) => sum + (post.shares || 0), 0);
  const totalClicks = filteredPosts.reduce((sum, post) => sum + (post.clicks || 0), 0);
  const totalEngagement = totalLikes + totalShares + totalClicks;
  const avgEngagementRate = publishedPosts
    ? (filteredPosts.filter(p => p.status === "published").reduce((sum, post) => sum + (post.engagement_rate || 0), 0) / publishedPosts).toFixed(1)
    : "0";

  // AI metrics calculations
  const totalAIContent = aiContent?.length || 0;
  const publishedAIContent = aiContent?.filter(c => c.status === 'published').length || 0;
  const avgSentimentScore = sentimentData?.reduce((acc, s) => acc + s.sentiment_score, 0) / (sentimentData?.length || 1) || 0;
  const positiveRate = sentimentData?.filter(s => s.sentiment === 'positive').length / (sentimentData?.length || 1) * 100 || 0;
  const automationSuccessRate = executions?.filter(e => e.status === 'completed').length / (executions?.length || 1) * 100 || 0;
  const totalAutomationTime = executions?.reduce((acc, e) => acc + (e.execution_time_ms || 0), 0) || 0;
  const avgExecutionTime = totalAutomationTime / (executions?.length || 1);

  // Platform distribution for AI content
  const platformData = Object.entries(
    aiContent?.reduce((acc: any, c) => {
      acc[c.platform] = (acc[c.platform] || 0) + 1;
      return acc;
    }, {}) || {}
  ).map(([name, value]) => ({ name, value }));

  // Sentiment trend
  const sentimentTrend = sentimentData?.slice(0, 30).reverse().map((s, i) => ({
    index: i + 1,
    score: Number(s.sentiment_score.toFixed(2)),
    date: new Date(s.analyzed_at).toLocaleDateString(),
  })) || [];

  // Workflow performance
  const workflowPerformance = workflows?.map(w => ({
    name: w.name,
    executions: w.execution_count || 0,
    success: w.success_count || 0,
    successRate: w.execution_count ? (w.success_count / w.execution_count * 100).toFixed(1) : 0,
  })) || [];

  // Module time series
  const timeSeriesData = moduleData?.reduce((acc: any[], record) => {
    const date = new Date(record.created_at).toLocaleDateString();
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []) || [];

  const selectedModule = modules?.find(m => m.id === selectedModuleId);

  const exportModuleToCSV = () => {
    if (!moduleData || !fields) return;
    const headers = fields.map(f => f.display_name).join(",");
    const rows = moduleData.map(record => 
      fields.map(f => {
        const value = record.data[f.field_name];
        if (typeof value === "object") return JSON.stringify(value);
        return value || "";
      }).join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedModule?.name}_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Data exported successfully");
  };

  if (postsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in-50 duration-500">
      <PageHelp
        title={pageHelpContent.analytics.title}
        description={pageHelpContent.analytics.description}
        features={pageHelpContent.analytics.features}
        tips={pageHelpContent.analytics.tips}
      />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Analytics Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights across all your channels and AI operations
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="365days">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={syncAllPlatforms} disabled={syncing} size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync All'}
          </Button>
        </div>
      </div>

      {/* AI Insights */}
      <PredictiveInsights insights={insights || []} title="AI-Powered Insights" />

      <Tabs defaultValue="social" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="social">Social Analytics</TabsTrigger>
          <TabsTrigger value="ai">AI Analytics</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="modules">Custom Modules</TabsTrigger>
        </TabsList>

        {/* Social Analytics Tab */}
        <TabsContent value="social" className="space-y-6">
          <div className="flex items-center gap-3">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {totalViews.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Content impressions
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagements</CardTitle>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  {totalEngagement.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalLikes} likes • {totalShares} shares
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {avgEngagementRate}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Average across all posts</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  {totalPosts}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {publishedPosts} live • {scheduledPosts} scheduled
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Content Pipeline */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Content Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { label: "Published", value: publishedPosts, color: "from-green-500 to-emerald-500", textColor: "text-green-600" },
                  { label: "Scheduled", value: scheduledPosts, color: "from-blue-500 to-cyan-500", textColor: "text-blue-600" },
                  { label: "Drafts", value: draftPosts, color: "from-orange-500 to-amber-500", textColor: "text-orange-600" },
                ].map(item => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className={`bg-gradient-to-r ${item.color}`}>{item.label}</Badge>
                      </div>
                      <div className={`text-xl font-bold ${item.textColor}`}>{item.value}</div>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                        style={{ width: `${totalPosts ? (item.value / totalPosts) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Posts */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Top Performing Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No posts yet. Start creating content to see analytics.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPosts
                    .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
                    .slice(0, 5)
                    .map((post) => (
                      <div key={post.id} className="p-4 border rounded-lg space-y-3 hover:shadow-md transition-all duration-300 hover:border-primary/40">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2 mb-1">{post.content}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs text-muted-foreground">
                                {new Date(post.created_at).toLocaleDateString()}
                              </p>
                              {post.platforms?.map((p: string) => (
                                <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                              ))}
                            </div>
                          </div>
                          <Badge variant={post.status === "published" ? "default" : "secondary"}>
                            {post.status}
                          </Badge>
                        </div>
                        {post.status === "published" && (
                          <div className="grid grid-cols-4 gap-3 pt-3 border-t">
                            <div className="text-center">
                              <Eye className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                              <p className="text-xs font-semibold">{(post.views || 0).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">views</p>
                            </div>
                            <div className="text-center">
                              <Heart className="h-4 w-4 text-pink-500 mx-auto mb-1" />
                              <p className="text-xs font-semibold">{(post.likes || 0).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">likes</p>
                            </div>
                            <div className="text-center">
                              <Share2 className="h-4 w-4 text-green-500 mx-auto mb-1" />
                              <p className="text-xs font-semibold">{(post.shares || 0).toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">shares</p>
                            </div>
                            <div className="text-center">
                              <Zap className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                              <p className="text-xs font-semibold">{(post.engagement_rate || 0).toFixed(1)}%</p>
                              <p className="text-xs text-muted-foreground">engagement</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Analytics Tab */}
        <TabsContent value="ai" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">AI Content Created</CardTitle>
                <Sparkles className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAIContent}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {publishedAIContent} published ({totalAIContent ? ((publishedAIContent / totalAIContent) * 100).toFixed(1) : 0}%)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
                <Brain className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgSentimentScore.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">{positiveRate.toFixed(1)}% positive mentions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Automation Success</CardTitle>
                <Zap className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{automationSuccessRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">{executions?.length || 0} total executions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(avgExecutionTime)}ms</div>
                <p className="text-xs text-muted-foreground mt-1">{(totalAutomationTime / 1000).toFixed(1)}s total saved</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Content by Platform</CardTitle>
                <CardDescription>Distribution of AI-generated content</CardDescription>
              </CardHeader>
              <CardContent>
                {platformData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={platformData} cx="50%" cy="50%" labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80} fill="#8884d8" dataKey="value">
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No AI content data available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sentiment Score Trend</CardTitle>
                <CardDescription>Track sentiment changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                {sentimentTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={sentimentTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" />
                      <YAxis domain={[-1, 1]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No sentiment data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent AI Content</CardTitle>
              <CardDescription>Latest generated posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiContent?.slice(0, 5).map((content) => (
                  <div key={content.id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{content.platform}</Badge>
                        <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>{content.status}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(content.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">{content.generated_text}</p>
                  </div>
                )) || <p className="text-muted-foreground text-center py-4">No AI content yet</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Performance</CardTitle>
              <CardDescription>Success rates by workflow</CardDescription>
            </CardHeader>
            <CardContent>
              {workflowPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workflowPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success" fill="hsl(var(--chart-2))" name="Successful" />
                    <Bar dataKey="executions" fill="hsl(var(--chart-1))" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No workflow data available</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Workflows</CardTitle>
                <CardDescription>Currently running automations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workflows?.filter(w => w.is_active).map((workflow) => (
                    <div key={workflow.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{workflow.name}</h4>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{workflow.execution_count || 0} runs</span>
                        <span>{workflow.success_count || 0} successful</span>
                        <span className="text-green-600">
                          {workflow.execution_count ? ((workflow.success_count / workflow.execution_count) * 100).toFixed(0) : 0}% success
                        </span>
                      </div>
                    </div>
                  )) || <p className="text-muted-foreground text-center py-4">No active workflows</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Executions</CardTitle>
                <CardDescription>Latest automation runs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {executions?.slice(0, 5).map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={execution.status === 'completed' ? 'default' : execution.status === 'failed' ? 'destructive' : 'secondary'}>
                          {execution.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {execution.execution_time_ms}ms
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(execution.created_at).toLocaleString()}
                      </span>
                    </div>
                  )) || <p className="text-muted-foreground text-center py-4">No recent executions</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Custom Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Select Module</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a module to analyze" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules?.map((module) => (
                      <SelectItem key={module.id} value={module.id}>{module.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedModuleId && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Export Data</CardTitle>
                  <Button onClick={exportModuleToCSV} size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {moduleData?.length || 0} records in selected module
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Total Modules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{modules?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{moduleData?.length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Active Workflows
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflows?.filter(w => w.is_active).length || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Total Executions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{executions?.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          {selectedModuleId && timeSeriesData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedModule?.display_name} - Records Over Time</CardTitle>
                <CardDescription>Track record creation trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {selectedModuleId && moduleData && moduleData.length > 0 && fields && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Records</CardTitle>
                <CardDescription>Latest {moduleData?.length || 0} records</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {fields?.slice(0, 4).map((field) => (
                        <TableHead key={field.id}>{field.display_name}</TableHead>
                      ))}
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {moduleData.slice(0, 10).map((record) => (
                      <TableRow key={record.id}>
                        {fields?.slice(0, 4).map((field) => (
                          <TableCell key={field.id}>
                            {field.field_type === "boolean" 
                              ? (record.data[field.field_name] ? "Yes" : "No")
                              : record.data[field.field_name] || "-"}
                          </TableCell>
                        ))}
                        <TableCell>{new Date(record.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}