import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Industry {
  id: string;
  name: string;
  display_name: string;
  slug: string;
  icon_name: string;
  description: string | null;
  features: string[];
  use_cases: string[];
  benefits: string[];
  case_study: any;
  is_active: boolean;
  display_order: number;
}

const IndustryManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Industry>>({
    name: "",
    display_name: "",
    slug: "",
    icon_name: "",
    description: "",
    features: [],
    use_cases: [],
    benefits: [],
    is_active: true,
    display_order: 0,
  });

  const { data: industries, isLoading } = useQuery({
    queryKey: ["industries-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("industries")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Industry[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (industry: Partial<Industry>) => {
      const { name, display_name, slug, icon_name, ...rest } = industry;
      if (!name || !display_name || !slug || !icon_name) {
        throw new Error("Required fields are missing");
      }
      const { error } = await supabase.from("industries").insert([{
        name,
        display_name,
        slug,
        icon_name,
        ...rest
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industries-admin"] });
      toast({ title: "Industry created successfully" });
      setIsCreating(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error creating industry", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...industry }: Partial<Industry> & { id: string }) => {
      const { error } = await supabase.from("industries").update(industry).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industries-admin"] });
      toast({ title: "Industry updated successfully" });
      setEditingId(null);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Error updating industry", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("industries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industries-admin"] });
      toast({ title: "Industry deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error deleting industry", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      display_name: "",
      slug: "",
      icon_name: "",
      description: "",
      features: [],
      use_cases: [],
      benefits: [],
      is_active: true,
      display_order: 0,
    });
  };

  const handleEdit = (industry: Industry) => {
    setEditingId(industry.id);
    setFormData(industry);
  };

  const handleSave = () => {
    if (isCreating) {
      createMutation.mutate(formData);
    } else if (editingId) {
      updateMutation.mutate({ ...formData, id: editingId });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const handleArrayFieldChange = (field: keyof Industry, value: string) => {
    const items = value.split("\n").filter((item) => item.trim() !== "");
    setFormData({ ...formData, [field]: items });
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Industry Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage industry-specific content for the landing page
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating || editingId !== null}>
          <Plus className="h-4 w-4 mr-2" />
          Add Industry
        </Button>
      </div>

      {(isCreating || editingId) && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {isCreating ? "Create New Industry" : "Edit Industry"}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Internal Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., small_business"
              />
            </div>
            <div>
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="e.g., Small Business"
              />
            </div>
            <div>
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., small-business"
              />
            </div>
            <div>
              <Label htmlFor="icon_name">Icon Name *</Label>
              <Input
                id="icon_name"
                value={formData.icon_name}
                onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                placeholder="e.g., Building2"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of how the platform helps this industry"
                rows={3}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                value={formData.features?.join("\n") || ""}
                onChange={(e) => handleArrayFieldChange("features", e.target.value)}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                rows={4}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="use_cases">Use Cases (one per line)</Label>
              <Textarea
                id="use_cases"
                value={formData.use_cases?.join("\n") || ""}
                onChange={(e) => handleArrayFieldChange("use_cases", e.target.value)}
                placeholder="Use case 1&#10;Use case 2&#10;Use case 3"
                rows={4}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="benefits">Benefits (one per line)</Label>
              <Textarea
                id="benefits"
                value={formData.benefits?.join("\n") || ""}
                onChange={(e) => handleArrayFieldChange("benefits", e.target.value)}
                placeholder="Benefit 1&#10;Benefit 2&#10;Benefit 3"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {industries?.map((industry) => (
          <Card key={industry.id} className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">{industry.display_name}</h3>
                  <Badge variant={industry.is_active ? "default" : "secondary"}>
                    {industry.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">Order: {industry.display_order}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Slug:</strong> {industry.slug} | <strong>Icon:</strong> {industry.icon_name}
                </p>
                <p className="text-sm mb-4">{industry.description}</p>
                
                {industry.features.length > 0 && (
                  <div className="mb-3">
                    <strong className="text-sm">Features:</strong>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                      {industry.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                      {industry.features.length > 3 && (
                        <li>... and {industry.features.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(industry)}
                  disabled={editingId !== null || isCreating}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this industry?")) {
                      deleteMutation.mutate(industry.id);
                    }
                  }}
                  disabled={editingId !== null || isCreating}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default IndustryManagement;