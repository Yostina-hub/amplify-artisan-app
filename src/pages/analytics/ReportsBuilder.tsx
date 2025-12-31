import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Clock, 
  Download, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Calendar,
  Mail,
  Share2,
  Eye,
  BarChart3,
  PieChart,
  LineChart,
  Table as TableIcon
} from "lucide-react";
import { format } from "date-fns";

export default function ReportsBuilder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newReportOpen, setNewReportOpen] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    type: 'table',
    schedule: 'manual'
  });

  // Fetch user profile for company_id
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch scheduled reports
  const { data: scheduledReports } = useQuery({
    queryKey: ['analytics-scheduled-reports', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('analytics_scheduled_reports')
        .select('*, analytics_dashboards(name)')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id
  });

  // Fetch exports
  const { data: exports } = useQuery({
    queryKey: ['analytics-exports', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('analytics_exports')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id
  });

  // Fetch dashboards for report creation
  const { data: dashboards } = useQuery({
    queryKey: ['analytics-dashboards', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('analytics_dashboards')
        .select('id, name')
        .eq('company_id', profile.company_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id
  });

  const handleToggleSchedule = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('analytics_scheduled_reports')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to update schedule');
      return;
    }
    
    toast.success(`Schedule ${!currentStatus ? 'activated' : 'paused'}`);
    queryClient.invalidateQueries({ queryKey: ['analytics-scheduled-reports'] });
  };

  const handleDeleteSchedule = async (id: string) => {
    const { error } = await supabase
      .from('analytics_scheduled_reports')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to delete schedule');
      return;
    }
    
    toast.success('Schedule deleted');
    queryClient.invalidateQueries({ queryKey: ['analytics-scheduled-reports'] });
  };

  const reportTypes = [
    { value: 'table', label: 'Table', icon: TableIcon },
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'line', label: 'Line Chart', icon: LineChart },
    { value: 'pie', label: 'Pie Chart', icon: PieChart },
  ];

  const scheduleOptions = [
    { value: 'manual', label: 'Manual (On Demand)' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/analytics-platform')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Reports Builder</h1>
            <p className="text-muted-foreground">Create, schedule, and export analytics reports</p>
          </div>
        </div>
        <Dialog open={newReportOpen} onOpenChange={setNewReportOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>Configure your report settings and visualization type.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Report Name</Label>
                <Input 
                  placeholder="Q4 Sales Performance" 
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  placeholder="Monthly sales metrics and trends" 
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Visualization Type</Label>
                <div className="grid grid-cols-4 gap-2">
                  {reportTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setNewReport({ ...newReport, type: type.value })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                          newReport.type === type.value 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select 
                  value={newReport.schedule}
                  onValueChange={(value) => setNewReport({ ...newReport, schedule: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewReportOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                toast.success('Report created successfully');
                setNewReportOpen(false);
                setNewReport({ name: '', description: '', type: 'table', schedule: 'manual' });
              }}>
                Create Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="exports">Export History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>Automated reports delivered on a schedule</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledReports && scheduledReports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Dashboard</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledReports.map((report: any) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>{report.analytics_dashboards?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.schedule_cron}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={report.is_active ? 'default' : 'secondary'}>
                            {report.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {report.last_run_at ? format(new Date(report.last_run_at), 'MMM d, h:mm a') : 'Never'}
                        </TableCell>
                        <TableCell>
                          {report.next_run_at ? format(new Date(report.next_run_at), 'MMM d, h:mm a') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleToggleSchedule(report.id, report.is_active)}>
                                {report.is_active ? (
                                  <><Pause className="h-4 w-4 mr-2" /> Pause</>
                                ) : (
                                  <><Play className="h-4 w-4 mr-2" /> Activate</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteSchedule(report.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-1">No scheduled reports</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set up automated reports to be delivered to your team
                  </p>
                  <Button onClick={() => setNewReportOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Scheduled Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export History
              </CardTitle>
              <CardDescription>Previously exported reports and data</CardDescription>
            </CardHeader>
            <CardContent>
              {exports && exports.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exports.map((exp: any) => (
                      <TableRow key={exp.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {exp.file_name || 'Untitled Export'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{exp.export_type.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={exp.status === 'completed' ? 'default' : exp.status === 'failed' ? 'destructive' : 'secondary'}>
                            {exp.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(exp.created_at), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                          {exp.file_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={exp.file_url} download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Download className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-1">No exports yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Export reports from the Analytics Dashboard
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Sales Performance', description: 'Track revenue, deals, and conversion rates', icon: BarChart3 },
              { name: 'Customer Engagement', description: 'Monitor user activity and retention', icon: LineChart },
              { name: 'Marketing ROI', description: 'Campaign performance and attribution', icon: PieChart },
              { name: 'Support Metrics', description: 'Ticket resolution and satisfaction', icon: TableIcon },
              { name: 'Social Analytics', description: 'Social media reach and engagement', icon: Share2 },
              { name: 'Email Performance', description: 'Open rates, clicks, and conversions', icon: Mail },
            ].map((template, index) => {
              const Icon = template.icon;
              return (
                <Card key={index} className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="text-xs">{template.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
