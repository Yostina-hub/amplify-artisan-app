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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, DollarSign } from "lucide-react";
import { toast } from "sonner";

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

const PricingPlansTab = () => {
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
      toast.success('Pricing plan updated');
      setIsDialogOpen(false);
      setEditingPlan(null);
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
      toast.success('Pricing plan deleted');
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
      toast.success('Pricing plan created');
      setIsDialogOpen(false);
      setEditingPlan(null);
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Pricing Plans</h3>
          <p className="text-sm text-muted-foreground">Manage subscription pricing plans</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPlan(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input id="name" name="name" defaultValue={editingPlan?.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" defaultValue={editingPlan?.slug} required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue={editingPlan?.price} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" name="currency" defaultValue={editingPlan?.currency || 'USD'} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_period">Period</Label>
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
                <Input id="description" name="description" defaultValue={editingPlan?.description} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea
                  id="features"
                  name="features"
                  defaultValue={editingPlan?.features?.join('\n')}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="includes_ai" name="includes_ai" defaultChecked={editingPlan?.includes_ai} />
                  <Label htmlFor="includes_ai">AI Features</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="is_popular" name="is_popular" defaultChecked={editingPlan?.is_popular} />
                  <Label htmlFor="is_popular">Popular</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="is_active" name="is_active" defaultChecked={editingPlan?.is_active ?? true} />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPlan ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans?.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{plan.name}</span>
                        {plan.is_popular && <Badge>Popular</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">{plan.price}</span>
                        <span className="text-xs text-muted-foreground">/{plan.billing_period}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{plan.features?.length || 0} features</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingPlan(plan);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Delete this plan?')) {
                              deleteMutation.mutate(plan.id);
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
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingPlansTab;