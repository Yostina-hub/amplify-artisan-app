import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Play, Pause, Zap } from "lucide-react";

export default function WorkflowBuilder() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger_type: "record_created",
    trigger_config: { module_id: "" },
    conditions: [] as any[],
    actions: [] as any[],
    is_active: true,
  });
  const queryClient = useQueryClient();

  const { data: workflows } = useQuery({
    queryKey: ["automation_workflows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_workflows")
        .select("*, custom_modules(name, display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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

  const { data: executions } = useQuery({
    queryKey: ["automation_executions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_executions")
        .select("*, automation_workflows(name)")
        .order("executed_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: profile } = await supabase.from("profiles").select("company_id").single();
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("automation_workflows").insert({
        ...data,
        company_id: profile?.company_id,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_workflows"] });
      toast.success("Workflow created successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from("automation_workflows")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_workflows"] });
      toast.success("Workflow updated successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("automation_workflows")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_workflows"] });
      toast.success("Workflow deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("automation_workflows")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation_workflows"] });
      toast.success("Workflow status updated");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      trigger_type: "record_created",
      trigger_config: { module_id: "" },
      conditions: [],
      actions: [],
      is_active: true,
    });
    setEditingWorkflow(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWorkflow) {
      updateWorkflowMutation.mutate({ id: editingWorkflow.id, ...formData });
    } else {
      createWorkflowMutation.mutate(formData);
    }
  };

  const openEditDialog = (workflow: any) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || "",
      trigger_type: workflow.trigger_type,
      trigger_config: workflow.trigger_config,
      conditions: workflow.conditions || [],
      actions: workflow.actions || [],
      is_active: workflow.is_active,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: "send_email", config: {} }],
    });
  };

  const updateAction = (index: number, field: string, value: any) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setFormData({ ...formData, actions: newActions });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflow Builder</h1>
          <p className="text-muted-foreground">Automate your business processes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              New Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingWorkflow ? "Edit" : "Create"} Workflow</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Workflow Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="E.g., Send welcome email to new customers"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this workflow do?"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trigger Event *</Label>
                  <Select
                    value={formData.trigger_type}
                    onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="record_created">Record Created</SelectItem>
                      <SelectItem value="record_updated">Record Updated</SelectItem>
                      <SelectItem value="record_deleted">Record Deleted</SelectItem>
                      <SelectItem value="field_changed">Field Changed</SelectItem>
                      <SelectItem value="scheduled">Scheduled (Time-based)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Module *</Label>
                  <Select
                    value={formData.trigger_config.module_id}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        trigger_config: { ...formData.trigger_config, module_id: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a module" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules?.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Active</Label>
                    <p className="text-sm text-muted-foreground">Enable this workflow</p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Actions</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAction}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Action
                  </Button>
                </div>

                {formData.actions.map((action, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Action {index + 1}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAction(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Select
                        value={action.type}
                        onValueChange={(value) => updateAction(index, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="send_email">Send Email</SelectItem>
                          <SelectItem value="update_record">Update Record</SelectItem>
                          <SelectItem value="create_record">Create Record</SelectItem>
                          <SelectItem value="webhook">Call Webhook</SelectItem>
                          <SelectItem value="notification">Send Notification</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingWorkflow ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows?.filter((w) => w.is_active).length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executions?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflows</CardTitle>
          <CardDescription>Manage your automation workflows</CardDescription>
        </CardHeader>
        <CardContent>
          {workflows && workflows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Executions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((workflow: any) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">{workflow.name}</TableCell>
                    <TableCell>{workflow.custom_modules?.display_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {workflow.trigger_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={workflow.is_active}
                        onCheckedChange={(checked) =>
                          toggleWorkflowMutation.mutate({ id: workflow.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          Total: {workflow.execution_count || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Success: {workflow.success_count || 0} | Errors: {workflow.error_count || 0}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(workflow)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No workflows yet. Create your first workflow!
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>Latest workflow execution history</CardDescription>
        </CardHeader>
        <CardContent>
          {executions && executions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Executed At</TableHead>
                  <TableHead>Execution Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executions.map((execution: any) => (
                  <TableRow key={execution.id}>
                    <TableCell>{execution.automation_workflows?.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          execution.status === "completed"
                            ? "default"
                            : execution.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {execution.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {execution.executed_at
                        ? new Date(execution.executed_at).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {execution.execution_time_ms ? `${execution.execution_time_ms}ms` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">No executions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
