import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BehavioralData {
  mouseMovements: number;
  keystrokes: number;
  formFillTime: number;
  requestsPerMinute: number;
}

interface ThreatCheckResult {
  allowed: boolean;
  action: 'allow' | 'warn' | 'challenge' | 'throttle' | 'block';
  reason?: string;
  reputation_score?: number;
  threats_detected?: string[];
}

export const useThreatDetection = () => {
  const [behavioralData, setBehavioralData] = useState<BehavioralData>({
    mouseMovements: 0,
    keystrokes: 0,
    formFillTime: 0,
    requestsPerMinute: 0
  });
  const [formStartTime, setFormStartTime] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string>('');

  // Track mouse movements
  useEffect(() => {
    const handleMouseMove = () => {
      setBehavioralData(prev => ({
        ...prev,
        mouseMovements: prev.mouseMovements + 1
      }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Track keystrokes
  useEffect(() => {
    const handleKeyPress = () => {
      setBehavioralData(prev => ({
        ...prev,
        keystrokes: prev.keystrokes + 1
      }));
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  // Start tracking form fill time
  const startFormTracking = useCallback(() => {
    setFormStartTime(Date.now());
  }, []);

  // Get form fill time
  const getFormFillTime = useCallback(() => {
    if (!formStartTime) return 0;
    return Date.now() - formStartTime;
  }, [formStartTime]);

  // Check for threats
  const checkThreat = useCallback(async (options?: {
    honeypotValue?: string;
    honeypotField?: string;
    formName?: string;
    requestPath?: string;
  }): Promise<ThreatCheckResult> => {
    try {
      // Get client IP (in production, this should come from the server)
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      const { data: { user } } = await supabase.auth.getUser();
      
      let companyId: string | undefined;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        companyId = profile?.company_id || undefined;
      }

      const payload: Record<string, any> = {
        ip_address: ip,
        user_agent: navigator.userAgent,
        request_path: options?.requestPath || window.location.pathname,
        user_id: user?.id,
        company_id: companyId,
        behavioral_data: {
          session_id: sessionStorage.getItem('session_id') || crypto.randomUUID(),
          pattern_type: 'form_submission',
          pattern_data: {
            mouse_movements: behavioralData.mouseMovements,
            keystrokes: behavioralData.keystrokes,
            form_fill_time: getFormFillTime(),
            requests_per_minute: behavioralData.requestsPerMinute
          }
        }
      };

      // Add honeypot data if provided
      if (options?.honeypotValue !== undefined) {
        payload.honeypot_data = {
          field_name: options.honeypotField || 'hp_field',
          field_value: options.honeypotValue,
          form_name: options.formName,
          page_url: window.location.href
        };
      }

      const { data, error } = await supabase.functions.invoke('threat-detection', {
        body: payload
      });

      if (error) {
        console.error('Threat detection error:', error);
        return { allowed: true, action: 'allow' };
      }

      if (data.action === 'block') {
        setIsBlocked(true);
        setBlockReason(data.reason || 'Access denied');
      }

      return data as ThreatCheckResult;
    } catch (error) {
      console.error('Threat check failed:', error);
      return { allowed: true, action: 'allow' };
    }
  }, [behavioralData, getFormFillTime]);

  // Reset behavioral data
  const resetBehavioralData = useCallback(() => {
    setBehavioralData({
      mouseMovements: 0,
      keystrokes: 0,
      formFillTime: 0,
      requestsPerMinute: 0
    });
    setFormStartTime(null);
  }, []);

  return {
    behavioralData,
    isBlocked,
    blockReason,
    startFormTracking,
    checkThreat,
    resetBehavioralData
  };
};

// Honeypot component for forms
export const HoneypotField = ({ name = 'hp_field' }: { name?: string }) => {
  return (
    <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
      <input
        type="text"
        name={name}
        tabIndex={-1}
        autoComplete="off"
        data-honeypot="true"
      />
    </div>
  );
};
