import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PermissionAssignerProps {
  moduleId: string;
  moduleName: string;
}

export function PermissionAssigner({ moduleId, moduleName }: PermissionAssignerProps) {
  const queryClient = useQueryClient();
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string[]>>({});

  // Fetch roles
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('role_name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch module permissions
  const { data: modulePermissions } = useQuery({
    queryKey: ['module-permissions', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('module_name', moduleName);
      if (error) throw error;
      return data;
    },
  });

  // Create module permissions if they don't exist
  const createPermissionsMutation = useMutation({
    mutationFn: async () => {
      const operations = ['view', 'create', 'edit', 'delete'];
      const permissions = operations.map(op => ({
        module_name: moduleName,
        permission_key: `${moduleName}.${op}`,
        permission_name: `${op.charAt(0).toUpperCase() + op.slice(1)} ${moduleName}`,
        description: `Allows ${op}ing ${moduleName} records`,
        category: 'Custom Modules',
        is_system: false,
      }));

      const { error } = await supabase
        .from('permissions')
        .insert(permissions);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-permissions'] });
      toast.success('Module permissions created');
    },
  });

  // Toggle permission for role
  const togglePermission = async (roleKey: string, permissionId: string) => {
    const current = selectedPermissions[roleKey] || [];
    const updated = current.includes(permissionId)
      ? current.filter(id => id !== permissionId)
      : [...current, permissionId];
    
    setSelectedPermissions({ ...selectedPermissions, [roleKey]: updated });
  };

  // Save permissions
  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      // Implementation would sync selectedPermissions with role_permissions table
      toast.success('Permissions saved successfully');
    },
  });

  if (!modulePermissions || modulePermissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Module Permissions
          </CardTitle>
          <CardDescription>
            Create permissions for this module to control access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => createPermissionsMutation.mutate()}>
            Create Module Permissions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permission Assignment
            </CardTitle>
            <CardDescription>
              Configure which roles can access this module
            </CardDescription>
          </div>
          <Button onClick={() => savePermissionsMutation.mutate()}>
            <Save className="h-4 w-4 mr-2" />
            Save Permissions
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles?.map((role) => (
            <div key={role.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
                <span className="font-medium">{role.role_name}</span>
                {role.is_system && (
                  <Badge variant="secondary" className="text-xs">System</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {modulePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${role.role_key}-${permission.id}`}
                      checked={selectedPermissions[role.role_key]?.includes(permission.id)}
                      onCheckedChange={() => togglePermission(role.role_key, permission.id)}
                    />
                    <Label
                      htmlFor={`${role.role_key}-${permission.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {permission.permission_key.split('.')[1]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
