import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, TrendingUp, Users, Target, Bell, 
  FileText, Download, RefreshCw, Layers, AlertTriangle,
  CheckCircle2, Clock, Lightbulb, ChevronRight, Activity
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { toast } from "sonner";
import { AnalyticsKPICard } from "@/components/analytics/AnalyticsKPICard";
import { AnalyticsRecommendations } from "@/components/analytics/AnalyticsRecommendations";
import { AnalyticsAlerts } from "@/components/analytics/AnalyticsAlerts";
import { AnalyticsSegments } from "@/components/analytics/AnalyticsSegments";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("30days");
  const [refreshing, setRefreshing] = useState(false);

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

  const { data: kpiDefinitions } = useQuery({
    queryKey: ['analytics-kpi-definitions', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_kpi_definitions')
        .select('*')
        .or(`company_id.is.null,company_id.eq.${profile?.company_id}`)
        .eq('is_active', true)
        .order('category');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: kpiValues, refetch: refetchKPIs } = useQuery({
    queryKey: ['analytics-kpi-values', profile?.company_id, dateRange],
    queryFn: async () => {
      const daysAgo = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : dateRange === "90days" ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('analytics_kpi_values')
        .select('*, kpi:analytics_kpi_definitions(*)')
        .eq('company_id', profile?.company_id)
        .gte('period_start', startDate.toISOString().split('T')[0])
        .order('period_start', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['analytics-recommendations', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_recommendations')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('status', 'pending')
        .order('priority', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: alerts } = useQuery({
    queryKey: ['analytics-alerts', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_alerts')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: segments } = useQuery({
    queryKey: ['analytics-segments', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_segments')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('is_active', true)
        .order('member_count', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  // Aggregate KPI data for display
  const aggregatedKPIs = kpiDefinitions?.map(kpi => {
    const values = kpiValues?.filter(v => v.kpi_id === kpi.id) || [];
    const latestValue = values[0]?.value || 0;
    const previousValue = values[1]?.value || values[0]?.previous_value || 0;
    const changePercent = previousValue > 0 ? ((latestValue - previousValue) / previousValue * 100).toFixed(1) : '0';
    
    return {
      ...kpi,
      currentValue: latestValue,
      previousValue,
      changePercent: parseFloat(changePercent),
      trend: parseFloat(changePercent) >= 0 ? 'up' : 'down' as const,
      sparklineData: values.slice(0, 7).reverse().map(v => ({ value: v.value }))
    };
  }).slice(0, 8) || [];

  // Mock trend data for charts
  const trendData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: Math.floor(Math.random() * 500) + 200,
    engagement: Math.floor(Math.random() * 1000) + 500,
    leads: Math.floor(Math.random() * 100) + 20,
  }));

  const categoryData = [
    { name: 'Users', value: 35 },
    { name: 'Sales', value: 25 },
    { name: 'Marketing', value: 20 },
    { name: 'Support', value: 15 },
    { name: 'Social', value: 5 },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchKPIs();
    toast.success("Dashboard refreshed");
    setRefreshing(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Unified business intelligence and decision support
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/analytics/reports')}>
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {aggregatedKPIs.length > 0 ? (
          aggregatedKPIs.map((kpi) => (
            <AnalyticsKPICard
              key={kpi.id}
              title={kpi.name}
              value={kpi.currentValue}
              changePercent={kpi.changePercent}
              trend={kpi.trend}
              category={kpi.category}
              format={kpi.display_format}
              unit={kpi.unit}
            />
          ))
        ) : (
          <>
        <AnalyticsKPICard title="Active Users" value={1234} changePercent={12.5} trend="up" category="users" />
        <AnalyticsKPICard title="Total Leads" value={567} changePercent={8.2} trend="up" category="sales" />
        <AnalyticsKPICard title="Engagement Rate" value={4.8} changePercent={-2.1} trend="down" category="social" format="percentage" unit="%" />
        <AnalyticsKPICard title="Support Tickets" value={89} changePercent={15.3} trend="up" category="support" />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Trend Chart */}
        <Card className="lg:col-span-2 border-2 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Performance Trends
              </CardTitle>
              <CardDescription>Key metrics over time</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">Users</Badge>
              <Badge variant="secondary">Engagement</Badge>
              <Badge variant="default">Leads</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Area type="monotone" dataKey="users" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="engagement" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorEngagement)" />
                <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-2 hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              KPI Categories
            </CardTitle>
            <CardDescription>Distribution by area</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {categoryData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations and Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsRecommendations recommendations={recommendations || []} />
        <AnalyticsAlerts alerts={alerts || []} />
      </div>

      {/* Segments */}
      <AnalyticsSegments segments={segments || []} />

      {/* Quick Actions */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Explore More Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Access detailed reports, manage segments, configure alerts, and customize dashboards
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/analytics/segments')}>
                <Target className="h-4 w-4 mr-2" />
                Segments
              </Button>
              <Button variant="outline" onClick={() => navigate('/analytics/alerts')}>
                <Bell className="h-4 w-4 mr-2" />
                Alerts
              </Button>
              <Button onClick={() => navigate('/analytics/dashboards')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboards
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
