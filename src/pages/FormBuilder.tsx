import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function FormBuilder() {
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const queryClient = useQueryClient();

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

  const { data: fields } = useQuery({
    queryKey: ["custom_module_fields", selectedModuleId],
    queryFn: async () => {
      if (!selectedModuleId) return [];
      const { data, error } = await supabase
        .from("custom_module_fields")
        .select("*")
        .eq("module_id", selectedModuleId)
        .order("field_order");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedModuleId,
  });

  const { data: records } = useQuery({
    queryKey: ["custom_module_data", selectedModuleId],
    queryFn: async () => {
      if (!selectedModuleId) return [];
      const { data, error } = await supabase
        .from("custom_module_data")
        .select("*")
        .eq("module_id", selectedModuleId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedModuleId,
  });

  const createRecordMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const { data: profile } = await supabase.from("profiles").select("company_id").single();
      const { data: user } = await supabase.auth.getUser();
      const { data: result, error } = await supabase
        .from("custom_module_data")
        .insert([{
          module_id: selectedModuleId,
          company_id: profile?.company_id,
          created_by: user.user?.id,
          data,
        }])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_module_data", selectedModuleId] });
      toast.success("Record created successfully");
      setIsDialogOpen(false);
      setFormData({});
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const { error } = await supabase
        .from("custom_module_data")
        .update({ data })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_module_data", selectedModuleId] });
      toast.success("Record updated successfully");
      setIsDialogOpen(false);
      setEditingRecord(null);
      setFormData({});
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_module_data")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_module_data", selectedModuleId] });
      toast.success("Record deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const renderField = (field: any) => {
    const value = formData[field.field_name];
    const updateField = (val: any) => setFormData({ ...formData, [field.field_name]: val });

    switch (field.field_type) {
      case "text":
      case "email":
      case "url":
        return <Input type={field.field_type} value={value || ""} onChange={(e) => updateField(e.target.value)} required={field.is_required} />;
      
      case "number":
        return <Input type="number" value={value || ""} onChange={(e) => updateField(e.target.value)} required={field.is_required} />;
      
      case "textarea":
        return <Textarea value={value || ""} onChange={(e) => updateField(e.target.value)} required={field.is_required} />;
      
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox checked={value || false} onCheckedChange={updateField} />
            <Label>Yes</Label>
          </div>
        );
      
      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal", !value && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={value ? new Date(value) : undefined} onSelect={(date) => updateField(date?.toISOString())} initialFocus />
            </PopoverContent>
          </Popover>
        );
      
      case "select":
        return (
          <Select value={value || ""} onValueChange={updateField}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.field_options?.map((opt: any) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return <Input value={value || ""} onChange={(e) => updateField(e.target.value)} required={field.is_required} />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      updateRecordMutation.mutate({ id: editingRecord.id, data: formData });
    } else {
      createRecordMutation.mutate(formData);
    }
  };

  const openEditDialog = (record: any) => {
    setEditingRecord(record);
    setFormData(record.data);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingRecord(null);
    setFormData({});
    setIsDialogOpen(true);
  };

  const selectedModule = modules?.find(m => m.id === selectedModuleId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Form Builder</h1>
          <p className="text-muted-foreground">Create and manage data for your custom modules</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Module</CardTitle>
          <CardDescription>Choose a module to work with</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
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
        </CardContent>
      </Card>

      {selectedModuleId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedModule?.display_name} Records</CardTitle>
                <CardDescription>{selectedModule?.description}</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Record
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingRecord ? "Edit" : "Create"} {selectedModule?.display_name}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {fields?.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label>
                          {field.display_name}
                          {field.is_required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {field.help_text && <p className="text-sm text-muted-foreground">{field.help_text}</p>}
                        {renderField(field)}
                      </div>
                    ))}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">{editingRecord ? "Update" : "Create"}</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {records && records.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    {fields?.slice(0, 4).map((field) => (
                      <TableHead key={field.id}>{field.display_name}</TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      {fields?.slice(0, 4).map((field) => (
                        <TableCell key={field.id}>
                          {field.field_type === "boolean" 
                            ? (record.data[field.field_name] ? "Yes" : "No")
                            : field.field_type === "date"
                            ? (record.data[field.field_name] ? format(new Date(record.data[field.field_name]), "PPP") : "-")
                            : record.data[field.field_name] || "-"}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(record)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteRecordMutation.mutate(record.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">No records found. Create your first record!</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
