import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";

const FIELD_TYPES = [
  { value: 'text', label: 'Text', description: 'Short text input' },
  { value: 'textarea', label: 'Long Text', description: 'Multi-line text' },
  { value: 'number', label: 'Number', description: 'Numeric input' },
  { value: 'email', label: 'Email', description: 'Email address' },
  { value: 'phone', label: 'Phone', description: 'Phone number' },
  { value: 'url', label: 'URL', description: 'Website link' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'datetime', label: 'Date & Time', description: 'Date and time picker' },
  { value: 'boolean', label: 'Yes/No', description: 'True/false toggle' },
  { value: 'select', label: 'Dropdown', description: 'Single choice from list' },
  { value: 'multiselect', label: 'Multi-Select', description: 'Multiple choices' },
  { value: 'file', label: 'File Upload', description: 'File attachment' },
  { value: 'image', label: 'Image', description: 'Image upload' },
  { value: 'currency', label: 'Currency', description: 'Money amount' },
  { value: 'percentage', label: 'Percentage', description: 'Percentage value' },
];

interface FieldEditorProps {
  moduleId: string;
  field?: any;
  open: boolean;
  onClose: () => void;
}

export function FieldEditor({ moduleId, field, open, onClose }: FieldEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!field;

  const [formData, setFormData] = useState({
    field_name: '',
    display_name: '',
    field_type: 'text',
    is_required: false,
    is_unique: false,
    default_value: '',
    help_text: '',
    field_order: 0,
  });

  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [validationRules, setValidationRules] = useState({
    min_length: '',
    max_length: '',
    min_value: '',
    max_value: '',
    pattern: '',
  });

  useEffect(() => {
    if (field) {
      setFormData({
        field_name: field.field_name,
        display_name: field.display_name,
        field_type: field.field_type,
        is_required: field.is_required,
        is_unique: field.is_unique,
        default_value: field.default_value || '',
        help_text: field.help_text || '',
        field_order: field.field_order || 0,
      });
      
      if (field.field_options && Array.isArray(field.field_options)) {
        setOptions(field.field_options);
      }
      
      if (field.validation_rules && typeof field.validation_rules === 'object') {
        setValidationRules({
          min_length: field.validation_rules.min_length?.toString() || '',
          max_length: field.validation_rules.max_length?.toString() || '',
          min_value: field.validation_rules.min_value?.toString() || '',
          max_value: field.validation_rules.max_value?.toString() || '',
          pattern: field.validation_rules.pattern || '',
        });
      }
    } else {
      // Reset for new field
      setFormData({
        field_name: '',
        display_name: '',
        field_type: 'text',
        is_required: false,
        is_unique: false,
        default_value: '',
        help_text: '',
        field_order: 0,
      });
      setOptions([]);
      setValidationRules({
        min_length: '',
        max_length: '',
        min_value: '',
        max_value: '',
        pattern: '',
      });
    }
  }, [field, open]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      // Build validation rules object
      const rules: any = {};
      if (validationRules.min_length) rules.min_length = parseInt(validationRules.min_length);
      if (validationRules.max_length) rules.max_length = parseInt(validationRules.max_length);
      if (validationRules.min_value) rules.min_value = parseFloat(validationRules.min_value);
      if (validationRules.max_value) rules.max_value = parseFloat(validationRules.max_value);
      if (validationRules.pattern) rules.pattern = validationRules.pattern;

      const fieldData = {
        ...data,
        module_id: moduleId,
        validation_rules: Object.keys(rules).length > 0 ? rules : {},
        field_options: (data.field_type === 'select' || data.field_type === 'multiselect') ? options : [],
      };

      if (isEditing) {
        const { error } = await supabase
          .from('custom_module_fields')
          .update(fieldData)
          .eq('id', field.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('custom_module_fields')
          .insert(fieldData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-module-fields'] });
      toast({
        title: isEditing ? "Field updated" : "Field created",
        description: `Field has been ${isEditing ? 'updated' : 'created'} successfully.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} field`,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.display_name) {
      toast({
        title: "Validation error",
        description: "Please enter a display name",
        variant: "destructive",
      });
      return;
    }

    // Auto-generate field_name from display_name if not provided
    const fieldName = formData.field_name || formData.display_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    if ((formData.field_type === 'select' || formData.field_type === 'multiselect') && options.length === 0) {
      toast({
        title: "Validation error",
        description: "Please add at least one option for dropdown fields",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      ...formData,
      field_name: fieldName,
    });
  };

  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (optionToRemove: string) => {
    setOptions(options.filter(opt => opt !== optionToRemove));
  };

  const needsOptions = formData.field_type === 'select' || formData.field_type === 'multiselect';
  const needsNumericValidation = ['number', 'currency', 'percentage'].includes(formData.field_type);
  const needsLengthValidation = ['text', 'textarea', 'email', 'phone', 'url'].includes(formData.field_type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Field' : 'Add New Field'}</DialogTitle>
          <DialogDescription>
            Define the properties and validation rules for this field
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  placeholder="e.g., Customer Name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field_name">Technical Name</Label>
                <Input
                  id="field_name"
                  placeholder="e.g., customer_name"
                  value={formData.field_name}
                  onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Auto-generated if left empty</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_type">Field Type *</Label>
              <Select
                value={formData.field_type}
                onValueChange={(value) => setFormData({ ...formData, field_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="help_text">Help Text</Label>
              <Textarea
                id="help_text"
                placeholder="Provide guidance for users filling this field..."
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {/* Options for Select/Multiselect */}
          {needsOptions && (
            <div className="space-y-4">
              <h3 className="font-semibold">Options</h3>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add option..."
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                />
                <Button type="button" onClick={addOption} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {options.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {options.map((option) => (
                    <Badge key={option} variant="secondary" className="gap-1">
                      {option}
                      <button
                        type="button"
                        onClick={() => removeOption(option)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Validation Rules */}
          <div className="space-y-4">
            <h3 className="font-semibold">Validation Rules</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {needsLengthValidation && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="min_length">Minimum Length</Label>
                    <Input
                      id="min_length"
                      type="number"
                      placeholder="e.g., 3"
                      value={validationRules.min_length}
                      onChange={(e) => setValidationRules({ ...validationRules, min_length: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_length">Maximum Length</Label>
                    <Input
                      id="max_length"
                      type="number"
                      placeholder="e.g., 100"
                      value={validationRules.max_length}
                      onChange={(e) => setValidationRules({ ...validationRules, max_length: e.target.value })}
                    />
                  </div>
                </>
              )}

              {needsNumericValidation && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="min_value">Minimum Value</Label>
                    <Input
                      id="min_value"
                      type="number"
                      placeholder="e.g., 0"
                      value={validationRules.min_value}
                      onChange={(e) => setValidationRules({ ...validationRules, min_value: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_value">Maximum Value</Label>
                    <Input
                      id="max_value"
                      type="number"
                      placeholder="e.g., 1000"
                      value={validationRules.max_value}
                      onChange={(e) => setValidationRules({ ...validationRules, max_value: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            {formData.field_type === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="pattern">Regex Pattern</Label>
                <Input
                  id="pattern"
                  placeholder="e.g., ^[A-Z]{2}[0-9]{4}$"
                  value={validationRules.pattern}
                  onChange={(e) => setValidationRules({ ...validationRules, pattern: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Regular expression for custom validation
                </p>
              </div>
            )}
          </div>

          {/* Field Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Field Settings</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_required">Required Field</Label>
                  <p className="text-sm text-muted-foreground">Users must fill this field</p>
                </div>
                <Switch
                  id="is_required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_unique">Unique Values</Label>
                  <p className="text-sm text-muted-foreground">Prevent duplicate values</p>
                </div>
                <Switch
                  id="is_unique"
                  checked={formData.is_unique}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_unique: checked })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_value">Default Value</Label>
              <Input
                id="default_value"
                placeholder="Optional default value..."
                value={formData.default_value}
                onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_order">Display Order</Label>
              <Input
                id="field_order"
                type="number"
                placeholder="0"
                value={formData.field_order}
                onChange={(e) => setFormData({ ...formData, field_order: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Field' : 'Create Field'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
