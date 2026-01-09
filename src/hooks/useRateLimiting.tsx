import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitState {
  isBlocked: boolean;
  remainingRequests: number;
  blockedUntil: Date | null;
  requestCount: number;
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  login: { maxRequests: 5, windowMs: 60000, blockDurationMs: 900000 }, // 5 per minute, 15 min block
  contact_create: { maxRequests: 10, windowMs: 60000, blockDurationMs: 300000 }, // 10 per minute
  account_create: { maxRequests: 10, windowMs: 60000, blockDurationMs: 300000 },
  lead_create: { maxRequests: 10, windowMs: 60000, blockDurationMs: 300000 },
  activity_create: { maxRequests: 20, windowMs: 60000, blockDurationMs: 300000 },
  quote_create: { maxRequests: 5, windowMs: 60000, blockDurationMs: 300000 },
  user_create: { maxRequests: 3, windowMs: 60000, blockDurationMs: 600000 }, // 3 per minute, 10 min block
  password_reset: { maxRequests: 3, windowMs: 300000, blockDurationMs: 900000 }, // 3 per 5 minutes
  bulk_import: { maxRequests: 2, windowMs: 300000, blockDurationMs: 600000 }, // 2 per 5 minutes
};

// In-memory rate limit tracking (per session)
const rateLimitStore = new Map<string, { count: number; windowStart: number; blockedUntil: number | null }>();

export function useRateLimiting(operationType: keyof typeof DEFAULT_CONFIGS) {
  const [state, setState] = useState<RateLimitState>({
    isBlocked: false,
    remainingRequests: DEFAULT_CONFIGS[operationType]?.maxRequests || 10,
    blockedUntil: null,
    requestCount: 0,
  });

  const config = DEFAULT_CONFIGS[operationType] || { maxRequests: 10, windowMs: 60000 };

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const key = operationType;
    let record = rateLimitStore.get(key);

    // Check if blocked
    if (record?.blockedUntil && now < record.blockedUntil) {
      const blockedUntilDate = new Date(record.blockedUntil);
      setState({
        isBlocked: true,
        remainingRequests: 0,
        blockedUntil: blockedUntilDate,
        requestCount: record.count,
      });
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      toast.error(`Rate limit exceeded. Please wait ${remainingSeconds} seconds.`);
      return false;
    }

    // Reset window if expired
    if (!record || now - record.windowStart > config.windowMs) {
      record = { count: 0, windowStart: now, blockedUntil: null };
    }

    // Check if limit exceeded
    if (record.count >= config.maxRequests) {
      const blockedUntil = now + (config.blockDurationMs || 300000);
      record.blockedUntil = blockedUntil;
      rateLimitStore.set(key, record);
      
      setState({
        isBlocked: true,
        remainingRequests: 0,
        blockedUntil: new Date(blockedUntil),
        requestCount: record.count,
      });
      
      // Log rate limit violation
      logRateLimitViolation(operationType);
      toast.error('Too many requests. Please slow down.');
      return false;
    }

    // Increment count
    record.count += 1;
    rateLimitStore.set(key, record);

    setState({
      isBlocked: false,
      remainingRequests: config.maxRequests - record.count,
      blockedUntil: null,
      requestCount: record.count,
    });

    return true;
  }, [operationType, config]);

  const resetRateLimit = useCallback(() => {
    rateLimitStore.delete(operationType);
    setState({
      isBlocked: false,
      remainingRequests: config.maxRequests,
      blockedUntil: null,
      requestCount: 0,
    });
  }, [operationType, config.maxRequests]);

  return {
    ...state,
    checkRateLimit,
    resetRateLimit,
    config,
  };
}

// Server-side rate limit check for login attempts
export async function checkLoginRateLimit(
  identifier: string,
  ipAddress: string = 'unknown'
): Promise<{ allowed: boolean; locked: boolean; lockedUntil?: Date; attempts?: number; remaining?: number }> {
  try {
    const { data, error } = await supabase.rpc('track_failed_login', {
      p_identifier: identifier,
      p_identifier_type: 'email',
      p_ip_address: ipAddress,
      p_failure_reason: 'checking_rate_limit'
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, locked: false };
    }

    const result = data as any;
    
    if (result?.locked) {
      return {
        allowed: false,
        locked: true,
        lockedUntil: result.locked_until ? new Date(result.locked_until) : undefined,
      };
    }

    return {
      allowed: true,
      locked: false,
      attempts: result?.attempts,
      remaining: result?.remaining,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return { allowed: true, locked: false };
  }
}

// Log rate limit violations for security monitoring
async function logRateLimitViolation(operationType: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('security_audit_log').insert({
      user_id: user?.id || null,
      action: 'RATE_LIMIT_EXCEEDED',
      table_name: operationType,
      category: 'security',
      severity: 'warn',
      details: {
        operation_type: operationType,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to log rate limit violation:', error);
  }
}

// Bulk operation rate limiter with batch size validation
export function useBulkOperationLimiter(operationType: 'bulk_import') {
  const rateLimiter = useRateLimiting(operationType);
  const MAX_BATCH_SIZE = 100;

  const validateBatchSize = useCallback((items: unknown[]): boolean => {
    if (items.length > MAX_BATCH_SIZE) {
      toast.error(`Batch size exceeds limit. Maximum ${MAX_BATCH_SIZE} items per import.`);
      return false;
    }
    return true;
  }, []);

  const canPerformBulkOperation = useCallback((items: unknown[]): boolean => {
    if (!validateBatchSize(items)) return false;
    if (!rateLimiter.checkRateLimit()) return false;
    return true;
  }, [validateBatchSize, rateLimiter]);

  return {
    ...rateLimiter,
    validateBatchSize,
    canPerformBulkOperation,
    MAX_BATCH_SIZE,
  };
}

// Clear successful login attempt (reset failed count)
export async function clearFailedLoginAttempts(identifier: string): Promise<void> {
  try {
    await supabase
      .from('failed_login_attempts')
      .update({ 
        attempt_count: 0, 
        is_locked: false, 
        locked_until: null 
      })
      .eq('identifier', identifier)
      .eq('identifier_type', 'email');
  } catch (error) {
    console.error('Failed to clear login attempts:', error);
  }
}
