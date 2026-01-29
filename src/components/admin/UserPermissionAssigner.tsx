import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Search, Shield, Key, Calendar, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Permission {
  id: string;
  module_name: string;
  permission_key: string;
  permission_name: string;
  description: string;
  category: string;
  is_system: boolean;
}

interface UserPermissionRecord {
  id: string;
  permission_id: string;
  user_id: string;
  is_active: boolean;
  expires_at: string | null;
  granted_at: string;
  permission?: Permission;
}

interface UserPermissionAssignerProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function UserPermissionAssigner({
  userId,
  userName,
  isOpen,
  onClose,
}: UserPermissionAssignerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expirationDays, setExpirationDays] = useState<string>('');

  // Fetch all permissions
  const { data: allPermissions = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['all-permissions'],
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

  // Fetch user's direct permissions
  const { data: userPermissions = [], isLoading: loadingUserPermissions } = useQuery({
    queryKey: ['user-direct-permissions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*, permissions(*)')
        .eq('user_id', userId);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!userId,
  });

  // Fetch user's role-based permissions
  const { data: rolePermissions = [] } = useQuery({
    queryKey: ['user-role-permissions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_permissions', { _user_id: userId });
      if (error) throw error;
      return (data || []).filter((p: any) => p.source.startsWith('role:'));
    },
    enabled: !!userId,
  });

  // Grant permission mutation
  const grantPermission = useMutation({
    mutationFn: async ({ permissionId }: { permissionId: string }) => {
      const insertData: any = {
        user_id: userId,
        permission_id: permissionId,
        granted_by: user?.id,
        is_active: true,
      };

      if (expirationDays && parseInt(expirationDays) > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(expirationDays));
        insertData.expires_at = expiresAt.toISOString();
      }

      const { error } = await supabase
        .from('user_permissions')
        .insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-direct-permissions', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-all-permissions', userId] });
      toast.success('Permission granted');
    },
    onError: (error: any) => {
      toast.error('Failed to grant permission: ' + error.message);
    },
  });

  // Revoke permission mutation
  const revokePermission = useMutation({
    mutationFn: async ({ permissionId }: { permissionId: string }) => {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('permission_id', permissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-direct-permissions', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-all-permissions', userId] });
      toast.success('Permission revoked');
    },
    onError: (error: any) => {
      toast.error('Failed to revoke permission: ' + error.message);
    },
  });

  // Toggle permission active state
  const togglePermissionActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('user_permissions')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-direct-permissions', userId] });
      toast.success('Permission updated');
    },
  });

  // Get unique categories
  const categories = ['all', ...new Set(allPermissions.map(p => p.category))];

  // Filter permissions
  const filteredPermissions = allPermissions.filter(p => {
    const matchesSearch = 
      p.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.permission_key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Check if permission is granted directly
  const isDirectlyGranted = (permissionId: string) => {
    return userPermissions.some(up => up.permission_id === permissionId && up.is_active);
  };

  // Check if permission is granted via role
  const isGrantedViaRole = (permissionKey: string) => {
    return rolePermissions.some((rp: any) => rp.permission_key === permissionKey);
  };

  // Get direct permission record
  const getDirectPermission = (permissionId: string) => {
    return userPermissions.find(up => up.permission_id === permissionId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Manage Permissions for {userName}
          </DialogTitle>
          <DialogDescription>
            Assign or revoke individual permissions. Permissions from roles are shown but cannot be modified here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">
                Expires in:
              </Label>
              <Input
                type="number"
                placeholder="Days"
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                className="w-20"
                min="0"
              />
            </div>
          </div>

          {/* Current Direct Permissions */}
          {userPermissions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Direct Permissions ({userPermissions.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {userPermissions.map(up => (
                  <Badge
                    key={up.id}
                    variant={up.is_active ? 'default' : 'secondary'}
                    className="flex items-center gap-1"
                  >
                    {up.permissions?.permission_name}
                    {up.expires_at && (
                      <span className="text-xs opacity-70">
                        <Calendar className="h-3 w-3 inline" />
                      </span>
                    )}
                    <button
                      onClick={() => revokePermission.mutate({ permissionId: up.permission_id })}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Permission List */}
          <ScrollArea className="h-[400px] pr-4">
            {loadingPermissions || loadingUserPermissions ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading permissions...
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                      {category}
                    </h4>
                    <div className="grid gap-2">
                      {perms.map(permission => {
                        const directPerm = getDirectPermission(permission.id);
                        const isDirectGrant = isDirectlyGranted(permission.id);
                        const isRoleGrant = isGrantedViaRole(permission.permission_key);
                        const hasPermission = isDirectGrant || isRoleGrant;

                        return (
                          <div
                            key={permission.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              hasPermission ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={permission.id}
                                checked={isDirectGrant}
                                disabled={isRoleGrant}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    grantPermission.mutate({ permissionId: permission.id });
                                  } else if (directPerm) {
                                    revokePermission.mutate({ permissionId: permission.id });
                                  }
                                }}
                              />
                              <div>
                                <Label
                                  htmlFor={permission.id}
                                  className="font-medium cursor-pointer"
                                >
                                  {permission.permission_name}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                                <code className="text-xs text-muted-foreground">
                                  {permission.permission_key}
                                </code>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isRoleGrant && (
                                <Badge variant="outline" className="text-xs">
                                  Via Role
                                </Badge>
                              )}
                              {isDirectGrant && (
                                <Badge variant="default" className="text-xs">
                                  Direct
                                </Badge>
                              )}
                              {directPerm?.expires_at && (
                                <Badge variant="secondary" className="text-xs">
                                  Expires: {new Date(directPerm.expires_at).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
