import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface CRMAccessState {
  crmEnabled: boolean;
  loading: boolean;
  toggleCRM: (companyId: string, enabled: boolean) => Promise<boolean>;
  refetch: () => void;
}

export function useCRMAccess(): CRMAccessState {
  const { user, isSuperAdmin, rolesDetailed } = useAuth();
  const [crmEnabled, setCrmEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCRMStatus = async () => {
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
        // Super admin without company - CRM is available for management
        if (isSuperAdmin) {
          setCrmEnabled(true);
        }
        setLoading(false);
        return;
      }

      // Fetch company's CRM status
      const { data: company, error } = await supabase
        .from('companies')
        .select('crm_enabled')
        .eq('id', profile.company_id)
        .single();

      if (error) {
        console.error('Error fetching CRM status:', error);
        setCrmEnabled(false);
      } else {
        setCrmEnabled(company?.crm_enabled ?? false);
      }
    } catch (error) {
      console.error('Error in useCRMAccess:', error);
      setCrmEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRMStatus();
  }, [user, isSuperAdmin]);

  const toggleCRM = async (companyId: string, enabled: boolean): Promise<boolean> => {
    if (!isSuperAdmin) {
      console.error('Only super admins can toggle CRM');
      return false;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .update({ crm_enabled: enabled })
        .eq('id', companyId);

      if (error) {
        console.error('Error toggling CRM:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in toggleCRM:', error);
      return false;
    }
  };

  return {
    crmEnabled,
    loading,
    toggleCRM,
    refetch: fetchCRMStatus,
  };
}
