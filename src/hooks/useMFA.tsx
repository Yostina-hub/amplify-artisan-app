import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MFAStatus {
  mfa_enabled: boolean;
  preferred_method: 'email' | 'sms' | 'authenticator';
  last_mfa_at: string | null;
}

interface OTPResponse {
  success?: boolean;
  error?: string;
  message?: string;
  remaining?: number;
  blocked_until?: string;
  expires_in?: number;
  attempts_remaining?: number;
  verified_at?: string;
  dev_code?: string;
}

export function useMFA() {
  const [loading, setLoading] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const { toast } = useToast();

  const checkMFAStatus = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('mfa-otp', {
        body: { action: 'status', user_id: userId }
      });

      if (error) throw error;
      setMfaStatus(data);
      return data as MFAStatus;
    } catch (error) {
      console.error('Error checking MFA status:', error);
      return null;
    }
  }, []);

  const enableMFA = useCallback(async (userId: string, method: 'email' | 'sms' = 'email') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mfa-otp', {
        body: { action: 'enable', user_id: userId, delivery_method: method }
      });

      if (error) throw error;

      setMfaStatus(prev => prev ? { ...prev, mfa_enabled: true, preferred_method: method } : null);
      toast({
        title: 'MFA Enabled',
        description: 'Two-factor authentication has been enabled for your account.',
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to enable MFA',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const disableMFA = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mfa-otp', {
        body: { action: 'disable', user_id: userId }
      });

      if (error) throw error;

      setMfaStatus(prev => prev ? { ...prev, mfa_enabled: false } : null);
      toast({
        title: 'MFA Disabled',
        description: 'Two-factor authentication has been disabled.',
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disable MFA',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const requestOTP = useCallback(async (
    userId: string,
    purpose: 'login' | 'sensitive_action' | 'password_reset' = 'login'
  ) => {
    setLoading(true);
    setOtpSent(false);
    try {
      const { data, error } = await supabase.functions.invoke<OTPResponse>('mfa-otp', {
        body: { action: 'request', user_id: userId, purpose }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
        return { success: false, ...data };
      }

      setOtpSent(true);
      toast({
        title: 'Code Sent',
        description: 'A verification code has been sent to your email.',
      });

      return { success: true, ...data };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const verifyOTP = useCallback(async (
    userId: string,
    code: string,
    purpose: 'login' | 'sensitive_action' | 'password_reset' = 'login'
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<OTPResponse>('mfa-otp', {
        body: { action: 'verify', user_id: userId, code, purpose }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: 'Verification Failed',
          description: data.error,
          variant: 'destructive',
        });
        return { success: false, ...data };
      }

      setVerified(true);
      toast({
        title: 'Verified',
        description: 'Your identity has been verified.',
      });

      return { success: true, ...data };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify OTP',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resetState = useCallback(() => {
    setOtpSent(false);
    setVerified(false);
  }, []);

  return {
    loading,
    mfaStatus,
    otpSent,
    verified,
    checkMFAStatus,
    enableMFA,
    disableMFA,
    requestOTP,
    verifyOTP,
    resetState,
  };
}
