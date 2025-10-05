import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Branch {
  id: string;
  company_id: string;
  parent_branch_id: string | null;
  name: string;
  code: string;
  branch_type: 'headquarters' | 'regional' | 'branch' | 'sub_branch';
  level: number;
  manager_id: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export const useBranches = () => {
  const { user } = useAuth();

  const { data: accessibleBranches = [], isLoading: loadingBranches } = useQuery({
    queryKey: ['accessible-branches', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_user_accessible_branches', { _user_id: user.id });

      if (error) throw error;

      // Fetch full branch details
      if (data && data.length > 0) {
        const branchIds = data.map((b: any) => b.branch_id);
        const { data: branches, error: branchError } = await supabase
          .from('branches')
          .select('*')
          .in('id', branchIds);

        if (branchError) throw branchError;
        return branches as Branch[];
      }

      return [];
    },
    enabled: !!user?.id,
  });

  const canAccessBranch = async (branchId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase
        .rpc('can_access_branch', {
          _user_id: user.id,
          _branch_id: branchId
        });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking branch access:', error);
      return false;
    }
  };

  const getBranchHierarchy = async (branchId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_branch_hierarchy', { branch_uuid: branchId });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting branch hierarchy:', error);
      return [];
    }
  };

  return {
    accessibleBranches,
    loadingBranches,
    canAccessBranch,
    getBranchHierarchy
  };
};
