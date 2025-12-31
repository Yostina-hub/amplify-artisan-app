import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, Plus, Search, Settings, AlertTriangle, AlertCircle, 
  Info, CheckCircle2, ArrowLeft, MoreVertical, Edit, Trash2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function AlertsManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    kpi_id: '',
    condition_operator: 'lt',
    threshold_value: '',
    severity: 'warning'
  });

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

  const { data: alertRules } = useQuery({
    queryKey: ['analytics-alert-rules', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_alert_rules')
        .select('*, kpi:analytics_kpi_definitions(name)')
        .eq('company_id', profile?.company_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: alerts } = useQuery({
    queryKey: ['analytics-alerts-all', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_alerts')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: kpis } = useQuery({
    queryKey: ['analytics-kpi-definitions', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_kpi_definitions')
        .select('id, name')
        .or(`company_id.is.null,company_id.eq.${profile?.company_id}`)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const handleCreateRule = async () => {
    if (!newRule.name.trim() || !newRule.kpi_id || !newRule.threshold_value) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { error } = await supabase
      .from('analytics_alert_rules')
      .insert({
        company_id: profile?.company_id,
        name: newRule.name,
        kpi_id: newRule.kpi_id,
        condition_operator: newRule.condition_operator,
        threshold_value: parseFloat(newRule.threshold_value),
        severity: newRule.severity,
        created_by: user?.id
      });

    if (error) {
      toast.error('Failed to create alert rule');
      return;
    }

    toast.success('Alert rule created');
    setCreateOpen(false);
    setNewRule({ name: '', kpi_id: '', condition_operator: 'lt', threshold_value: '', severity: 'warning' });
    queryClient.invalidateQueries({ queryKey: ['analytics-alert-rules'] });
  };

  const handleToggleRule = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('analytics_alert_rules')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update rule');
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['analytics-alert-rules'] });
  };

  const handleResolveAlert = async (id: string) => {
    const { error } = await supabase
      .from('analytics_alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to resolve alert');
      return;
    }

    toast.success('Alert resolved');
    queryClient.invalidateQueries({ queryKey: ['analytics-alerts-all'] });
  };

  const severityConfig: Record<string, { icon: any; color: string }> = {
    critical: { icon: AlertCircle, color: 'text-destructive' },
    warning: { icon: AlertTriangle, color: 'text-warning' },
    info: { icon: Info, color: 'text-blue-500' },
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/analytics')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h1>
          <p className="text-muted-foreground">Configure thresholds and manage alerts</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Alert Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Alert Rule</DialogTitle>
              <DialogDescription>
                Set up automatic alerts when metrics cross thresholds
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input 
                  placeholder="e.g., Low Engagement Alert"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>KPI</Label>
                <Select 
                  value={newRule.kpi_id} 
                  onValueChange={(v) => setNewRule(prev => ({ ...prev, kpi_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a KPI" />
                  </SelectTrigger>
                  <SelectContent>
                    {kpis?.map((kpi) => (
                      <SelectItem key={kpi.id} value={kpi.id}>{kpi.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select 
                    value={newRule.condition_operator} 
                    onValueChange={(v) => setNewRule(prev => ({ ...prev, condition_operator: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lt">Less than</SelectItem>
                      <SelectItem value="lte">Less than or equal</SelectItem>
                      <SelectItem value="gt">Greater than</SelectItem>
                      <SelectItem value="gte">Greater than or equal</SelectItem>
                      <SelectItem value="eq">Equals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Threshold</Label>
                  <Input 
                    type="number"
                    placeholder="Value"
                    value={newRule.threshold_value}
                    onChange={(e) => setNewRule(prev => ({ ...prev, threshold_value: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select 
                  value={newRule.severity} 
                  onValueChange={(v) => setNewRule(prev => ({ ...prev, severity: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateRule}>Create Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Active Alerts */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Active Alerts
              </CardTitle>
              <CardDescription>
                {alerts?.filter(a => a.status === 'active').length || 0} active alert(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts?.filter(a => a.status === 'active').map((alert) => {
                const config = severityConfig[alert.severity] || severityConfig.info;
                const Icon = config.icon;
                
                return (
                  <div key={alert.id} className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                        {alert.current_value !== null && (
                          <div className="text-xs mt-2">
                            <span className={config.color}>Current: {alert.current_value}</span>
                            <span className="text-muted-foreground"> | Threshold: {alert.threshold_value}</span>
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleResolveAlert(alert.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                );
              })}
              {(!alerts || alerts.filter(a => a.status === 'active').length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success opacity-40" />
                  <p>No active alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Rules */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Alert Rules
              </CardTitle>
              <CardDescription>
                Configure when alerts should trigger
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>KPI</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertRules?.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{rule.kpi?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        {rule.condition_operator === 'lt' ? '<' :
                         rule.condition_operator === 'lte' ? '≤' :
                         rule.condition_operator === 'gt' ? '>' :
                         rule.condition_operator === 'gte' ? '≥' : '='} {rule.threshold_value}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          rule.severity === 'critical' ? 'destructive' :
                          rule.severity === 'warning' ? 'default' : 'secondary'
                        }>
                          {rule.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={rule.is_active} 
                          onCheckedChange={() => handleToggleRule(rule.id, rule.is_active)}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!alertRules || alertRules.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No alert rules configured
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>Past alerts and resolutions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Resolved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts?.filter(a => a.status !== 'active').map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.title}</div>
                          <div className="text-sm text-muted-foreground">{alert.message}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'warning' ? 'default' : 'secondary'
                        }>
                          {alert.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{alert.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {alert.resolved_at ? new Date(alert.resolved_at).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
