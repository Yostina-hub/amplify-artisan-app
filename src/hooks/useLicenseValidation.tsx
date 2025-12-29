import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LicenseInfo {
  isValid: boolean;
  licenseType: 'trial' | 'basic' | 'pro' | 'enterprise' | 'invalid';
  expiresAt?: Date;
  allowedDomains: string[];
  features: string[];
  maxUsers?: number;
  currentUsers?: number;
}

interface DomainValidationResult {
  isAllowed: boolean;
  reason?: string;
}

export const useLicenseValidation = (companyId?: string) => {
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLicenseInfo = useCallback(async (): Promise<LicenseInfo> => {
    if (!companyId) {
      return {
        isValid: false,
        licenseType: 'invalid',
        allowedDomains: [],
        features: []
      };
    }

    try {
      // Fetch company and subscription info
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select(`
          *,
          pricing_plans (*)
        `)
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Check for active subscription
      const { data: subscription } = await supabase
        .from('subscription_requests')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Determine license type and validity
      const plan = company?.pricing_plans;
      const isTrial = subscription?.is_trial || false;
      const trialEndsAt = subscription?.trial_ends_at;
      const isTrialValid = isTrial && trialEndsAt && new Date(trialEndsAt) > new Date();

      let licenseType: LicenseInfo['licenseType'] = 'invalid';
      if (isTrialValid) {
        licenseType = 'trial';
      } else if (plan) {
        const planName = plan.name?.toLowerCase() || '';
        if (planName.includes('enterprise')) licenseType = 'enterprise';
        else if (planName.includes('pro')) licenseType = 'pro';
        else if (planName.includes('basic')) licenseType = 'basic';
        else licenseType = 'basic';
      }

      // Get allowed domains from company settings
      const allowedDomains = extractAllowedDomains(company);

      // Get feature list based on plan
      const features = getFeaturesByPlan(licenseType);

      // Count current users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      return {
        isValid: licenseType !== 'invalid' && company?.status === 'approved',
        licenseType,
        expiresAt: trialEndsAt ? new Date(trialEndsAt) : undefined,
        allowedDomains,
        features,
        maxUsers: getDefaultMaxUsers(licenseType),
        currentUsers: userCount || 0
      };
    } catch (err) {
      console.error('License validation error:', err);
      return {
        isValid: false,
        licenseType: 'invalid',
        allowedDomains: [],
        features: []
      };
    }
  }, [companyId]);

  const extractAllowedDomains = (company: any): string[] => {
    const domains: string[] = [];
    
    if (company?.website) {
      try {
        const url = new URL(company.website.startsWith('http') 
          ? company.website 
          : `https://${company.website}`);
        domains.push(url.hostname);
      } catch {}
    }
    
    // Add common variations
    domains.forEach(domain => {
      if (domain.startsWith('www.')) {
        domains.push(domain.replace('www.', ''));
      } else {
        domains.push(`www.${domain}`);
      }
    });

    // Always allow localhost for development
    domains.push('localhost', '127.0.0.1');

    return [...new Set(domains)];
  };

  const getFeaturesByPlan = (planType: LicenseInfo['licenseType']): string[] => {
    const baseFeatures = ['crm', 'contacts', 'leads'];
    
    switch (planType) {
      case 'trial':
        return [...baseFeatures, 'reports', 'email'];
      case 'basic':
        return [...baseFeatures, 'reports', 'email', 'calendar'];
      case 'pro':
        return [...baseFeatures, 'reports', 'email', 'calendar', 'automation', 'api', 'analytics'];
      case 'enterprise':
        return [...baseFeatures, 'reports', 'email', 'calendar', 'automation', 'api', 'analytics', 'custom_branding', 'sso', 'audit_logs'];
      default:
        return [];
    }
  };

  const getDefaultMaxUsers = (planType: LicenseInfo['licenseType']): number => {
    switch (planType) {
      case 'trial': return 5;
      case 'basic': return 10;
      case 'pro': return 50;
      case 'enterprise': return 1000;
      default: return 0;
    }
  };

  const validateCurrentDomain = useCallback((): DomainValidationResult => {
    if (!licenseInfo) {
      return { isAllowed: false, reason: 'License not loaded' };
    }

    const currentDomain = window.location.hostname;
    
    // Always allow localhost
    if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
      return { isAllowed: true };
    }

    // Allow lovable.app domains
    if (currentDomain.endsWith('.lovable.app')) {
      return { isAllowed: true };
    }

    // Check against allowed domains
    if (licenseInfo.allowedDomains.length === 0) {
      return { isAllowed: true }; // No restrictions if no domains configured
    }

    const isAllowed = licenseInfo.allowedDomains.some(domain => 
      currentDomain === domain || currentDomain.endsWith(`.${domain}`)
    );

    return {
      isAllowed,
      reason: isAllowed ? undefined : `Domain ${currentDomain} is not authorized for this license`
    };
  }, [licenseInfo]);

  const hasFeature = useCallback((feature: string): boolean => {
    return licenseInfo?.features.includes(feature) || false;
  }, [licenseInfo]);

  const canAddUser = useCallback((): boolean => {
    if (!licenseInfo) return false;
    if (!licenseInfo.maxUsers) return true;
    return (licenseInfo.currentUsers || 0) < licenseInfo.maxUsers;
  }, [licenseInfo]);

  const getDaysUntilExpiry = useCallback((): number | null => {
    if (!licenseInfo?.expiresAt) return null;
    const now = new Date();
    const expiry = new Date(licenseInfo.expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [licenseInfo]);

  useEffect(() => {
    if (companyId) {
      setIsLoading(true);
      fetchLicenseInfo()
        .then(setLicenseInfo)
        .catch(err => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [companyId, fetchLicenseInfo]);

  return {
    licenseInfo,
    isLoading,
    error,
    validateCurrentDomain,
    hasFeature,
    canAddUser,
    getDaysUntilExpiry,
    refresh: fetchLicenseInfo
  };
};
