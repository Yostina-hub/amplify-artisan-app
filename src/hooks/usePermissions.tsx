import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UserPermission {
  permission_key: string;
  permission_name: string;
  source: string;
}

export const usePermissions = () => {
  const { user, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all user permissions (role-based + direct)
  const { data: permissions = [], isLoading, refetch } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_user_permissions', { _user_id: user.id });

      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }
      return (data || []) as UserPermission[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Check if user has a specific permission (sync - uses cached data)
  const hasPermissionSync = (permissionKey: string): boolean => {
    if (isSuperAdmin) return true;
    if (!user?.id) return false;
    return permissions.some(p => p.permission_key === permissionKey);
  };

  // Check permission asynchronously (calls database)
  const hasPermission = async (permissionKey: string): Promise<boolean> => {
    if (isSuperAdmin) return true;
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .rpc('has_permission', {
          _user_id: user.id,
          _permission_key: permissionKey
        });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  // Check multiple permissions at once
  const checkMultiplePermissions = async (permissionKeys: string[]): Promise<Record<string, boolean>> => {
    if (isSuperAdmin) {
      return permissionKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {});
    }
    
    const results: Record<string, boolean> = {};
    
    for (const key of permissionKeys) {
      results[key] = hasPermissionSync(key);
    }
    
    return results;
  };

  // Get permissions grouped by source
  const getPermissionsBySource = () => {
    const grouped: Record<string, UserPermission[]> = {};
    
    permissions.forEach(perm => {
      if (!grouped[perm.source]) {
        grouped[perm.source] = [];
      }
      grouped[perm.source].push(perm);
    });
    
    return grouped;
  };

  // Invalidate and refetch permissions
  const invalidatePermissions = () => {
    queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    hasPermissionSync,
    checkMultiplePermissions,
    getPermissionsBySource,
    invalidatePermissions,
    refetch,
  };
};
