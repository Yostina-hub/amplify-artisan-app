import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ModuleAccessState {
  crmEnabled: boolean;
  salesEnabled: boolean;
  toolsEnabled: boolean;
  loading: boolean;
  toggleModule: (companyId: string, module: 'crm' | 'sales' | 'tools', enabled: boolean) => Promise<boolean>;
  refetch: () => void;
}

export function useCRMAccess(): ModuleAccessState {
  const { user, isSuperAdmin } = useAuth();
  const [crmEnabled, setCrmEnabled] = useState(false);
  const [salesEnabled, setSalesEnabled] = useState(false);
  const [toolsEnabled, setToolsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchModuleStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get user's company ID from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        // Super admin without company - all modules available for management
        if (isSuperAdmin) {
          setCrmEnabled(true);
          setSalesEnabled(true);
          setToolsEnabled(true);
        }
        setLoading(false);
        return;
      }

      // Fetch company's module status
      const { data: company, error } = await supabase
        .from('companies')
        .select('crm_enabled, sales_enabled, tools_enabled')
        .eq('id', profile.company_id)
        .single();

      if (error) {
        console.error('Error fetching module status:', error);
        setCrmEnabled(false);
        setSalesEnabled(false);
        setToolsEnabled(false);
      } else {
        setCrmEnabled(company?.crm_enabled ?? false);
        setSalesEnabled(company?.sales_enabled ?? false);
        setToolsEnabled(company?.tools_enabled ?? false);
      }
    } catch (error) {
      console.error('Error in useCRMAccess:', error);
      setCrmEnabled(false);
      setSalesEnabled(false);
      setToolsEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModuleStatus();
  }, [user, isSuperAdmin]);

  const toggleModule = async (companyId: string, module: 'crm' | 'sales' | 'tools', enabled: boolean): Promise<boolean> => {
    if (!isSuperAdmin) {
      console.error('Only super admins can toggle modules');
      return false;
    }

    try {
      const updateData = 
        module === 'crm' ? { crm_enabled: enabled } :
        module === 'sales' ? { sales_enabled: enabled } :
        { tools_enabled: enabled };

      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId);

      if (error) {
        console.error('Error toggling module:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in toggleModule:', error);
      return false;
    }
  };

  return {
    crmEnabled,
    salesEnabled,
    toolsEnabled,
    loading,
    toggleModule,
    refetch: fetchModuleStatus,
  };
}
