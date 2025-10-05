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
import { toast } from "sonner";
import { Shield, Lock, Users } from "lucide-react";

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

export default function PermissionManagement() {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [selectedRole, setSelectedRole] = useState<"admin" | "agent" | "user">("user");
  const [searchTerm, setSearchTerm] = useState("");

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

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800",
      agent: "bg-blue-100 text-blue-800",
      user: "bg-green-100 text-green-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
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

      <Tabs defaultValue="configure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configure">Configure Permissions</TabsTrigger>
          <TabsTrigger value="overview">Permission Overview</TabsTrigger>
        </TabsList>

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
                  <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as "admin" | "agent" | "user")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="user">User</SelectItem>
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
              {loadingPermissions || loadingRolePermissions ? (
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
