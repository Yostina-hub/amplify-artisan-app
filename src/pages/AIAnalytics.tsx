import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Sparkles, Brain, Zap, Target, DollarSign, Clock, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PredictiveInsights } from '@/components/crm/PredictiveInsights';

export default function AIAnalytics() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();
      return data;
    },
  });

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
      const { data: { user } } = await supabase.auth.getUser();
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

  // Calculate metrics
  const totalAIContent = aiContent?.length || 0;
  const publishedContent = aiContent?.filter(c => c.status === 'published').length || 0;
  const avgSentimentScore = sentimentData?.reduce((acc, s) => acc + s.sentiment_score, 0) / (sentimentData?.length || 1) || 0;
  const positiveRate = sentimentData?.filter(s => s.sentiment === 'positive').length / (sentimentData?.length || 1) * 100 || 0;
  const automationSuccessRate = executions?.filter(e => e.status === 'completed').length / (executions?.length || 1) * 100 || 0;
  const totalAutomationTime = executions?.reduce((acc, e) => acc + (e.execution_time_ms || 0), 0) || 0;
  const avgExecutionTime = totalAutomationTime / (executions?.length || 1);

  // Content by platform
  const platformData = Object.entries(
    aiContent?.reduce((acc: any, c) => {
      acc[c.platform] = (acc[c.platform] || 0) + 1;
      return acc;
    }, {}) || {}
  ).map(([name, value]) => ({ name, value }));

  // Sentiment over time
  const sentimentTrend = sentimentData?.slice(0, 30).reverse().map((s, i) => ({
    index: i + 1,
    score: Number(s.sentiment_score.toFixed(2)),
    date: new Date(s.analyzed_at).toLocaleDateString(),
  })) || [];

  // Content status distribution
  const statusData = Object.entries(
    aiContent?.reduce((acc: any, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {}) || {}
  ).map(([name, value]) => ({ name, value }));

  // Workflow performance
  const workflowPerformance = workflows?.map(w => ({
    name: w.name,
    executions: w.execution_count || 0,
    success: w.success_count || 0,
    successRate: w.execution_count ? (w.success_count / w.execution_count * 100).toFixed(1) : 0,
  })) || [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              AI Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive insights into your AI-powered social media performance
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">AI Content Created</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAIContent}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {publishedContent} published ({totalAIContent ? ((publishedContent / totalAIContent) * 100).toFixed(1) : 0}%)
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
              <p className="text-xs text-muted-foreground mt-1">
                {positiveRate.toFixed(1)}% positive mentions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Automation Success</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{automationSuccessRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {executions?.length || 0} total executions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(avgExecutionTime)}ms</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(totalAutomationTime / 1000).toFixed(1)}s total saved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <PredictiveInsights insights={insights || []} title="AI-Powered Insights" />

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Content Analytics</TabsTrigger>
            <TabsTrigger value="sentiment">Sentiment Trends</TabsTrigger>
            <TabsTrigger value="automation">Automation Performance</TabsTrigger>
            <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          </TabsList>

          {/* Content Analytics */}
          <TabsContent value="content" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Content by Platform</CardTitle>
                  <CardDescription>Distribution of AI-generated content</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={platformData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Status</CardTitle>
                  <CardDescription>Current state of generated content</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
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
                          <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
                            {content.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(content.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2">{content.generated_text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sentiment Trends */}
          <TabsContent value="sentiment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Score Trend</CardTitle>
                <CardDescription>Track sentiment changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={sentimentTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" label={{ value: 'Analysis #', position: 'insideBottom', offset: -5 }} />
                    <YAxis domain={[-1, 1]} label={{ value: 'Sentiment Score', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Positive Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {sentimentData?.filter(s => s.sentiment === 'positive').length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {positiveRate.toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Neutral Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-600">
                    {sentimentData?.filter(s => s.sentiment === 'neutral').length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((sentimentData?.filter(s => s.sentiment === 'neutral').length || 0) / (sentimentData?.length || 1) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Negative Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {sentimentData?.filter(s => s.sentiment === 'negative').length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((sentimentData?.filter(s => s.sentiment === 'negative').length || 0) / (sentimentData?.length || 1) * 100).toFixed(1)}% of total
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Automation Performance */}
          <TabsContent value="automation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Performance</CardTitle>
                <CardDescription>Success rates by workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workflowPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success" fill="#10b981" name="Successful" />
                    <Bar dataKey="executions" fill="#3b82f6" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
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
                    ))}
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
                          <Badge variant={execution.status === 'completed' ? 'default' : 'destructive'}>
                            {execution.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {execution.execution_time_ms}ms
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(execution.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ROI Analysis */}
          <TabsContent value="roi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Time & Cost Savings</CardTitle>
                <CardDescription>Estimated value from AI automation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Time Saved</h3>
                    </div>
                    <div className="text-3xl font-bold">{(totalAIContent * 15 / 60).toFixed(1)} hrs</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ~15 min per post saved
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">Cost Savings</h3>
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      ${(totalAIContent * 15 / 60 * 50).toFixed(0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      At $50/hr labor rate
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Efficiency Gain</h3>
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      {automationSuccessRate.toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Automation success rate
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-muted/50">
                  <h3 className="font-semibold mb-3">AI Impact Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total AI-generated content:</span>
                      <span className="font-semibold">{totalAIContent} posts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Content published:</span>
                      <span className="font-semibold">{publishedContent} posts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Automation workflows:</span>
                      <span className="font-semibold">{workflows?.filter(w => w.is_active).length || 0} active</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average sentiment:</span>
                      <span className="font-semibold">{avgSentimentScore.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-semibold">Estimated Monthly Savings:</span>
                      <span className="font-semibold text-green-600">
                        ${((totalAIContent * 15 / 60 * 50) * 0.25).toFixed(0)}/mo
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}
