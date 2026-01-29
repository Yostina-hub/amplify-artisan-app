import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserPermission {
  permission_key: string;
  permission_name: string;
  source: string;
}

export const usePermissionCheck = () => {
  const { user, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all user permissions (both role-based and direct)
  const { data: userPermissions = [], isLoading, refetch } = useQuery({
    queryKey: ['user-all-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_user_permissions', { _user_id: user.id });

      if (error) {
        console.error('Error fetching user permissions:', error);
        return [];
      }
      
      return (data || []) as UserPermission[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Check if user has a specific permission
  const hasPermission = useCallback((permissionKey: string): boolean => {
    // Super admins always have all permissions
    if (isSuperAdmin) return true;
    
    if (!user?.id) return false;
    
    return userPermissions.some(p => p.permission_key === permissionKey);
  }, [user?.id, userPermissions, isSuperAdmin]);

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback((permissionKeys: string[]): boolean => {
    if (isSuperAdmin) return true;
    if (!user?.id) return false;
    
    return permissionKeys.some(key => 
      userPermissions.some(p => p.permission_key === key)
    );
  }, [user?.id, userPermissions, isSuperAdmin]);

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback((permissionKeys: string[]): boolean => {
    if (isSuperAdmin) return true;
    if (!user?.id) return false;
    
    return permissionKeys.every(key => 
      userPermissions.some(p => p.permission_key === key)
    );
  }, [user?.id, userPermissions, isSuperAdmin]);

  // Check permission asynchronously (for cases where cache might be stale)
  const checkPermissionAsync = useCallback(async (permissionKey: string): Promise<boolean> => {
    if (isSuperAdmin) return true;
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .rpc('has_permission', {
          _user_id: user.id,
          _permission_key: permissionKey
        });

      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }, [user?.id, isSuperAdmin]);

  // Get permissions grouped by source
  const getPermissionsBySource = useCallback(() => {
    const grouped: Record<string, UserPermission[]> = {};
    
    userPermissions.forEach(perm => {
      if (!grouped[perm.source]) {
        grouped[perm.source] = [];
      }
      grouped[perm.source].push(perm);
    });
    
    return grouped;
  }, [userPermissions]);

  // Invalidate permissions cache (useful after role/permission changes)
  const invalidatePermissions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['user-all-permissions'] });
  }, [queryClient]);

  return {
    userPermissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermissionAsync,
    getPermissionsBySource,
    invalidatePermissions,
    refetch,
  };
};

// Hook to check a single permission with loading state
export const useHasPermission = (permissionKey: string) => {
  const { hasPermission, isLoading } = usePermissionCheck();
  
  return {
    hasPermission: hasPermission(permissionKey),
    isLoading,
  };
};

// Hook to check multiple permissions
export const useHasPermissions = (permissionKeys: string[]) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissionCheck();
  
  return {
    permissions: permissionKeys.reduce((acc, key) => {
      acc[key] = hasPermission(key);
      return acc;
    }, {} as Record<string, boolean>),
    hasAny: hasAnyPermission(permissionKeys),
    hasAll: hasAllPermissions(permissionKeys),
    isLoading,
  };
};
