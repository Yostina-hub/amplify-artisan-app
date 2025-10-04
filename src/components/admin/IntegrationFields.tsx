import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MoveUp, MoveDown } from "lucide-react";

interface IntegrationField {
  id: string;
  integration_id: string;
  field_name: string;
  field_type: string;
  field_label: string;
  is_required: boolean;
  default_value: string | null;
  options: any;
  validation_rules: any;
  field_order: number;
}

interface IntegrationFieldsProps {
  integrationId: string;
}

export function IntegrationFields({ integrationId }: IntegrationFieldsProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<IntegrationField | null>(null);

  const { data: fields, isLoading } = useQuery({
    queryKey: ['integration-fields', integrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_integration_fields')
        .select('*')
        .eq('integration_id', integrationId)
        .order('field_order', { ascending: true });
      
      if (error) throw error;
      return data as IntegrationField[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<IntegrationField>) => {
      const insertData = {
        integration_id: integrationId,
        field_name: data.field_name!,
        field_type: data.field_type!,
        field_label: data.field_label!,
        is_required: data.is_required || false,
        default_value: data.default_value || null,
        options: data.options || [],
        validation_rules: data.validation_rules || {},
        field_order: data.field_order || 0,
      };
      
      const { error } = await supabase
        .from('api_integration_fields')
        .insert([insertData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-fields', integrationId] });
      toast.success('Field created successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create field: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<IntegrationField> }) => {
      const { error } = await supabase
        .from('api_integration_fields')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-fields', integrationId] });
      toast.success('Field updated successfully');
      setIsDialogOpen(false);
      setEditingField(null);
    },
    onError: (error) => {
      toast.error(`Failed to update field: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_integration_fields')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-fields', integrationId] });
      toast.success('Field deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete field: ${error.message}`);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from('api_integration_fields')
        .update({ field_order: newOrder })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integration-fields', integrationId] });
    },
  });

  const handleReorder = (field: IntegrationField, direction: 'up' | 'down') => {
    if (!fields) return;
    
    const currentIndex = fields.findIndex(f => f.id === field.id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (swapIndex < 0 || swapIndex >= fields.length) return;
    
    const swapField = fields[swapIndex];
    
    reorderMutation.mutate({ id: field.id, newOrder: swapField.field_order });
    reorderMutation.mutate({ id: swapField.id, newOrder: field.field_order });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Custom Fields</h3>
          <p className="text-sm text-muted-foreground">
            Define dynamic fields for this integration
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditingField(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </DialogTrigger>
          <DialogContent>
            <FieldForm
              field={editingField}
              onSubmit={(data) => {
                if (editingField) {
                  updateMutation.mutate({ id: editingField.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingField(null);
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : !fields || fields.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No custom fields defined yet
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Field Name</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Required</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(field, 'up')}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReorder(field, 'down')}
                      disabled={index === fields.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{field.field_name}</TableCell>
                <TableCell>{field.field_label}</TableCell>
                <TableCell>
                  <Badge variant="outline">{field.field_type}</Badge>
                </TableCell>
                <TableCell>
                  {field.is_required ? (
                    <Badge variant="destructive">Required</Badge>
                  ) : (
                    <Badge variant="secondary">Optional</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingField(field);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this field?')) {
                          deleteMutation.mutate(field.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

interface FieldFormProps {
  field: IntegrationField | null;
  onSubmit: (data: Partial<IntegrationField>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function FieldForm({ field, onSubmit, onCancel, isLoading }: FieldFormProps) {
  const [formData, setFormData] = useState<Partial<IntegrationField>>(
    field || {
      field_name: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      field_order: 0,
      options: [],
      validation_rules: {},
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{field ? 'Edit' : 'Create'} Field</DialogTitle>
        <DialogDescription>
          Define a custom field for this integration
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="field_name">Field Name (API Key) *</Label>
          <Input
            id="field_name"
            value={formData.field_name}
            onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
            placeholder="e.g., api_endpoint"
            pattern="[a-z_]+"
            title="Lowercase letters and underscores only"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field_label">Field Label *</Label>
          <Input
            id="field_label"
            value={formData.field_label}
            onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
            placeholder="e.g., API Endpoint"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field_type">Field Type *</Label>
          <Select
            value={formData.field_type}
            onValueChange={(value: any) => setFormData({ ...formData, field_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="boolean">Boolean</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="select">Select (Dropdown)</SelectItem>
              <SelectItem value="multiselect">Multi-Select</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="default_value">Default Value</Label>
          <Input
            id="default_value"
            value={formData.default_value || ''}
            onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
            placeholder="Optional default value"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_required"
            checked={formData.is_required}
            onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
          />
          <Label htmlFor="is_required">Required Field</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : field ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );
}
