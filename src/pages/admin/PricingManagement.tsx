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
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BillingSystemAlert } from "@/components/admin/BillingSystemAlert";

interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  billing_period: string;
  description: string;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
  cta_text: string;
  max_social_accounts: number;
  max_team_members: number;
  includes_ai: boolean;
  support_level: string;
  custom_integrations: boolean;
}

const PricingManagement = () => {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-pricing-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as PricingPlan[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PricingPlan> }) => {
      const { error } = await supabase
        .from('pricing_plans')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pricing-plans'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast.success('Pricing plan updated successfully');
      setIsDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (error) => {
      toast.error('Failed to update pricing plan');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pricing-plans'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast.success('Pricing plan deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete pricing plan');
      console.error(error);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (plan: Omit<PricingPlan, 'id'>) => {
      const { error } = await supabase
        .from('pricing_plans')
        .insert(plan);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pricing-plans'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-plans'] });
      toast.success('Pricing plan created successfully');
      setIsDialogOpen(false);
      setEditingPlan(null);
    },
    onError: (error) => {
      toast.error('Failed to create pricing plan');
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const planData = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      price: parseFloat(formData.get('price') as string),
      currency: formData.get('currency') as string,
      billing_period: formData.get('billing_period') as string,
      description: formData.get('description') as string,
      features: (formData.get('features') as string).split('\n').filter(f => f.trim()),
      is_popular: formData.get('is_popular') === 'on',
      is_active: formData.get('is_active') === 'on',
      display_order: parseInt(formData.get('display_order') as string) || 0,
      cta_text: formData.get('cta_text') as string,
      max_social_accounts: parseInt(formData.get('max_social_accounts') as string) || -1,
      max_team_members: parseInt(formData.get('max_team_members') as string) || -1,
      includes_ai: formData.get('includes_ai') === 'on',
      support_level: formData.get('support_level') as string,
      custom_integrations: formData.get('custom_integrations') === 'on',
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, updates: planData });
    } else {
      createMutation.mutate(planData as Omit<PricingPlan, 'id'>);
    }
  };

  const handleToggleActive = (id: string, currentState: boolean) => {
    updateMutation.mutate({ id, updates: { is_active: !currentState } });
  };

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    if (!plans) return;
    
    const index = plans.findIndex(p => p.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === plans.length - 1) return;

    const current = plans[index];
    const target = plans[direction === 'up' ? index - 1 : index + 1];

    updateMutation.mutate({ id: current.id, updates: { display_order: target.display_order } });
    updateMutation.mutate({ id: target.id, updates: { display_order: current.display_order } });
  };

  return (
    <div className="space-y-6">
      <BillingSystemAlert />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage pricing plans and features
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPlan(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Pricing Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Edit Pricing Plan' : 'Add New Pricing Plan'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingPlan?.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    defaultValue={editingPlan?.slug}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingPlan?.price}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    name="currency"
                    defaultValue={editingPlan?.currency || 'USD'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_period">Billing Period</Label>
                  <Select name="billing_period" defaultValue={editingPlan?.billing_period || 'month'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={editingPlan?.description}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cta_text">CTA Button Text</Label>
                <Input
                  id="cta_text"
                  name="cta_text"
                  defaultValue={editingPlan?.cta_text || 'Start free trial'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea
                  id="features"
                  name="features"
                  defaultValue={editingPlan?.features?.join('\n')}
                  rows={6}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_social_accounts">Max Social Accounts</Label>
                  <Input
                    id="max_social_accounts"
                    name="max_social_accounts"
                    type="number"
                    defaultValue={editingPlan?.max_social_accounts}
                    placeholder="-1 for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_team_members">Max Team Members</Label>
                  <Input
                    id="max_team_members"
                    name="max_team_members"
                    type="number"
                    defaultValue={editingPlan?.max_team_members}
                    placeholder="-1 for unlimited"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_level">Support Level</Label>
                <Select name="support_level" defaultValue={editingPlan?.support_level || 'standard'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="dedicated">Dedicated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includes_ai"
                    name="includes_ai"
                    defaultChecked={editingPlan?.includes_ai}
                  />
                  <Label htmlFor="includes_ai">Includes AI</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="custom_integrations"
                    name="custom_integrations"
                    defaultChecked={editingPlan?.custom_integrations}
                  />
                  <Label htmlFor="custom_integrations">Custom Integrations</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_popular"
                    name="is_popular"
                    defaultChecked={editingPlan?.is_popular}
                  />
                  <Label htmlFor="is_popular">Popular</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    name="is_active"
                    defaultChecked={editingPlan?.is_active ?? true}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  name="display_order"
                  type="number"
                  defaultValue={editingPlan?.display_order ?? 0}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingPlan(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending || createMutation.isPending}>
                  {editingPlan ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans?.map((plan, index) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">{plan.display_order}</span>
                        <div className="flex flex-col">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleReorder(plan.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleReorder(plan.id, 'down')}
                            disabled={index === plans.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{plan.name}</span>
                        {plan.is_popular && (
                          <Badge variant="default" className="text-xs">Popular</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{plan.price}</span>
                        <span className="text-xs text-muted-foreground">/{plan.billing_period}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {plan.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(plan.id, plan.is_active)}
                        >
                          {plan.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPlan(plan);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this pricing plan?')) {
                              deleteMutation.mutate(plan.id);
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

export default PricingManagement;