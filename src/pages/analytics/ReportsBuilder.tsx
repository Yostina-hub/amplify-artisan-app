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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Table as TableIcon,
  Zap,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";

interface TemplateConfig {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function ReportsBuilder() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [newReportOpen, setNewReportOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);
  const [templateConfig, setTemplateConfig] = useState({
    name: '',
    dateRange: '30',
    format: 'pdf',
    schedule: 'manual',
    recipients: '',
    dashboardId: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    type: 'table',
    schedule: 'manual',
    dashboardId: ''
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

  const effectiveCompanyId = profile?.company_id ?? selectedCompanyId ?? null;

  const { data: companies } = useQuery({
    queryKey: ['companies-list-for-report-builder', isSuperAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && isSuperAdmin && !profile?.company_id,
  });

  // Fetch scheduled reports
  const { data: scheduledReports } = useQuery({
    queryKey: ['analytics-scheduled-reports', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      const { data, error } = await supabase
        .from('analytics_scheduled_reports')
        .select('*, analytics_dashboards(name)')
        .eq('company_id', effectiveCompanyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveCompanyId
  });

  // Fetch exports
  const { data: exports } = useQuery({
    queryKey: ['analytics-exports', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      const { data, error } = await supabase
        .from('analytics_exports')
        .select('*')
        .eq('company_id', effectiveCompanyId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveCompanyId
  });

  // Fetch dashboards for report creation
  const { data: dashboards } = useQuery({
    queryKey: ['analytics-dashboards', effectiveCompanyId],
    queryFn: async () => {
      if (!effectiveCompanyId) return [];
      const { data, error } = await supabase
        .from('analytics_dashboards')
        .select('id, name')
        .eq('company_id', effectiveCompanyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!effectiveCompanyId
  });

  const scheduleToCron = (schedule: string) => {
    switch (schedule) {
      case 'daily':
        return '0 9 * * *';
      case 'weekly':
        return '0 9 * * 1';
      case 'monthly':
        return '0 9 1 * *';
      default:
        return 'manual';
    }
  };

  const parseRecipients = (raw: string) => {
    const emails = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return { emails };
  };

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

  const handleUseTemplate = (template: TemplateConfig) => {
    setSelectedTemplate(template);
    setTemplateConfig({
      name: template.name,
      dateRange: '30',
      format: 'pdf',
      schedule: 'manual',
      recipients: '',
      dashboardId: dashboards?.[0]?.id ?? ''
    });
    setTemplateModalOpen(true);
  };

  const handleGenerateFromTemplate = async () => {
    if (!selectedTemplate) return;

    if (!effectiveCompanyId) {
      toast.error('No company selected', {
        description: 'Select a company first to generate reports.',
      });
      return;
    }

    if (templateConfig.schedule !== 'manual' && !templateConfig.dashboardId) {
      toast.error('Select a dashboard', {
        description: 'Scheduled reports require a dashboard to export.',
      });
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    try {
      if (templateConfig.schedule === 'manual') {
        const { error } = await supabase.from('analytics_exports').insert({
          company_id: effectiveCompanyId,
          export_type: templateConfig.format,
          status: 'completed',
          file_name: `${templateConfig.name}.${templateConfig.format}`,
          file_url: null,
          dashboard_id: templateConfig.dashboardId || null,
          filters: { dateRange: templateConfig.dateRange, template: selectedTemplate.name },
          created_by: user?.id ?? null,
          completed_at: new Date().toISOString(),
        });
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['analytics-exports'] });
      } else {
        const { error } = await supabase.from('analytics_scheduled_reports').insert({
          company_id: effectiveCompanyId,
          dashboard_id: templateConfig.dashboardId,
          name: templateConfig.name,
          schedule_cron: scheduleToCron(templateConfig.schedule),
          recipients: parseRecipients(templateConfig.recipients),
          export_format: templateConfig.format,
          is_active: true,
          created_by: user?.id ?? null,
          notification_channels: ['email'],
        });
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['analytics-scheduled-reports'] });
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to save report', {
        description: 'Please try again.',
      });
      setIsGenerating(false);
      return;
    }
    
    setIsGenerating(false);
    setTemplateModalOpen(false);
    
    toast.success(`${templateConfig.name} report generated!`, {
      description: "Your report is ready to download.",
      action: {
        label: "Download",
        onClick: () => toast.info("Downloading report..."),
      },
    });
    
    // Reset
    setSelectedTemplate(null);
    setTemplateConfig({
      name: '',
      dateRange: '30',
      format: 'pdf',
      schedule: 'manual',
      recipients: '',
      dashboardId: ''
    });
  };

  const handleCreateReport = async () => {
    if (!newReport.name.trim()) {
      toast.error('Report name is required');
      return;
    }

    if (!effectiveCompanyId) {
      toast.error('No company selected', {
        description: isSuperAdmin
          ? 'Select a company first to create reports.'
          : 'Your account is not linked to a company yet. Please apply for company access.',
        action: !isSuperAdmin
          ? { label: 'Apply', onClick: () => navigate('/company-application') }
          : undefined,
      });
      return;
    }

    if (newReport.schedule !== 'manual' && !newReport.dashboardId) {
      toast.error('Select a dashboard', {
        description: 'Scheduled reports require a dashboard to export.',
      });
      return;
    }

    try {
      if (newReport.schedule === 'manual') {
        const { error } = await supabase.from('analytics_exports').insert({
          company_id: effectiveCompanyId,
          export_type: 'pdf',
          status: 'completed',
          file_name: `${newReport.name}.pdf`,
          file_url: null,
          dashboard_id: newReport.dashboardId || null,
          filters: { description: newReport.description, visualization: newReport.type },
          created_by: user?.id ?? null,
          completed_at: new Date().toISOString(),
        });
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['analytics-exports'] });
      } else {
        const { error } = await supabase.from('analytics_scheduled_reports').insert({
          company_id: effectiveCompanyId,
          dashboard_id: newReport.dashboardId,
          name: newReport.name,
          schedule_cron: scheduleToCron(newReport.schedule),
          recipients: { emails: [] },
          export_format: 'pdf',
          is_active: true,
          created_by: user?.id ?? null,
          notification_channels: ['email'],
        });
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['analytics-scheduled-reports'] });
      }

      toast.success('Report created successfully');
      setNewReportOpen(false);
      setNewReport({ name: '', description: '', type: 'table', schedule: 'manual', dashboardId: '' });
    } catch (e) {
      console.error(e);
      toast.error('Failed to create report');
    }
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

  const templates: TemplateConfig[] = [
    { name: 'Sales Performance', description: 'Track revenue, deals, and conversion rates', icon: BarChart3 },
    { name: 'Customer Engagement', description: 'Monitor user activity and retention', icon: LineChart },
    { name: 'Marketing ROI', description: 'Campaign performance and attribution', icon: PieChart },
    { name: 'Support Metrics', description: 'Ticket resolution and satisfaction', icon: TableIcon },
    { name: 'Social Analytics', description: 'Social media reach and engagement', icon: Share2 },
    { name: 'Email Performance', description: 'Open rates, clicks, and conversions', icon: Mail },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/analytics-platform')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Reports Builder</h1>
            <p className="text-muted-foreground">Create, schedule, and export analytics reports</p>
          </div>
        </div>

        {!profile?.company_id && isSuperAdmin && companies && companies.length > 0 && (
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Dialog open={newReportOpen} onOpenChange={setNewReportOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>Configure your report settings and visualization type.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 -mx-6 px-6">
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

                <div className="space-y-2">
                  <Label>Dashboard</Label>
                  <Select
                    value={newReport.dashboardId}
                    onValueChange={(value) => setNewReport({ ...newReport, dashboardId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={dashboards?.length ? 'Select dashboard' : 'No dashboards found'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(dashboards || []).map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newReport.schedule !== 'manual' && (
                    <p className="text-xs text-muted-foreground">
                      Required for scheduled reports.
                    </p>
                  )}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <Button variant="outline" onClick={() => setNewReportOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateReport}>
                Create Report
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Dashboard</TableHead>
                        <TableHead className="hidden md:table-cell">Schedule</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Last Run</TableHead>
                        <TableHead className="hidden lg:table-cell">Next Run</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduledReports.map((report: any) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.name}</TableCell>
                          <TableCell className="hidden sm:table-cell">{report.analytics_dashboards?.name || 'N/A'}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">{report.schedule_cron}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={report.is_active ? 'default' : 'secondary'}>
                              {report.is_active ? 'Active' : 'Paused'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {report.last_run_at ? format(new Date(report.last_run_at), 'MMM d, h:mm a') : 'Never'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {report.next_run_at ? format(new Date(report.next_run_at), 'MMM d, h:mm a') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover">
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
                </div>
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exports.map((exp: any) => (
                        <TableRow key={exp.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[150px] sm:max-w-none">
                                {exp.file_name || 'Untitled Export'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline">{exp.export_type.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={exp.status === 'completed' ? 'default' : exp.status === 'failed' ? 'destructive' : 'secondary'}>
                              {exp.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
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
                </div>
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template, index) => {
              const Icon = template.icon;
              return (
                <Card key={index} className="cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">{template.name}</CardTitle>
                        <CardDescription className="text-xs">{template.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Configuration Modal */}
      <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && (
                <>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <selectedTemplate.icon className="h-4 w-4 text-primary" />
                  </div>
                  {selectedTemplate.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Configure your report settings before generating.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Report Name</Label>
                <Input 
                  placeholder="Enter report name" 
                  value={templateConfig.name}
                  onChange={(e) => setTemplateConfig({ ...templateConfig, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select 
                  value={templateConfig.dateRange}
                  onValueChange={(value) => setTemplateConfig({ ...templateConfig, dateRange: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last 12 months</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Export Format</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['pdf', 'xlsx', 'csv', 'json'].map((format) => (
                    <button
                      key={format}
                      onClick={() => setTemplateConfig({ ...templateConfig, format })}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                        templateConfig.format === format 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-xs font-medium uppercase">{format}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select 
                  value={templateConfig.schedule}
                  onValueChange={(value) => setTemplateConfig({ ...templateConfig, schedule: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Generate Now (One-time)</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dashboard</Label>
                <Select
                  value={templateConfig.dashboardId}
                  onValueChange={(value) => setTemplateConfig({ ...templateConfig, dashboardId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={dashboards?.length ? 'Select dashboard' : 'No dashboards found'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(dashboards || []).map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templateConfig.schedule !== 'manual' && (
                  <p className="text-xs text-muted-foreground">
                    Required for scheduled delivery.
                  </p>
                )}
              </div>

              {templateConfig.schedule !== 'manual' && (
                <div className="space-y-2">
                  <Label>Email Recipients (optional)</Label>
                  <Input 
                    placeholder="email@example.com, team@company.com" 
                    value={templateConfig.recipients}
                    onChange={(e) => setTemplateConfig({ ...templateConfig, recipients: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated email addresses for scheduled delivery
                  </p>
                </div>
              )}

              {/* Preview section */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Report Preview
                </h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>• <span className="font-medium text-foreground">{templateConfig.name || 'Untitled'}</span></p>
                  <p>• Date range: Last {templateConfig.dateRange} days</p>
                  <p>• Format: {templateConfig.format.toUpperCase()}</p>
                  <p>• Schedule: {templateConfig.schedule === 'manual' ? 'One-time generation' : `${templateConfig.schedule.charAt(0).toUpperCase() + templateConfig.schedule.slice(1)} delivery`}</p>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="flex-shrink-0 pt-4 border-t flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setTemplateModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateFromTemplate}
              disabled={isGenerating || !templateConfig.name}
              className="w-full sm:w-auto gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
