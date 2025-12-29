import { supabase } from '@/integrations/supabase/client';

export interface SecurityReport {
  generatedAt: string;
  period: { start: string; end: string };
  summary: {
    totalEvents: number;
    criticalEvents: number;
    highEvents: number;
    mediumEvents: number;
    lowEvents: number;
  };
  threatMetrics: {
    blockedAttempts: number;
    failedLogins: number;
    anomaliesDetected: number;
    suspiciousActivities: number;
  };
  topThreats: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
  recommendations: string[];
}

export const generateSecurityReport = async (
  startDate: Date,
  endDate: Date
): Promise<SecurityReport> => {
  const start = startDate.toISOString();
  const end = endDate.toISOString();

  // Fetch metrics in parallel
  const [
    anomaliesResult,
    failedLoginsResult,
    blockedResult,
    auditResult
  ] = await Promise.all([
    supabase
      .from('anomaly_detections')
      .select('anomaly_type, severity')
      .gte('created_at', start)
      .lte('created_at', end),
    supabase
      .from('failed_login_attempts')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end),
    supabase
      .from('access_logs')
      .select('*')
      .eq('is_blocked', true)
      .gte('created_at', start)
      .lte('created_at', end),
    supabase
      .from('security_audit_log')
      .select('severity')
      .gte('created_at', start)
      .lte('created_at', end)
  ]);

  const anomalies = anomaliesResult.data || [];
  const failedLogins = failedLoginsResult.data || [];
  const blocked = blockedResult.data || [];
  const auditLogs = auditResult.data || [];

  // Calculate severity counts
  const severityCounts = auditLogs.reduce((acc, log) => {
    const severity = log.severity || 'low';
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group anomalies by type
  const threatCounts = anomalies.reduce((acc, anomaly) => {
    const key = anomaly.anomaly_type;
    if (!acc[key]) {
      acc[key] = { type: key, count: 0, severity: anomaly.severity };
    }
    acc[key].count++;
    return acc;
  }, {} as Record<string, { type: string; count: number; severity: string }>);

  const topThreats = Object.values(threatCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Generate recommendations based on data
  const recommendations: string[] = [];
  
  if (failedLogins.length > 50) {
    recommendations.push('High number of failed logins detected. Consider implementing stricter rate limiting.');
  }
  if (anomalies.some(a => a.anomaly_type === 'impossible_travel')) {
    recommendations.push('Impossible travel anomalies detected. Review MFA enforcement for affected users.');
  }
  if (blocked.length > 100) {
    recommendations.push('High volume of blocked requests. Review and update firewall rules.');
  }
  if (severityCounts['critical'] > 0) {
    recommendations.push(`${severityCounts['critical']} critical events require immediate attention.`);
  }
  if (recommendations.length === 0) {
    recommendations.push('Security posture is stable. Continue monitoring for new threats.');
  }

  return {
    generatedAt: new Date().toISOString(),
    period: { start, end },
    summary: {
      totalEvents: auditLogs.length,
      criticalEvents: severityCounts['critical'] || 0,
      highEvents: severityCounts['high'] || 0,
      mediumEvents: severityCounts['medium'] || 0,
      lowEvents: severityCounts['low'] || 0
    },
    threatMetrics: {
      blockedAttempts: blocked.length,
      failedLogins: failedLogins.length,
      anomaliesDetected: anomalies.length,
      suspiciousActivities: anomalies.filter(a => 
        a.severity === 'high' || a.severity === 'critical'
      ).length
    },
    topThreats,
    recommendations
  };
};

export const exportReportAsCSV = (report: SecurityReport): string => {
  const lines = [
    'Security Report',
    `Generated At,${report.generatedAt}`,
    `Period,${report.period.start} to ${report.period.end}`,
    '',
    'Summary',
    `Total Events,${report.summary.totalEvents}`,
    `Critical Events,${report.summary.criticalEvents}`,
    `High Events,${report.summary.highEvents}`,
    `Medium Events,${report.summary.mediumEvents}`,
    `Low Events,${report.summary.lowEvents}`,
    '',
    'Threat Metrics',
    `Blocked Attempts,${report.threatMetrics.blockedAttempts}`,
    `Failed Logins,${report.threatMetrics.failedLogins}`,
    `Anomalies Detected,${report.threatMetrics.anomaliesDetected}`,
    `Suspicious Activities,${report.threatMetrics.suspiciousActivities}`,
    '',
    'Top Threats',
    'Type,Count,Severity',
    ...report.topThreats.map(t => `${t.type},${t.count},${t.severity}`),
    '',
    'Recommendations',
    ...report.recommendations.map(r => `"${r}"`)
  ];

  return lines.join('\n');
};

export const exportReportAsJSON = (report: SecurityReport): string => {
  return JSON.stringify(report, null, 2);
};

export const downloadReport = (report: SecurityReport, format: 'csv' | 'json') => {
  const content = format === 'csv' 
    ? exportReportAsCSV(report) 
    : exportReportAsJSON(report);
  
  const blob = new Blob([content], { 
    type: format === 'csv' ? 'text/csv' : 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `security-report-${new Date().toISOString().split('T')[0]}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
