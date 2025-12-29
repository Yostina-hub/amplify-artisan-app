import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NetworkInfo {
  ip: string;
  isVPN: boolean;
  isTor: boolean;
  isProxy: boolean;
  isDatacenter: boolean;
  country: string;
  city: string;
  isp: string;
  riskScore: number;
}

interface NetworkRestrictionResult {
  allowed: boolean;
  reason?: string;
  requiresVerification?: boolean;
}

export const useNetworkRestriction = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const detectNetworkType = useCallback(async (): Promise<NetworkInfo> => {
    try {
      // Get IP info from a public API
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      // Heuristics for VPN/Proxy detection
      const isDatacenter = detectDatacenter(data.org || '');
      const isVPN = detectVPN(data);
      const isTor = detectTor(data.ip);
      const isProxy = detectProxy(data);
      
      const riskScore = calculateRiskScore({
        isVPN,
        isTor,
        isProxy,
        isDatacenter
      });

      return {
        ip: data.ip,
        isVPN,
        isTor,
        isProxy,
        isDatacenter,
        country: data.country_code || 'Unknown',
        city: data.city || 'Unknown',
        isp: data.org || 'Unknown',
        riskScore
      };
    } catch (error) {
      console.error('Network detection failed:', error);
      return {
        ip: 'Unknown',
        isVPN: false,
        isTor: false,
        isProxy: false,
        isDatacenter: false,
        country: 'Unknown',
        city: 'Unknown',
        isp: 'Unknown',
        riskScore: 0
      };
    }
  }, []);

  const detectDatacenter = (org: string): boolean => {
    const datacenterKeywords = [
      'amazon', 'aws', 'google', 'microsoft', 'azure', 'digitalocean',
      'linode', 'vultr', 'ovh', 'hetzner', 'cloudflare', 'akamai',
      'hosting', 'server', 'cloud', 'datacenter', 'data center'
    ];
    const lowerOrg = org.toLowerCase();
    return datacenterKeywords.some(keyword => lowerOrg.includes(keyword));
  };

  const detectVPN = (data: any): boolean => {
    const vpnIndicators = [
      'vpn', 'private', 'tunnel', 'nord', 'express', 'surfshark',
      'mullvad', 'proton', 'cyberghost', 'pia', 'ipvanish'
    ];
    const lowerOrg = (data.org || '').toLowerCase();
    return vpnIndicators.some(indicator => lowerOrg.includes(indicator));
  };

  const detectTor = (ip: string): boolean => {
    // Basic Tor exit node detection (would need a real Tor exit list in production)
    return false;
  };

  const detectProxy = (data: any): boolean => {
    const proxyIndicators = ['proxy', 'anonymizer', 'hide', 'mask'];
    const lowerOrg = (data.org || '').toLowerCase();
    return proxyIndicators.some(indicator => lowerOrg.includes(indicator));
  };

  const calculateRiskScore = (flags: {
    isVPN: boolean;
    isTor: boolean;
    isProxy: boolean;
    isDatacenter: boolean;
  }): number => {
    let score = 0;
    if (flags.isVPN) score += 30;
    if (flags.isTor) score += 50;
    if (flags.isProxy) score += 25;
    if (flags.isDatacenter) score += 20;
    return Math.min(score, 100);
  };

  const checkNetworkRestrictions = useCallback(async (
    companyId?: string
  ): Promise<NetworkRestrictionResult> => {
    setIsLoading(true);
    try {
      const info = await detectNetworkType();
      setNetworkInfo(info);

      // Log the network check
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('access_logs').insert({
          user_id: user.id,
          company_id: companyId,
          ip_address: info.ip,
          is_blocked: info.riskScore >= 70,
          block_reason: info.riskScore >= 70 
            ? `High risk network detected: ${getNetworkFlags(info).join(', ')}`
            : null,
          request_path: window.location.pathname,
          user_agent: navigator.userAgent
        });
      }

      // Apply restrictions based on risk score
      if (info.isTor) {
        return {
          allowed: false,
          reason: 'Tor network connections are not allowed for security reasons.'
        };
      }

      if (info.riskScore >= 70) {
        return {
          allowed: false,
          reason: 'High-risk network detected. Please use a standard internet connection.',
          requiresVerification: true
        };
      }

      if (info.riskScore >= 40) {
        return {
          allowed: true,
          reason: 'Network flagged for monitoring.',
          requiresVerification: true
        };
      }

      return { allowed: true };
    } finally {
      setIsLoading(false);
    }
  }, [detectNetworkType]);

  const getNetworkFlags = (info: NetworkInfo): string[] => {
    const flags: string[] = [];
    if (info.isVPN) flags.push('VPN');
    if (info.isTor) flags.push('Tor');
    if (info.isProxy) flags.push('Proxy');
    if (info.isDatacenter) flags.push('Datacenter');
    return flags;
  };

  useEffect(() => {
    detectNetworkType().then(setNetworkInfo);
  }, [detectNetworkType]);

  return {
    networkInfo,
    isLoading,
    checkNetworkRestrictions,
    getNetworkFlags: networkInfo ? () => getNetworkFlags(networkInfo) : () => []
  };
};
