import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

interface Industry {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  icon_name: string;
  description: string;
  features: string[];
  use_cases: string[];
  benefits: string[];
  is_active: boolean;
  display_order: number;
}

const IndustryManagement = () => {
  const queryClient = useQueryClient();
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: industries, isLoading } = useQuery({
    queryKey: ['admin-industries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('industries')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Industry[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Industry> }) => {
      const { error } = await supabase
        .from('industries')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-industries'] });
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      toast.success('Industry updated successfully');
      setIsDialogOpen(false);
      setEditingIndustry(null);
    },
    onError: (error) => {
      toast.error('Failed to update industry');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('industries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-industries'] });
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      toast.success('Industry deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete industry');
      console.error(error);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (industry: Omit<Industry, 'id'>) => {
      const { error } = await supabase
        .from('industries')
        .insert(industry);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-industries'] });
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      toast.success('Industry created successfully');
      setIsDialogOpen(false);
      setEditingIndustry(null);
    },
    onError: (error) => {
      toast.error('Failed to create industry');
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const industryData = {
      name: formData.get('name') as string,
      display_name: formData.get('display_name') as string,
      slug: formData.get('slug') as string,
      icon_name: formData.get('icon_name') as string,
      description: formData.get('description') as string,
      features: (formData.get('features') as string).split('\n').filter(f => f.trim()),
      use_cases: (formData.get('use_cases') as string).split('\n').filter(u => u.trim()),
      benefits: (formData.get('benefits') as string).split('\n').filter(b => b.trim()),
      is_active: formData.get('is_active') === 'on',
      display_order: parseInt(formData.get('display_order') as string) || 0,
    };

    if (editingIndustry) {
      updateMutation.mutate({ id: editingIndustry.id, updates: industryData });
    } else {
      createMutation.mutate(industryData as Omit<Industry, 'id'>);
    }
  };

  const handleToggleActive = (id: string, currentState: boolean) => {
    updateMutation.mutate({ id, updates: { is_active: !currentState } });
  };

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    if (!industries) return;
    
    const index = industries.findIndex(i => i.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === industries.length - 1) return;

    const current = industries[index];
    const target = industries[direction === 'up' ? index - 1 : index + 1];

    updateMutation.mutate({ id: current.id, updates: { display_order: target.display_order } });
    updateMutation.mutate({ id: target.id, updates: { display_order: current.display_order } });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Industry Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage industry-specific content and configurations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingIndustry(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Industry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIndustry ? 'Edit Industry' : 'Add New Industry'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name (Internal)</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingIndustry?.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    name="display_name"
                    defaultValue={editingIndustry?.display_name}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    defaultValue={editingIndustry?.slug}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon_name">Icon Name</Label>
                  <Input
                    id="icon_name"
                    name="icon_name"
                    defaultValue={editingIndustry?.icon_name}
                    placeholder="e.g., Building2, Heart"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingIndustry?.description}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea
                  id="features"
                  name="features"
                  defaultValue={editingIndustry?.features?.join('\n')}
                  rows={4}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="use_cases">Use Cases (one per line)</Label>
                <Textarea
                  id="use_cases"
                  name="use_cases"
                  defaultValue={editingIndustry?.use_cases?.join('\n')}
                  rows={4}
                  placeholder="Use case 1&#10;Use case 2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefits">Benefits (one per line)</Label>
                <Textarea
                  id="benefits"
                  name="benefits"
                  defaultValue={editingIndustry?.benefits?.join('\n')}
                  rows={4}
                  placeholder="Benefit 1&#10;Benefit 2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    name="is_active"
                    defaultChecked={editingIndustry?.is_active ?? true}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    name="display_order"
                    type="number"
                    defaultValue={editingIndustry?.display_order ?? 0}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingIndustry(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending}>
                  {editingIndustry ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Industries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {industries?.map((industry, index) => (
                  <TableRow key={industry.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">{industry.display_order}</span>
                        <div className="flex flex-col">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleReorder(industry.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleReorder(industry.id, 'down')}
                            disabled={index === industries.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{industry.display_name}</TableCell>
                    <TableCell className="text-muted-foreground">{industry.slug}</TableCell>
                    <TableCell className="text-muted-foreground">{industry.icon_name}</TableCell>
                    <TableCell>
                      <Badge variant={industry.is_active ? "default" : "secondary"}>
                        {industry.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(industry.id, industry.is_active)}
                        >
                          {industry.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingIndustry(industry);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this industry?')) {
                              deleteMutation.mutate(industry.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IndustryManagement;