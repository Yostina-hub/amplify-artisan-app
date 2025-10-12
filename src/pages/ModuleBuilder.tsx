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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, Box, Edit, Trash2, Database, Settings, Sparkles } from "lucide-react";
import { FieldEditor } from "@/components/FieldEditor";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableField } from "@/components/module-builder/DraggableField";
import { ComponentTypeSelector } from "@/components/module-builder/ComponentTypeSelector";
import { PermissionAssigner } from "@/components/module-builder/PermissionAssigner";
import { BranchAccessControl } from "@/components/module-builder/BranchAccessControl";
import { PageHelp } from "@/components/PageHelp";
import { ColorPickerInput } from "@/components/ColorPickerInput";

const ICON_OPTIONS = [
  'Box', 'Database', 'Folder', 'FileText', 'Users', 'ShoppingCart', 
  'Calendar', 'Mail', 'Phone', 'MapPin', 'Briefcase', 'Package',
  'BarChart', 'PieChart', 'TrendingUp', 'Activity', 'Grid', 'List'
];

export default function ModuleBuilder() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editingField, setEditingField] = useState<any>(null);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [selectedComponentTypes, setSelectedComponentTypes] = useState<string[]>(['form', 'table']);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form state for new module
  const [newModule, setNewModule] = useState({
    name: '',
    display_name: '',
    description: '',
    icon_name: 'Box',
    color: '#3b82f6',
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

      // Extract color from moduleData and store in metadata
      const { color, ...restModuleData } = moduleData;

      const { data, error } = await supabase
        .from('custom_modules')
        .insert({
          ...restModuleData,
          company_id: profile.company_id,
          created_by: user.id,
          metadata: {
            color,
            component_types: selectedComponentTypes,
            branch_access: selectedBranches,
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-modules'] });
      setIsCreating(false);
      setNewModule({ name: '', display_name: '', description: '', icon_name: 'Box', color: '#3b82f6' });
      setSelectedComponentTypes(['form', 'table']);
      setSelectedBranches([]);
      toast.success("Module created successfully with all components!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create module");
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
      toast.success("Module updated successfully");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update module");
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
      toast.success("Field deleted successfully");
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
      toast.success("Module deleted successfully");
    },
  });

  // Update field order mutation
  const updateFieldOrderMutation = useMutation({
    mutationFn: async (updatedFields: any[]) => {
      const updates = updatedFields.map((field, index) => ({
        id: field.id,
        field_order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('custom_module_fields')
          .update({ field_order: update.field_order })
          .eq('id', update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-module-fields'] });
      toast.success("Field order updated");
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && fields) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      const reorderedFields = arrayMove(fields, oldIndex, newIndex);
      updateFieldOrderMutation.mutate(reorderedFields);
    }
  };

  const handleCreateModule = () => {
    if (!newModule.display_name) {
      toast.error("Please fill in all required fields");
      return;
    }

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
        metadata: {
          ...editingModule.metadata,
          color: editingModule.color,
          component_types: selectedComponentTypes,
          branch_access: selectedBranches,
        },
      },
    });
  };

  const toggleComponentType = (type: string) => {
    setSelectedComponentTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleBranch = (branchId: string) => {
    setSelectedBranches(prev =>
      prev.includes(branchId) ? prev.filter(id => id !== branchId) : [...prev, branchId]
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <PageHelp
        title="Advanced Module Builder"
        description="Create custom modules with drag-and-drop field management, visual components, permission control, and branch-level access."
        features={[
          "Drag-and-drop field reordering for intuitive organization",
          "Multiple view types: Forms, Tables, Lists, Grids, Charts",
          "Permission-based access control per module",
          "Branch-level visibility and data isolation",
          "Auto-generated CRUD operations and APIs",
          "Real-time data management with pagination",
        ]}
        tips={[
          "Start with simple modules and add complexity as needed",
          "Use drag-and-drop to reorder fields for better UX",
          "Assign permissions carefully to ensure data security",
          "Branch access controls help segment data by location",
          "Charts and graphs work best with numeric fields",
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8 text-primary" />
            Module Builder
          </h1>
          <p className="text-muted-foreground mt-2">
            Create custom entities with visual components and access control
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Create Module
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Module</DialogTitle>
              <DialogDescription>
                Define a new custom entity with components and access control
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="branches">Branches</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 py-4">
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
                  <Label htmlFor="name">Technical Name</Label>
                  <Input
                    id="name"
                    placeholder="Auto-generated from display name"
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
                <div className="grid grid-cols-2 gap-4">
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
                  <ColorPickerInput
                    label="Module Color"
                    value={newModule.color}
                    onChange={(color) => setNewModule({ ...newModule, color })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="components" className="py-4">
                <ComponentTypeSelector
                  selectedTypes={selectedComponentTypes}
                  onToggleType={toggleComponentType}
                />
              </TabsContent>

              <TabsContent value="branches" className="py-4">
                <BranchAccessControl
                  moduleId=""
                  selectedBranches={selectedBranches}
                  onToggleBranch={toggleBranch}
                />
              </TabsContent>

              <TabsContent value="permissions" className="py-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Permission Setup</CardTitle>
                    <CardDescription>
                      Permissions will be automatically created after the module is created.
                      You can then assign them to roles.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        The following permissions will be created:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">View</Badge>
                        <Badge variant="outline">Create</Badge>
                        <Badge variant="outline">Edit</Badge>
                        <Badge variant="outline">Delete</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedModule?.id === module.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:bg-accent hover:shadow-sm'
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
              <Tabs defaultValue="fields" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="fields">Fields</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="fields">
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Box className="h-5 w-5" />
                            {selectedModule.display_name} Fields
                          </CardTitle>
                          <CardDescription className="mt-2">
                            Drag and drop to reorder fields
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => {
                            setEditingField(null);
                            setIsFieldEditorOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Field
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {fields && fields.length > 0 ? (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={fields.map(f => f.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {fields.map((field) => (
                                <DraggableField
                                  key={field.id}
                                  field={field}
                                  onEdit={() => {
                                    setEditingField(field);
                                    setIsFieldEditorOpen(true);
                                  }}
                                  onDelete={() => deleteFieldMutation.mutate(field.id)}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No fields yet</p>
                          <p className="text-sm">Add fields to define your module structure</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="permissions">
                  <PermissionAssigner
                    moduleId={selectedModule.id}
                    moduleName={selectedModule.name}
                  />
                </TabsContent>

                <TabsContent value="settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>Module Settings</CardTitle>
                      <CardDescription>
                        Configure module behavior and components
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium mb-3">Component Types</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedModule.metadata?.component_types?.map((type: string) => (
                            <Badge key={type} variant="secondary">
                              {type}
                            </Badge>
                          )) || <p className="text-sm text-muted-foreground">No component types configured</p>}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingModule({
                              ...selectedModule,
                              color: selectedModule.metadata?.color || '#3b82f6'
                            });
                            setSelectedComponentTypes(selectedModule.metadata?.component_types || []);
                            setSelectedBranches(selectedModule.metadata?.branch_access || []);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Module
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Delete module "${selectedModule.display_name}"?`)) {
                              deleteModuleMutation.mutate(selectedModule.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Module
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a module to view and edit its fields</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Field Editor Dialog */}
      <FieldEditor
        moduleId={selectedModule?.id || ''}
        field={editingField}
        open={isFieldEditorOpen}
        onClose={() => {
          setIsFieldEditorOpen(false);
          setEditingField(null);
          queryClient.invalidateQueries({ queryKey: ['custom-module-fields'] });
        }}
      />
    </div>
  );
}
