import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, TrendingUp, Database, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";
import { PredictiveInsights } from "@/components/crm/PredictiveInsights";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function ReportingDashboard() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("7days");

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

  const { data: workflows } = useQuery({
    queryKey: ["automation_workflows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_workflows")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const { data: executions } = useQuery({
    queryKey: ["automation_executions", dateRange],
    queryFn: async () => {
      const daysAgo = dateRange === "7days" ? 7 : dateRange === "30days" ? 30 : dateRange === "90days" ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from("automation_executions")
        .select("*")
        .gte("executed_at", startDate.toISOString());
      if (error) throw error;
      return data;
    },
  });

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

  const { data: insights } = useQuery({
    queryKey: ['analytics-insights', profile?.company_id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { 
          insightType: 'overview',
          userId: user?.id,
          companyId: profile?.company_id
        }
      });
      if (error) throw error;
      return data?.insights || [];
    },
    enabled: !!profile?.company_id,
  });

  const selectedModule = modules?.find(m => m.id === selectedModuleId);

  // Calculate time series data
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

  // Calculate field distribution for select/boolean fields
  const getFieldDistribution = (fieldName: string, fieldType: string) => {
    if (!moduleData) return [];
    
    const distribution = moduleData.reduce((acc: any, record) => {
      const value = record.data[fieldName];
      const key = fieldType === "boolean" ? (value ? "Yes" : "No") : (value || "N/A");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  };

  // Workflow execution stats
  const workflowStats = executions?.reduce((acc: any, exec) => {
    acc[exec.status] = (acc[exec.status] || 0) + 1;
    return acc;
  }, {});

  const workflowChartData = workflowStats ? Object.entries(workflowStats).map(([name, value]) => ({ name, value })) : [];

  const exportToCSV = () => {
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Insights and reports for your custom modules</p>
        </div>
        {selectedModuleId && (
          <Button onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* AI Insights */}
      <PredictiveInsights insights={insights || []} title="Analytics Insights" />

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
                  <SelectItem key={module.id} value={module.id}>
                    {module.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="365days">Last year</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Overview Stats */}
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
            <div className="text-2xl font-bold">{workflows?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executions?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {selectedModuleId && (
        <>
          {/* Time Series Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedModule?.display_name} - Records Over Time</CardTitle>
              <CardDescription>Track record creation trends</CardDescription>
            </CardHeader>
            <CardContent>
              {timeSeriesData.length > 0 ? (
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
              ) : (
                <p className="text-muted-foreground text-center py-8">No data available for the selected period</p>
              )}
            </CardContent>
          </Card>

          {/* Field Distributions */}
          <div className="grid gap-4 md:grid-cols-2">
            {fields?.filter(f => f.field_type === "select" || f.field_type === "boolean").slice(0, 4).map((field) => {
              const distribution = getFieldDistribution(field.field_name, field.field_type);
              return (
                <Card key={field.id}>
                  <CardHeader>
                    <CardTitle>{field.display_name} Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {distribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={distribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {distribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No data available</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Records</CardTitle>
              <CardDescription>Latest {moduleData?.length || 0} records</CardDescription>
            </CardHeader>
            <CardContent>
              {moduleData && moduleData.length > 0 ? (
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
              ) : (
                <p className="text-muted-foreground text-center py-8">No records found</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Workflow Execution Stats */}
      {workflowChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Workflow Execution Status</CardTitle>
            <CardDescription>Distribution of workflow execution results</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workflowChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
