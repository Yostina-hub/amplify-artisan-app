import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBranches, Branch } from "@/hooks/useBranches";
import { PageHelp } from "@/components/PageHelp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Plus, Edit, Trash2, GitBranch } from "lucide-react";

export default function BranchManagement() {
  const { user, isSuperAdmin } = useAuth();
  const { accessibleBranches } = useBranches();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    branch_type: "branch" as "headquarters" | "regional" | "branch" | "sub_branch",
    parent_branch_id: "",
    address: "",
    phone: "",
    email: "",
  });

  // Fetch user's company
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all branches
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches', userProfile?.company_id],
    queryFn: async () => {
      if (!userProfile?.company_id && !isSuperAdmin) return [];

      let query = supabase
        .from('branches')
        .select('*')
        .order('level')
        .order('name');

      if (!isSuperAdmin && userProfile?.company_id) {
        query = query.eq('company_id', userProfile.company_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Branch[];
    },
    enabled: !!userProfile?.company_id || isSuperAdmin,
  });

  // Create branch mutation
  const createBranch = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id || !userProfile?.company_id) throw new Error("User not authenticated");

      const { error } = await supabase.from('branches').insert({
        ...data,
        company_id: userProfile.company_id,
        created_by: user.id,
        level: data.parent_branch_id ? 2 : 1, // Calculate level based on parent
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success("Branch created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create branch: " + error.message);
    },
  });

  // Update branch mutation
  const updateBranch = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('branches')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setIsEditOpen(false);
      setSelectedBranch(null);
      resetForm();
      toast.success("Branch updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update branch: " + error.message);
    },
  });

  // Delete branch mutation
  const deleteBranch = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success("Branch deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete branch: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      branch_type: "branch",
      parent_branch_id: "",
      address: "",
      phone: "",
      email: "",
    });
  };

  const handleCreate = () => {
    createBranch.mutate(formData);
  };

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      branch_type: branch.branch_type,
      parent_branch_id: branch.parent_branch_id || "",
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (selectedBranch) {
      updateBranch.mutate({ id: selectedBranch.id, data: formData });
    }
  };

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBranchTypeBadge = (type: string) => {
    const colors = {
      headquarters: "bg-purple-100 text-purple-800",
      regional: "bg-blue-100 text-blue-800",
      branch: "bg-green-100 text-green-800",
      sub_branch: "bg-yellow-100 text-yellow-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHelp
        title="Branch Management"
        description="Manage your organization's hierarchical branch structure. Create headquarters, regional offices, branches, and sub-branches to organize your company effectively."
        features={[
          "Create multi-level branch hierarchies",
          "Assign managers to branches",
          "Control data access based on branch membership",
          "Track branch performance and metrics",
        ]}
        tips={[
          "Start by creating a headquarters before adding regional branches",
          "Branch codes should be unique and easy to remember (e.g., HQ, BR-001)",
          "Assign branch managers to enable delegated administration",
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Branch Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization's branch hierarchy and structure
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Branch</DialogTitle>
              <DialogDescription>
                Add a new branch to your organization structure
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Main Office"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Branch Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="HQ or BR-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch_type">Branch Type *</Label>
                  <Select
                    value={formData.branch_type}
                    onValueChange={(value: any) => setFormData({ ...formData, branch_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="headquarters">Headquarters</SelectItem>
                      <SelectItem value="regional">Regional Office</SelectItem>
                      <SelectItem value="branch">Branch</SelectItem>
                      <SelectItem value="sub_branch">Sub-Branch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_branch">Parent Branch</Label>
                  <Select
                    value={formData.parent_branch_id}
                    onValueChange={(value) => setFormData({ ...formData, parent_branch_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (Top Level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (Top Level)</SelectItem>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name} ({branch.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main St, City, Country"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="branch@company.com"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Branch</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Branches</CardTitle>
          <CardDescription>
            View and manage all branches in your organization hierarchy
          </CardDescription>
          <div className="mt-4">
            <Input
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent Branch</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading branches...
                  </TableCell>
                </TableRow>
              ) : filteredBranches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No branches found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBranches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        {branch.name}
                      </div>
                    </TableCell>
                    <TableCell>{branch.code}</TableCell>
                    <TableCell>
                      <Badge className={getBranchTypeBadge(branch.branch_type)}>
                        {branch.branch_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {branch.parent_branch_id
                        ? branches.find(b => b.id === branch.parent_branch_id)?.name || '-'
                        : 'Top Level'}
                    </TableCell>
                    <TableCell>Level {branch.level}</TableCell>
                    <TableCell>
                      <Badge variant={branch.is_active ? "default" : "secondary"}>
                        {branch.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(branch)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this branch?')) {
                              deleteBranch.mutate(branch.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update branch information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Branch Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">Branch Code *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-branch_type">Branch Type *</Label>
                <Select
                  value={formData.branch_type}
                  onValueChange={(value: any) => setFormData({ ...formData, branch_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="headquarters">Headquarters</SelectItem>
                    <SelectItem value="regional">Regional Office</SelectItem>
                    <SelectItem value="branch">Branch</SelectItem>
                    <SelectItem value="sub_branch">Sub-Branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-parent_branch">Parent Branch</Label>
                <Select
                  value={formData.parent_branch_id}
                  onValueChange={(value) => setFormData({ ...formData, parent_branch_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (Top Level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Top Level)</SelectItem>
                    {branches
                      .filter(b => b.id !== selectedBranch?.id)
                      .map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name} ({branch.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Branch</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
