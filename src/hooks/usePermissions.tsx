import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const usePermissions = () => {
  const { user } = useAuth();

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('has_permission', { 
          _user_id: user.id, 
          _permission_key: '' 
        });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const hasPermission = async (permissionKey: string): Promise<boolean> => {
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

  const checkMultiplePermissions = async (permissionKeys: string[]): Promise<Record<string, boolean>> => {
    const results: Record<string, boolean> = {};
    
    for (const key of permissionKeys) {
      results[key] = await hasPermission(key);
    }
    
    return results;
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    checkMultiplePermissions
  };
};
