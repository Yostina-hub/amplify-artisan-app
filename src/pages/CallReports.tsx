import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHelp } from "@/components/PageHelp";
import { Phone, Clock, TrendingUp, PhoneCall, Download, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function CallReports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const { data: callLogs } = useQuery({
    queryKey: ["call-logs", searchQuery, dateFilter],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.user.id)
        .single();

      if (!profile?.company_id) return [];

      let query = supabase
        .from("call_logs")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("call_started_at", { ascending: false })
        .limit(100);

      if (searchQuery) {
        query = query.or(`contact_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,agent_name.ilike.%${searchQuery}%`);
      }

      if (dateFilter) {
        query = query.gte("call_started_at", `${dateFilter}T00:00:00`);
        query = query.lte("call_started_at", `${dateFilter}T23:59:59`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["call-stats"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.user.id)
        .single();

      if (!profile?.company_id) return null;

      const { data: logs } = await supabase
        .from("call_logs")
        .select("call_duration_seconds, call_status")
        .eq("company_id", profile.company_id);

      if (!logs) return null;

      const totalCalls = logs.length;
      const completedCalls = logs.filter(l => l.call_status === "completed").length;
      const totalDuration = logs.reduce((sum, l) => sum + (l.call_duration_seconds || 0), 0);
      const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

      return {
        totalCalls,
        completedCalls,
        avgDuration,
        totalDuration,
      };
    },
  });

  const exportToCSV = () => {
    if (!callLogs || callLogs.length === 0) return;

    const headers = ["Date", "Time", "Contact", "Phone", "Agent", "Duration (s)", "Status", "Outcome"];
    const csvData = callLogs.map(log => [
      log.call_started_at ? format(new Date(log.call_started_at), "yyyy-MM-dd") : "",
      log.call_started_at ? format(new Date(log.call_started_at), "HH:mm:ss") : "",
      log.contact_name || "",
      log.phone_number || "",
      log.agent_name || "",
      log.call_duration_seconds || 0,
      log.call_status || "",
      log.call_outcome || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `call_reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      completed: "default",
      failed: "destructive",
      missed: "secondary",
      pending: "outline",
    };
    return colors[status] || "default";
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <PageHelp
        title="Call Reports"
        description="Comprehensive call analytics and activity reports. Track call volumes, durations, outcomes, and agent performance metrics."
        features={[
          "View detailed call logs with timestamps and durations",
          "Filter calls by date, agent, contact, or phone number",
          "Export call data to CSV for external analysis",
          "Monitor call completion rates and average call durations",
          "Track call outcomes and follow-up requirements",
        ]}
        tips={[
          "Use date filters to analyze call patterns over time",
          "Export reports regularly for performance reviews",
          "Monitor average call duration to optimize agent efficiency",
          "Review failed calls to identify technical issues",
        ]}
      />

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background p-8 backdrop-blur-sm border border-primary/10">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary/10 to-accent/5">
              <PhoneCall className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Call Reports
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Analyze call performance and activity metrics
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="relative overflow-hidden animate-slide-up">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/5">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              Total Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {stats?.totalCalls || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success/20 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-success/10 to-accent/5">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {stats?.completedCalls || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalCalls ? Math.round((stats.completedCalls / stats.totalCalls) * 100) : 0}% success rate
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent/10 to-primary/5">
                <Clock className="h-4 w-4 text-accent" />
              </div>
              Avg Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {formatDuration(stats?.avgDuration || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per call</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden animate-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              Total Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {Math.round((stats?.totalDuration || 0) / 60)}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">Talk time</p>
          </CardContent>
        </Card>
      </div>

      {/* Call Logs Table */}
      <Card className="animate-slide-up" style={{ animationDelay: "400ms" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Call History</CardTitle>
              <CardDescription>Recent call activity and details</CardDescription>
            </div>
            <div className="flex gap-3">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />
              <Input
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              <Button onClick={exportToCSV} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {callLogs && callLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callLogs.map((log: any) => (
                  <TableRow key={log.id} className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5">
                    <TableCell>
                      <div className="font-medium">
                        {log.call_started_at ? format(new Date(log.call_started_at), "MMM dd, yyyy") : "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {log.call_started_at ? format(new Date(log.call_started_at), "HH:mm:ss") : ""}
                      </div>
                    </TableCell>
                    <TableCell>{log.contact_name || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{log.phone_number}</TableCell>
                    <TableCell>{log.agent_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatDuration(log.call_duration_seconds || 0)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(log.call_status) as any}>
                        {log.call_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.call_outcome || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <PhoneCall className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No call logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
