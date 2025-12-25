import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, Sparkles, Zap, Play, Pause } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { WorkflowNode } from "@/components/workflow/WorkflowNode";
import { ActionBuilder } from "@/components/workflow/ActionBuilder";
import { PageHelp } from "@/components/PageHelp";
import { ColorPickerInput } from "@/components/ColorPickerInput";

const TRIGGER_TYPES = [
  { value: 'schedule', label: 'Schedule (Time-based)', description: 'Run at specific times' },
  { value: 'webhook', label: 'Webhook', description: 'Trigger via HTTP webhook' },
  { value: 'database', label: 'Database Event', description: 'When data changes' },
  { value: 'email', label: 'Email Received', description: 'When email arrives' },
  { value: 'message', label: 'Message Event', description: 'Chat or notification' },
];

export default function Automation() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const [workflowActions, setWorkflowActions] = useState<any[]>([]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form state
  const [newWorkflow, setNewWorkflow] = useState<{
    name: string;
    description: string;
    trigger_type: string;
    trigger_config: Record<string, any>;
    color: string;
  }>({
    name: '',
    description: '',
    trigger_type: 'schedule',
    trigger_config: {},
    color: '#8b5cf6',
  });

  // Fetch workflows
  const { data: workflows, isLoading, error: workflowError } = useQuery({
    queryKey: ['automation-workflows'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.company_id) {
        return []; // Return empty array if no company
      }

      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: async (workflowData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('No company found');

      const { data, error } = await supabase
        .from('automation_workflows')
        .insert({
          ...workflowData,
          company_id: profile.company_id,
          created_by: user.id,
          actions: workflowActions,
          metadata: { color: workflowData.color },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      setIsCreating(false);
      setNewWorkflow({ name: '', description: '', trigger_type: 'schedule', trigger_config: {}, color: '#8b5cf6' });
      setWorkflowActions([]);
      toast.success("Workflow created successfully!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create workflow");
    },
  });

  // Update workflow mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('automation_workflows')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      setEditingWorkflow(null);
      toast.success("Workflow updated successfully");
    },
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      if (selectedWorkflow) setSelectedWorkflow(null);
      toast.success("Workflow deleted successfully");
    },
  });

  // Toggle workflow status
  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('automation_workflows')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-workflows'] });
      toast.success("Workflow status updated");
    },
  });

  // Manual workflow execution
  const executeWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      // Call edge function to execute workflow
      const { data, error } = await supabase.functions.invoke('execute-automation', {
        body: { workflow_id: id },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Workflow executed successfully");
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && workflows) {
      const oldIndex = workflows.findIndex((w) => w.id === active.id);
      const newIndex = workflows.findIndex((w) => w.id === over.id);

      arrayMove(workflows, oldIndex, newIndex);
    }
  };

  const handleCreateWorkflow = () => {
    if (!newWorkflow.name) {
      toast.error("Please enter a workflow name");
      return;
    }

    createWorkflowMutation.mutate(newWorkflow);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <PageHelp
        title="Workflow Automation"
        description="Create intelligent workflows that automate repetitive tasks, integrate with external services, and streamline your business processes."
        features={[
          "Visual workflow builder with drag-and-drop",
          "Multiple trigger types: Schedule, Webhook, Database events",
          "Action blocks: Email, Zapier, Webhooks, Database operations",
          "Color-coded workflows for easy identification",
          "Real-time execution monitoring and logs",
          "Test workflows before activation",
        ]}
        tips={[
          "Start with simple workflows and add complexity gradually",
          "Use Zapier integration to connect 5000+ apps",
          "Test webhooks using tools like Postman or cURL",
          "Color code workflows by department or priority",
          "Monitor execution logs to optimize performance",
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Workflow Automation
          </h1>
          <p className="text-muted-foreground mt-2">
            Automate tasks with intelligent workflows and integrations
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
              <DialogDescription>
                Design an automated workflow with triggers and actions
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="trigger">Trigger</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workflow Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Send Welcome Email, Daily Report"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this workflow does..."
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <ColorPickerInput
                  label="Workflow Color"
                  value={newWorkflow.color}
                  onChange={(color) => setNewWorkflow({ ...newWorkflow, color })}
                />
              </TabsContent>

              <TabsContent value="trigger" className="space-y-4 py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>When should this workflow run?</CardTitle>
                    <CardDescription>
                      Select a trigger type and configure when it activates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Trigger Type</Label>
                      <Select
                        value={newWorkflow.trigger_type}
                        onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIGGER_TYPES.map((trigger) => (
                            <SelectItem key={trigger.value} value={trigger.value}>
                              <div>
                                <div className="font-medium">{trigger.label}</div>
                                <div className="text-xs text-muted-foreground">{trigger.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {newWorkflow.trigger_type === 'schedule' && (
                      <div className="space-y-2">
                        <Label>Schedule (Cron Expression)</Label>
                        <Input
                          placeholder="0 9 * * * (Every day at 9 AM)"
                          value={newWorkflow.trigger_config.cron || ''}
                          onChange={(e) =>
                            setNewWorkflow({
                              ...newWorkflow,
                              trigger_config: { cron: e.target.value },
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Use cron syntax. Examples: "0 9 * * *" (daily at 9 AM), "0 */4 * * *" (every 4 hours)
                        </p>
                      </div>
                    )}

                    {newWorkflow.trigger_type === 'webhook' && (
                      <div className="space-y-2">
                        <Label>Webhook Path</Label>
                        <Input
                          placeholder="/webhook/my-trigger"
                          value={newWorkflow.trigger_config.path || ''}
                          onChange={(e) =>
                            setNewWorkflow({
                              ...newWorkflow,
                              trigger_config: { path: e.target.value },
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          This will be available at: https://your-domain.com{newWorkflow.trigger_config.path || '/webhook/path'}
                        </p>
                      </div>
                    )}

                    {newWorkflow.trigger_type === 'database' && (
                      <>
                        <div className="space-y-2">
                          <Label>Table Name</Label>
                          <Input
                            placeholder="leads"
                            value={newWorkflow.trigger_config.table || ''}
                            onChange={(e) =>
                              setNewWorkflow({
                                ...newWorkflow,
                                trigger_config: { ...newWorkflow.trigger_config, table: e.target.value },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Event Type</Label>
                          <Select
                            value={newWorkflow.trigger_config.event || 'INSERT'}
                            onValueChange={(value) =>
                              setNewWorkflow({
                                ...newWorkflow,
                                trigger_config: { ...newWorkflow.trigger_config, event: value },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INSERT">INSERT (New Record)</SelectItem>
                              <SelectItem value="UPDATE">UPDATE (Modified Record)</SelectItem>
                              <SelectItem value="DELETE">DELETE (Deleted Record)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="py-4">
                <ActionBuilder
                  actions={workflowActions}
                  onUpdate={setWorkflowActions}
                />
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateWorkflow}
                disabled={createWorkflowMutation.isPending}
              >
                {createWorkflowMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Workflow
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : workflowError ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Unable to load workflows. Please try again.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Workflows</CardTitle>
                <CardDescription>
                  {workflows?.length || 0} automation workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workflows && workflows.length > 0 ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={workflows.map(w => w.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {workflows.map((workflow) => (
                          <div
                            key={workflow.id}
                            className={`cursor-pointer transition-all ${
                              selectedWorkflow?.id === workflow.id
                                ? 'ring-2 ring-primary'
                                : ''
                            }`}
                            onClick={() => setSelectedWorkflow(workflow)}
                          >
                            <WorkflowNode
                              node={workflow}
                              onEdit={() => setEditingWorkflow(workflow)}
                              onDelete={() => {
                                if (confirm(`Delete workflow "${workflow.name}"?`)) {
                                  deleteWorkflowMutation.mutate(workflow.id);
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No workflows yet</p>
                    <p className="text-sm">Create your first automation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedWorkflow ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: selectedWorkflow.metadata?.color || '#8b5cf6' }}
                        />
                        {selectedWorkflow.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {selectedWorkflow.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedWorkflow.is_active ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          toggleWorkflowMutation.mutate({
                            id: selectedWorkflow.id,
                            is_active: !selectedWorkflow.is_active,
                          })
                        }
                      >
                        {selectedWorkflow.is_active ? (
                          <><Pause className="h-4 w-4 mr-2" />Pause</>
                        ) : (
                          <><Play className="h-4 w-4 mr-2" />Activate</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeWorkflowMutation.mutate(selectedWorkflow.id)}
                        disabled={executeWorkflowMutation.isPending}
                      >
                        {executeWorkflowMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Test Run
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{selectedWorkflow.execution_count || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Runs</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-500">{selectedWorkflow.success_count || 0}</div>
                        <div className="text-sm text-muted-foreground">Successful</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-destructive">{selectedWorkflow.error_count || 0}</div>
                        <div className="text-sm text-muted-foreground">Failed</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-3">Workflow Actions</h3>
                    {selectedWorkflow.actions && selectedWorkflow.actions.length > 0 ? (
                      <div className="space-y-2">
                        {selectedWorkflow.actions.map((action: any, index: number) => (
                          <Card key={index} style={{ borderLeftColor: action.color, borderLeftWidth: '4px' }}>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">#{index + 1}</span>
                                <span className="font-medium">{action.name}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No actions configured</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Zap className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a workflow to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
