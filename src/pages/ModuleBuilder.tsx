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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Box, Edit, Trash2, Database, Settings, GripVertical } from "lucide-react";
import { Layout } from "@/components/Layout";
import { FieldEditor } from "@/components/FieldEditor";

const ICON_OPTIONS = [
  'Box', 'Database', 'Folder', 'FileText', 'Users', 'ShoppingCart', 
  'Calendar', 'Mail', 'Phone', 'MapPin', 'Briefcase', 'Package'
];

export default function ModuleBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editingField, setEditingField] = useState<any>(null);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);

  // Form state for new module
  const [newModule, setNewModule] = useState({
    name: '',
    display_name: '',
    description: '',
    icon_name: 'Box',
  });

  // Fetch modules
  const { data: modules, isLoading } = useQuery({
    queryKey: ['custom-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_modules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch fields for selected module
  const { data: fields } = useQuery({
    queryKey: ['custom-module-fields', selectedModule?.id],
    queryFn: async () => {
      if (!selectedModule?.id) return [];
      
      const { data, error } = await supabase
        .from('custom_module_fields')
        .select('*')
        .eq('module_id', selectedModule.id)
        .order('field_order');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedModule?.id,
  });

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('No company found');

      const { data, error } = await supabase
        .from('custom_modules')
        .insert({
          ...moduleData,
          company_id: profile.company_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-modules'] });
      setIsCreating(false);
      setNewModule({ name: '', display_name: '', description: '', icon_name: 'Box' });
      toast({
        title: "Module created",
        description: "Your custom module has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create module",
        variant: "destructive",
      });
    },
  });

  // Update module mutation
  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('custom_modules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-modules'] });
      setEditingModule(null);
      toast({
        title: "Module updated",
        description: "Your module has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update module",
        variant: "destructive",
      });
    },
  });

  // Delete field mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const { error } = await supabase
        .from('custom_module_fields')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-module-fields'] });
      toast({
        title: "Field deleted",
        description: "The field has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete field",
        variant: "destructive",
      });
    },
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-modules'] });
      if (selectedModule) setSelectedModule(null);
      toast({
        title: "Module deleted",
        description: "The module has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete module",
        variant: "destructive",
      });
    },
  });

  const handleCreateModule = () => {
    if (!newModule.name || !newModule.display_name) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Convert display name to snake_case for name if not provided
    const moduleName = newModule.name || newModule.display_name.toLowerCase().replace(/\s+/g, '_');
    
    createModuleMutation.mutate({
      ...newModule,
      name: moduleName,
    });
  };

  const handleUpdateModule = () => {
    if (!editingModule) return;

    updateModuleMutation.mutate({
      id: editingModule.id,
      updates: {
        display_name: editingModule.display_name,
        description: editingModule.description,
        icon_name: editingModule.icon_name,
      },
    });
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8 text-primary" />
              Module Builder
            </h1>
            <p className="text-muted-foreground mt-2">
              Create custom entities and define their structure
            </p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Create Module
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Module</DialogTitle>
                <DialogDescription>
                  Define a new custom entity for your application
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name *</Label>
                  <Input
                    id="display_name"
                    placeholder="e.g., Customer, Product, Order"
                    value={newModule.display_name}
                    onChange={(e) => setNewModule({ ...newModule, display_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Technical Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., customer, product, order"
                    value={newModule.name}
                    onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use lowercase and underscores only. Auto-generated if left empty.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this module represents..."
                    value={newModule.description}
                    onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select
                    value={newModule.icon_name}
                    onValueChange={(value) => setNewModule({ ...newModule, icon_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateModule}
                  disabled={createModuleMutation.isPending}
                >
                  {createModuleMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create Module
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Modules List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Modules</CardTitle>
                  <CardDescription>
                    {modules?.length || 0} custom modules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {modules && modules.length > 0 ? (
                    modules.map((module) => (
                      <div
                        key={module.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedModule?.id === module.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-accent'
                        }`}
                        onClick={() => setSelectedModule(module)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Box className="h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium">{module.display_name}</p>
                              <p className="text-xs text-muted-foreground">{module.name}</p>
                            </div>
                          </div>
                          <Badge variant={module.is_active ? "default" : "secondary"}>
                            {module.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Box className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No modules yet</p>
                      <p className="text-sm">Create your first module to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Module Details */}
            <div className="lg:col-span-2">
              {selectedModule ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Box className="h-5 w-5" />
                          {selectedModule.display_name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {selectedModule.description || 'No description provided'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={!!editingModule} onOpenChange={(open) => !open && setEditingModule(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingModule(selectedModule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Module</DialogTitle>
                              <DialogDescription>
                                Update module information
                              </DialogDescription>
                            </DialogHeader>
                            {editingModule && (
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Display Name</Label>
                                  <Input
                                    value={editingModule.display_name}
                                    onChange={(e) => setEditingModule({ ...editingModule, display_name: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Description</Label>
                                  <Textarea
                                    value={editingModule.description || ''}
                                    onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                                    rows={3}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Icon</Label>
                                  <Select
                                    value={editingModule.icon_name}
                                    onValueChange={(value) => setEditingModule({ ...editingModule, icon_name: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ICON_OPTIONS.map((icon) => (
                                        <SelectItem key={icon} value={icon}>
                                          {icon}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingModule(null)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpdateModule}
                                disabled={updateModuleMutation.isPending}
                              >
                                {updateModuleMutation.isPending && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Update Module
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
                              deleteModuleMutation.mutate(selectedModule.id);
                            }
                          }}
                          disabled={deleteModuleMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Fields</h3>
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingField(null);
                            setIsFieldEditorOpen(true);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Field
                        </Button>
                      </div>

                      {fields && fields.length > 0 ? (
                        <div className="space-y-2">
                          {fields.map((field) => (
                            <div
                              key={field.id}
                              className="flex items-center justify-between p-3 rounded border hover:bg-accent/50 transition-colors group"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{field.display_name}</p>
                                    {field.is_required && (
                                      <Badge variant="destructive" className="text-xs">Required</Badge>
                                    )}
                                    {field.is_unique && (
                                      <Badge variant="secondary" className="text-xs">Unique</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {field.field_type}
                                    {field.help_text && ` • ${field.help_text.substring(0, 50)}${field.help_text.length > 50 ? '...' : ''}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{field.field_type}</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingField(field);
                                    setIsFieldEditorOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this field?')) {
                                      deleteFieldMutation.mutate(field.id);
                                    }
                                  }}
                                  disabled={deleteFieldMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                          <Settings className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">No fields defined yet</p>
                          <p className="text-sm text-muted-foreground">Add fields to define your module structure</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Database className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      Select a module to view details
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Or create a new module to get started
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Field Editor Dialog */}
        {selectedModule && (
          <FieldEditor
            moduleId={selectedModule.id}
            field={editingField}
            open={isFieldEditorOpen}
            onClose={() => {
              setIsFieldEditorOpen(false);
              setEditingField(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}
