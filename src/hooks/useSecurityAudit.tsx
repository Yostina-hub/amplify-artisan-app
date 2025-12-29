import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';
type AuditCategory = 'auth' | 'data' | 'admin' | 'security' | 'general';

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  company_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  severity: AuditSeverity;
  category: AuditCategory;
  created_at: string;
}

interface AuditLogFilters {
  user_id?: string;
  company_id?: string;
  action?: string;
  category?: AuditCategory;
  severity?: AuditSeverity;
  start_date?: string;
  end_date?: string;
}

export const useSecurityAudit = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Log a security event
  const logEvent = useCallback(async (
    action: string,
    details: Record<string, unknown> = {},
    options: {
      severity?: AuditSeverity;
      category?: AuditCategory;
      table_name?: string;
      record_id?: string;
    } = {}
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let companyId: string | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        companyId = profile?.company_id || null;
      }

      const sessionId = sessionStorage.getItem('session_id') || null;

      const { error } = await supabase
        .from('security_audit_log')
        .insert([{
          user_id: user?.id || null,
          company_id: companyId,
          action,
          table_name: options.table_name || null,
          record_id: options.record_id || null,
          details: details as unknown as null,
          user_agent: navigator.userAgent,
          session_id: sessionId,
          severity: options.severity || 'info',
          category: options.category || 'general'
        }]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error logging security event:', error);
      return false;
    }
  }, []);

  // Log authentication events
  const logAuthEvent = useCallback(async (
    action: 'login' | 'logout' | 'login_failed' | 'password_change' | 'password_reset' | 'mfa_enabled' | 'mfa_disabled' | 'session_expired',
    details: Record<string, unknown> = {}
  ): Promise<boolean> => {
    const severityMap: Record<string, AuditSeverity> = {
      login: 'info',
      logout: 'info',
      login_failed: 'warning',
      password_change: 'info',
      password_reset: 'warning',
      mfa_enabled: 'info',
      mfa_disabled: 'warning',
      session_expired: 'info'
    };

    return logEvent(action, details, {
      severity: severityMap[action] || 'info',
      category: 'auth'
    });
  }, [logEvent]);

  // Log data access events
  const logDataEvent = useCallback(async (
    action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import',
    tableName: string,
    recordId?: string,
    details: Record<string, unknown> = {}
  ): Promise<boolean> => {
    return logEvent(`data_${action}`, details, {
      severity: action === 'delete' ? 'warning' : 'info',
      category: 'data',
      table_name: tableName,
      record_id: recordId
    });
  }, [logEvent]);

  // Log admin actions
  const logAdminEvent = useCallback(async (
    action: string,
    details: Record<string, unknown> = {}
  ): Promise<boolean> => {
    return logEvent(action, details, {
      severity: 'warning',
      category: 'admin'
    });
  }, [logEvent]);

  // Log security events
  const logSecurityEvent = useCallback(async (
    action: string,
    details: Record<string, unknown> = {},
    severity: AuditSeverity = 'warning'
  ): Promise<boolean> => {
    return logEvent(action, details, {
      severity,
      category: 'security'
    });
  }, [logEvent]);

  // Fetch audit logs with filters
  const fetchLogs = useCallback(async (
    filters: AuditLogFilters = {},
    page: number = 1,
    pageSize: number = 50
  ): Promise<AuditLogEntry[]> => {
    setLoading(true);
    try {
      let query = supabase
        .from('security_audit_log')
        .select('*', { count: 'exact' });

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters.company_id) {
        query = query.eq('company_id', filters.company_id);
      }
      if (filters.action) {
        query = query.ilike('action', `%${filters.action}%`);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const typedLogs = (data || []) as unknown as AuditLogEntry[];
      setLogs(typedLogs);
      setTotalCount(count || 0);
      return typedLogs;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get audit statistics
  const getStatistics = useCallback(async (
    companyId?: string,
    days: number = 30
  ): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
    byAction: Record<string, number>;
  }> => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('security_audit_log')
        .select('severity, category, action')
        .gte('created_at', startDate.toISOString());

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        bySeverity: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        byAction: {} as Record<string, number>
      };

      data?.forEach(log => {
        stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
        stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching audit statistics:', error);
      return {
        total: 0,
        bySeverity: {},
        byCategory: {},
        byAction: {}
      };
    }
  }, []);

  // Export logs
  const exportLogs = useCallback(async (
    filters: AuditLogFilters = {},
    format: 'json' | 'csv' = 'json'
  ): Promise<string> => {
    let query = supabase
      .from('security_audit_log')
      .select('*');

    if (filters.user_id) query = query.eq('user_id', filters.user_id);
    if (filters.company_id) query = query.eq('company_id', filters.company_id);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.severity) query = query.eq('severity', filters.severity);
    if (filters.start_date) query = query.gte('created_at', filters.start_date);
    if (filters.end_date) query = query.lte('created_at', filters.end_date);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    if (format === 'csv') {
      const headers = ['id', 'user_id', 'action', 'category', 'severity', 'details', 'created_at'];
      const rows = (data || []).map(log => 
        headers.map(h => {
          const value = log[h as keyof typeof log];
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value || '');
        }).join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }

    return JSON.stringify(data, null, 2);
  }, []);

  return {
    logs,
    loading,
    totalCount,
    logEvent,
    logAuthEvent,
    logDataEvent,
    logAdminEvent,
    logSecurityEvent,
    fetchLogs,
    getStatistics,
    exportLogs
  };
};
