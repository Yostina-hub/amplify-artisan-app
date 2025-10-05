import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, Lock, Users, Plus, Trash2, Edit } from "lucide-react";

interface Permission {
  id: string;
  module_name: string;
  permission_key: string;
  permission_name: string;
  description: string;
  category: string;
  is_system: boolean;
}

interface RolePermission {
  id: string;
  role: string;
  permission_id: string;
  company_id: string | null;
}

interface Role {
  id: string;
  role_key: string;
  role_name: string;
  description: string | null;
  is_system: boolean;
  color: string;
  created_at: string;
}

export default function PermissionManagement() {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState({
    role_key: "",
    role_name: "",
    description: "",
    color: "#6b7280",
  });

  // Fetch all roles
  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('role_name');
      if (error) throw error;
      return data as Role[];
    },
  });

  // Fetch all permissions
  const { data: permissions = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category')
        .order('permission_name');
      if (error) throw error;
      return data as Permission[];
    },
  });

  // Fetch role permissions
  const { data: rolePermissions = [], isLoading: loadingRolePermissions } = useQuery({
    queryKey: ['role-permissions', selectedRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', selectedRole);
      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: !!selectedRole,
  });

  // Create role mutation
  const createRole = useMutation({
    mutationFn: async (data: typeof roleFormData) => {
      const { error } = await supabase.from('roles').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success("Role created successfully");
      setIsCreateRoleOpen(false);
      resetRoleForm();
    },
    onError: (error) => {
      toast.error("Failed to create role: " + error.message);
    },
  });

  // Update role mutation
  const updateRole = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof roleFormData> }) => {
      const { error } = await supabase
        .from('roles')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success("Role updated successfully");
      setEditingRole(null);
      resetRoleForm();
    },
    onError: (error) => {
      toast.error("Failed to update role: " + error.message);
    },
  });

  // Delete role mutation
  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('roles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success("Role deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete role: " + error.message);
    },
  });

  // Toggle permission mutation
  const togglePermission = useMutation({
    mutationFn: async ({ permissionId, enabled }: { permissionId: string; enabled: boolean }) => {
      if (enabled) {
        // Remove permission
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role', selectedRole)
          .eq('permission_id', permissionId);
        if (error) throw error;
      } else {
        // Add permission
        const { error } = await supabase
          .from('role_permissions')
          .insert([{
            role: selectedRole,
            permission_id: permissionId,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success("Permission updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update permission: " + error.message);
    },
  });

  const resetRoleForm = () => {
    setRoleFormData({
      role_key: "",
      role_name: "",
      description: "",
      color: "#6b7280",
    });
  };

  const handleCreateRole = () => {
    createRole.mutate(roleFormData);
  };

  const handleUpdateRole = () => {
    if (editingRole) {
      updateRole.mutate({ id: editingRole.id, data: roleFormData });
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleFormData({
      role_key: role.role_key,
      role_name: role.role_name,
      description: role.description || "",
      color: role.color,
    });
  };

  const handleDeleteRole = (role: Role) => {
    if (role.is_system) {
      toast.error("Cannot delete system roles");
      return;
    }
    if (confirm(`Are you sure you want to delete the role "${role.role_name}"?`)) {
      deleteRole.mutate(role.id);
    }
  };

  const handleTogglePermission = (permissionId: string, currentlyEnabled: boolean) => {
    togglePermission.mutate({ permissionId, enabled: currentlyEnabled });
  };

  const isPermissionEnabled = (permissionId: string) => {
    return rolePermissions.some(rp => rp.permission_id === permissionId);
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const filteredCategories = Object.entries(groupedPermissions).reduce((acc, [category, perms]) => {
    const filtered = perms.filter(p =>
      p.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, Permission[]>);

  const getRoleColor = (roleKey: string) => {
    const role = roles.find(r => r.role_key === roleKey);
    return role?.color || "#6b7280";
  };

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHelp
        title="Permission Management"
        description="Configure role-based permissions across the entire system. Define what each role can and cannot do by enabling or disabling specific permissions."
        features={[
          "Granular permission control for all modules",
          "Role-based access configuration",
          "Dynamic permission detection for new features",
          "Category-based permission organization",
        ]}
        tips={[
          "Review permissions regularly to ensure security",
          "Test permission changes with a test user account",
          "Document custom permission configurations",
          "System permissions cannot be deleted for security",
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Permission Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure role-based permissions and access control
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Manage Roles</TabsTrigger>
          <TabsTrigger value="configure">Configure Permissions</TabsTrigger>
          <TabsTrigger value="overview">Permission Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Role Management</CardTitle>
                  <CardDescription>
                    Create and manage custom roles for your organization
                  </CardDescription>
                </div>
                <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { resetRoleForm(); setEditingRole(null); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                      <DialogDescription>
                        Define a new role with custom permissions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="role_key">Role Key *</Label>
                        <Input
                          id="role_key"
                          placeholder="e.g., manager, supervisor"
                          value={roleFormData.role_key}
                          onChange={(e) => setRoleFormData({ ...roleFormData, role_key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Unique identifier (lowercase, no spaces)
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="role_name">Role Name *</Label>
                        <Input
                          id="role_name"
                          placeholder="e.g., Manager, Supervisor"
                          value={roleFormData.role_name}
                          onChange={(e) => setRoleFormData({ ...roleFormData, role_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          placeholder="Describe this role's purpose"
                          value={roleFormData.description}
                          onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="color">Color</Label>
                        <Input
                          id="color"
                          type="color"
                          value={roleFormData.color}
                          onChange={(e) => setRoleFormData({ ...roleFormData, color: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateRole} disabled={!roleFormData.role_key || !roleFormData.role_name}>
                        Create Role
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRoles ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        Loading roles...
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: role.color }}
                            />
                            <span className="font-medium">{role.role_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{role.role_key}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {role.description || "-"}
                        </TableCell>
                        <TableCell>
                          {role.is_system && (
                            <Badge variant="secondary">System</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog open={editingRole?.id === role.id} onOpenChange={(open) => !open && setEditingRole(null)}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRole(role)}
                                  disabled={role.is_system}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Role</DialogTitle>
                                  <DialogDescription>
                                    Update role details
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="edit_role_name">Role Name *</Label>
                                    <Input
                                      id="edit_role_name"
                                      value={roleFormData.role_name}
                                      onChange={(e) => setRoleFormData({ ...roleFormData, role_name: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit_description">Description</Label>
                                    <Input
                                      id="edit_description"
                                      value={roleFormData.description}
                                      onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit_color">Color</Label>
                                    <Input
                                      id="edit_color"
                                      type="color"
                                      value={roleFormData.color}
                                      onChange={(e) => setRoleFormData({ ...roleFormData, color: e.target.value })}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEditingRole(null)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handleUpdateRole}>
                                    Update Role
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role)}
                              disabled={role.is_system}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>

        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Permission Configuration</CardTitle>
              <CardDescription>
                Select a role and configure its permissions
              </CardDescription>
              <div className="flex gap-4 mt-4">
                <div className="flex-1">
                  <Label>Select Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role to configure" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.role_key}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: role.color }}
                            />
                            {role.role_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Search Permissions</Label>
                  <Input
                    placeholder="Search by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!selectedRole ? (
                <div className="text-center py-8 text-muted-foreground">
                  Please select a role to configure permissions
                </div>
              ) : loadingPermissions || loadingRolePermissions ? (
                <div className="text-center py-8">Loading permissions...</div>
              ) : (
                Object.entries(filteredCategories).map(([category, perms]) => (
                  <div key={category} className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Lock className="h-5 w-5" />
                      {category}
                    </h3>
                    <div className="grid gap-4">
                      {perms.map((permission) => {
                        const enabled = isPermissionEnabled(permission.id);
                        return (
                          <div
                            key={permission.id}
                            className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <Checkbox
                              id={permission.id}
                              checked={enabled}
                              onCheckedChange={() => handleTogglePermission(permission.id, enabled)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={permission.id}
                                className="text-base font-medium cursor-pointer"
                              >
                                {permission.permission_name}
                              </Label>
                              <p className="text-sm text-muted-foreground mt-1">
                                {permission.description}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {permission.module_name}
                                </Badge>
                                <Badge variant="outline" className="text-xs font-mono">
                                  {permission.permission_key}
                                </Badge>
                                {permission.is_system && (
                                  <Badge variant="secondary" className="text-xs">
                                    System
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All System Permissions</CardTitle>
              <CardDescription>
                Complete list of available permissions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>System</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{permission.permission_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {permission.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{permission.module_name}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {permission.permission_key}
                      </TableCell>
                      <TableCell>{permission.category}</TableCell>
                      <TableCell>
                        {permission.is_system && (
                          <Badge variant="secondary">System</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
