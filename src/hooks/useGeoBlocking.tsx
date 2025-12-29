import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GeoLocation {
  country: string;
  country_code: string;
  city?: string;
  region?: string;
  allowed: boolean;
  action: 'allowed' | 'blocked' | 'challenge';
  reason?: string;
  challenge_required?: boolean;
}

export function useGeoBlocking() {
  const [loading, setLoading] = useState(false);
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  const checkGeoAccess = useCallback(async (companyId?: string): Promise<GeoLocation | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('geo-blocking', {
        body: { 
          company_id: companyId,
          request_path: window.location.pathname
        }
      });

      if (error) throw error;

      const result: GeoLocation = {
        country: data.country || 'Unknown',
        country_code: data.country_code || 'XX',
        city: data.city,
        region: data.region,
        allowed: data.allowed !== false,
        action: data.action || 'allowed',
        reason: data.reason,
        challenge_required: data.challenge_required
      };

      setGeoLocation(result);
      setIsBlocked(!result.allowed);

      return result;
    } catch (error) {
      console.error('Geo-blocking check failed:', error);
      // Fail open
      const fallback: GeoLocation = {
        country: 'Unknown',
        country_code: 'XX',
        allowed: true,
        action: 'allowed',
        reason: 'Geo-blocking unavailable'
      };
      setGeoLocation(fallback);
      setIsBlocked(false);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    geoLocation,
    isBlocked,
    checkGeoAccess
  };
}
