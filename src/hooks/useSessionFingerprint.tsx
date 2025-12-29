import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FingerprintData {
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  language: string;
  platform: string;
  cookiesEnabled: boolean;
  doNotTrack: string | null;
  plugins: string[];
  canvas: string;
  webgl: string;
  fonts: string[];
}

interface SessionFingerprint {
  id: string;
  user_id: string;
  session_id: string;
  fingerprint_hash: string;
  fingerprint_data: FingerprintData;
  is_trusted: boolean;
  first_seen_at: string;
  last_seen_at: string;
}

export const useSessionFingerprint = () => {
  const [currentFingerprint, setCurrentFingerprint] = useState<string | null>(null);
  const [isNewDevice, setIsNewDevice] = useState(false);
  const [isSuspicious, setIsSuspicious] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generate a hash from string
  const hashString = async (str: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Generate canvas fingerprint
  const getCanvasFingerprint = (): string => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Security fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Security fingerprint', 4, 17);
      
      return canvas.toDataURL();
    } catch {
      return '';
    }
  };

  // Generate WebGL fingerprint
  const getWebGLFingerprint = (): string => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return '';
      
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        return `${vendor}~${renderer}`;
      }
      return '';
    } catch {
      return '';
    }
  };

  // Get installed fonts (basic detection)
  const getInstalledFonts = (): string[] => {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = [
      'Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Courier New',
      'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS',
      'Arial Black', 'Impact', 'Lucida Console', 'Tahoma', 'Geneva'
    ];
    
    const detectedFonts: string[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return detectedFonts;
    
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    
    const baseSizes: Record<string, number> = {};
    baseFonts.forEach(font => {
      ctx.font = `${testSize} ${font}`;
      baseSizes[font] = ctx.measureText(testString).width;
    });
    
    testFonts.forEach(font => {
      let detected = false;
      for (const baseFont of baseFonts) {
        ctx.font = `${testSize} "${font}", ${baseFont}`;
        const width = ctx.measureText(testString).width;
        if (width !== baseSizes[baseFont]) {
          detected = true;
          break;
        }
      }
      if (detected) {
        detectedFonts.push(font);
      }
    });
    
    return detectedFonts;
  };

  // Generate complete fingerprint
  const generateFingerprint = useCallback(async (): Promise<{ hash: string; data: FingerprintData }> => {
    const data: FingerprintData = {
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      plugins: Array.from(navigator.plugins).map(p => p.name),
      canvas: getCanvasFingerprint(),
      webgl: getWebGLFingerprint(),
      fonts: getInstalledFonts()
    };

    const fingerprintString = JSON.stringify(data);
    const hash = await hashString(fingerprintString);

    return { hash, data };
  }, []);

  // Validate session fingerprint
  const validateSession = useCallback(async (): Promise<{
    valid: boolean;
    isNewDevice: boolean;
    isSuspicious: boolean;
  }> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { valid: true, isNewDevice: false, isSuspicious: false };
      }

      const { hash, data } = await generateFingerprint();
      setCurrentFingerprint(hash);

      const sessionId = sessionStorage.getItem('session_id') || crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);

      // Check existing fingerprints for this user
      const { data: existingFingerprints } = await supabase
        .from('session_fingerprints')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen_at', { ascending: false });

      const matchingFingerprint = existingFingerprints?.find(
        fp => fp.fingerprint_hash === hash
      );

      if (matchingFingerprint) {
        // Update last seen
        await supabase
          .from('session_fingerprints')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', matchingFingerprint.id);

        // Log validation
        await supabase
          .from('session_validation_logs')
          .insert({
            user_id: user.id,
            session_id: sessionId,
            old_fingerprint: matchingFingerprint.fingerprint_hash,
            new_fingerprint: hash,
            validation_result: 'valid',
            action_taken: 'session_continued',
            user_agent: navigator.userAgent
          });

        setIsNewDevice(false);
        setIsSuspicious(false);
        return { valid: true, isNewDevice: false, isSuspicious: false };
      }

      // New device detected
      const isFirst = !existingFingerprints || existingFingerprints.length === 0;
      
      // Store new fingerprint
      await supabase
        .from('session_fingerprints')
        .insert([{
          user_id: user.id,
          session_id: sessionId,
          fingerprint_hash: hash,
          fingerprint_data: JSON.parse(JSON.stringify(data)),
          user_agent: navigator.userAgent,
          is_trusted: isFirst
        }]);

      // Log validation
      await supabase
        .from('session_validation_logs')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          old_fingerprint: existingFingerprints?.[0]?.fingerprint_hash || null,
          new_fingerprint: hash,
          validation_result: isFirst ? 'new_device' : 'mismatch',
          action_taken: 'device_registered',
          user_agent: navigator.userAgent
        });

      setIsNewDevice(!isFirst);
      setIsSuspicious(!isFirst && existingFingerprints && existingFingerprints.length > 3);
      
      return { 
        valid: true, 
        isNewDevice: !isFirst, 
        isSuspicious: !isFirst && existingFingerprints && existingFingerprints.length > 3 
      };
    } catch (error) {
      console.error('Session fingerprint validation error:', error);
      return { valid: true, isNewDevice: false, isSuspicious: false };
    } finally {
      setLoading(false);
    }
  }, [generateFingerprint]);

  // Trust current device
  const trustDevice = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !currentFingerprint) return;

    await supabase
      .from('session_fingerprints')
      .update({ is_trusted: true })
      .eq('user_id', user.id)
      .eq('fingerprint_hash', currentFingerprint);
  }, [currentFingerprint]);

  // Remove device
  const removeDevice = useCallback(async (fingerprintId: string) => {
    await supabase
      .from('session_fingerprints')
      .delete()
      .eq('id', fingerprintId);
  }, []);

  // Get user's devices
  const getUserDevices = useCallback(async (): Promise<SessionFingerprint[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('session_fingerprints')
      .select('*')
      .eq('user_id', user.id)
      .order('last_seen_at', { ascending: false });

    return (data || []) as unknown as SessionFingerprint[];
  }, []);

  return {
    currentFingerprint,
    isNewDevice,
    isSuspicious,
    loading,
    validateSession,
    trustDevice,
    removeDevice,
    getUserDevices,
    generateFingerprint
  };
};
