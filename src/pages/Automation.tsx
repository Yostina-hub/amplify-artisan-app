import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Plus, Play, Pause, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Automation() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['automation-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: executions } = useQuery({
    queryKey: ['automation-executions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const toggleWorkflow = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('automation_workflows')
        .update({ is_active: !isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      toast({ title: 'Workflow updated' });
    },
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      toast({ title: 'Workflow deleted' });
    },
  });

  const createWorkflow = useMutation({
    mutationFn: async (workflow: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      const { error } = await supabase
        .from('automation_workflows')
        .insert({
          ...workflow,
          company_id: profile?.company_id,
          created_by: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      setIsCreateOpen(false);
      toast({ title: 'Workflow created successfully' });
    },
  });

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              Smart Automation
            </h1>
            <p className="text-muted-foreground mt-2">
              Automate your social media workflows with AI-powered triggers
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Automation Workflow</DialogTitle>
                <DialogDescription>
                  Set up automated actions triggered by specific events
                </DialogDescription>
              </DialogHeader>
              <WorkflowForm onSubmit={(data) => createWorkflow.mutate(data)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workflows?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {workflows?.filter(w => w.is_active).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{executions?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {executions?.length
                  ? Math.round((executions.filter(e => e.status === 'completed').length / executions.length) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflows */}
        <Card>
          <CardHeader>
            <CardTitle>Your Workflows</CardTitle>
            <CardDescription>Manage your automation workflows</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading workflows...</div>
            ) : workflows && workflows.length > 0 ? (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                            {workflow.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{workflow.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">
                            Trigger: {workflow.trigger_type}
                          </Badge>
                          <Badge variant="outline">
                            Actions: {Array.isArray(workflow.actions) ? workflow.actions.length : 0}
                          </Badge>
                          <Badge variant="outline">
                            Executions: {workflow.execution_count || 0}
                          </Badge>
                          <Badge variant="outline">
                            Success: {workflow.success_count || 0}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Switch
                          checked={workflow.is_active}
                          onCheckedChange={() => toggleWorkflow.mutate({ id: workflow.id, isActive: workflow.is_active })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWorkflow.mutate(workflow.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No workflows yet</p>
                <p className="text-sm mt-1">Create your first automation workflow</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Executions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Executions</CardTitle>
            <CardDescription>Latest workflow execution logs</CardDescription>
          </CardHeader>
          <CardContent>
            {executions && executions.length > 0 ? (
              <div className="space-y-2">
                {executions.slice(0, 10).map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {execution.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : execution.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {execution.status}
                          </Badge>
                          {execution.execution_time_ms && (
                            <span className="text-xs text-muted-foreground">
                              {execution.execution_time_ms}ms
                            </span>
                          )}
                        </div>
                        {execution.error_message && (
                          <p className="text-xs text-red-500 mt-1">{execution.error_message}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(execution.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No executions yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function WorkflowForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'scheduled',
    trigger_config: { schedule: 'daily', time: '09:00' },
    actions: [{ type: 'generate_content', config: {} }],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Workflow Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Daily content generation"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this workflow does"
        />
      </div>
      <div>
        <Label htmlFor="trigger">Trigger Type</Label>
        <Select
          value={formData.trigger_type}
          onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sentiment_threshold">Sentiment Threshold</SelectItem>
            <SelectItem value="engagement_spike">Engagement Spike</SelectItem>
            <SelectItem value="new_mention">New Mention</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">Create Workflow</Button>
    </form>
  );
}
