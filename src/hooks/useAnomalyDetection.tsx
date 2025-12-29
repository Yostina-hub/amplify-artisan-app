import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
}

interface AnomalyStatus {
  is_locked: boolean;
  locked_until?: string;
  active_anomalies: number;
  anomalies: any[];
}

interface LoginCheckResult {
  success: boolean;
  anomalies_detected: number;
  anomalies: Anomaly[];
  requires_verification: boolean;
}

export function useAnomalyDetection() {
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  const checkLoginAnomaly = useCallback(async (
    userId: string,
    options?: {
      latitude?: number;
      longitude?: number;
      country_code?: string;
      city?: string;
      device_fingerprint?: string;
    }
  ): Promise<LoginCheckResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('anomaly-detection', {
        body: {
          action: 'check_login',
          user_id: userId,
          ...options
        }
      });

      if (error) throw error;

      setAnomalies(data.anomalies || []);
      return data;
    } catch (error) {
      console.error('Anomaly check failed:', error);
      return { success: true, anomalies_detected: 0, anomalies: [], requires_verification: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const trackFailedLogin = useCallback(async (
    identifier: string,
    identifierType: 'email' | 'user_id' | 'ip',
    failureReason?: string
  ) => {
    try {
      const body: Record<string, any> = {
        action: 'track_failure',
        failure_reason: failureReason
      };

      if (identifierType === 'email') body.email = identifier;
      else if (identifierType === 'user_id') body.user_id = identifier;
      else body.ip_address = identifier;

      const { data, error } = await supabase.functions.invoke('anomaly-detection', { body });

      if (error) throw error;

      setIsLocked(data.locked);
      return data;
    } catch (error) {
      console.error('Failed to track login failure:', error);
      return { locked: false };
    }
  }, []);

  const getStatus = useCallback(async (userId: string): Promise<AnomalyStatus> => {
    try {
      const { data, error } = await supabase.functions.invoke('anomaly-detection', {
        body: { action: 'get_status', user_id: userId }
      });

      if (error) throw error;

      setIsLocked(data.is_locked);
      setAnomalies(data.anomalies || []);
      return data;
    } catch (error) {
      console.error('Failed to get status:', error);
      return { is_locked: false, active_anomalies: 0, anomalies: [] };
    }
  }, []);

  const clearLockout = useCallback(async (identifier: string, type: 'email' | 'user_id') => {
    try {
      const body = type === 'email' ? { action: 'clear_lockout', email: identifier } 
                                     : { action: 'clear_lockout', user_id: identifier };
      
      const { error } = await supabase.functions.invoke('anomaly-detection', { body });
      if (error) throw error;
      
      setIsLocked(false);
      return { success: true };
    } catch (error) {
      console.error('Failed to clear lockout:', error);
      return { success: false };
    }
  }, []);

  // Generate device fingerprint
  const generateFingerprint = useCallback((): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('fingerprint', 2, 2);
    }
    
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      canvas.toDataURL()
    ].join('|');

    // Simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }, []);

  return {
    loading,
    isLocked,
    anomalies,
    checkLoginAnomaly,
    trackFailedLogin,
    getStatus,
    clearLockout,
    generateFingerprint
  };
}
