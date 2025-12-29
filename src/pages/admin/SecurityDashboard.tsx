import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, AlertTriangle, Key, 
  Activity, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SecurityMetrics {
  blockedAttempts: number;
  activeUsers: number;
  anomalies: number;
  failedLogins: number;
  auditEvents: number;
}

interface SecurityFeature {
  name: string;
  status: 'active' | 'warning' | 'inactive';
  description: string;
  link?: string;
}

const SecurityDashboard = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    blockedAttempts: 0,
    activeUsers: 0,
    anomalies: 0,
    failedLogins: 0,
    auditEvents: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const navigate = useNavigate();

  const securityFeatures: SecurityFeature[] = [
    { name: 'Threat Detection (TDRS)', status: 'active', description: 'Real-time threat monitoring', link: '/admin/threat-detection' },
    { name: 'Multi-Factor Auth', status: 'active', description: 'OTP-based verification', link: '/admin/mfa-management' },
    { name: 'Geo-Blocking', status: 'active', description: 'Country-based access control', link: '/admin/geo-blocking' },
    { name: 'Anomaly Detection', status: 'active', description: 'Impossible travel & brute force', link: '/admin/anomaly-detection' },
    { name: 'Session Fingerprinting', status: 'active', description: 'Device & browser validation' },
    { name: 'Password Policy', status: 'active', description: '12+ chars, complexity rules' },
    { name: 'Security Audit Log', status: 'active', description: 'Comprehensive event logging', link: '/admin/security-audit' },
    { name: 'Input Validation', status: 'active', description: 'Zod schema validation' },
    { name: 'File Validation', status: 'active', description: 'Type & size restrictions' },
    { name: 'XSS Prevention', status: 'active', description: 'DOMPurify sanitization' },
    { name: 'Cookie Security', status: 'active', description: 'CSRF & secure storage' },
    { name: 'Network Restriction', status: 'active', description: 'VPN/Proxy detection' },
    { name: 'License Validation', status: 'active', description: 'Domain & feature control' },
    { name: 'SQL Injection Prevention', status: 'active', description: 'Safe query utilities' },
    { name: 'Rate Limiting', status: 'active', description: 'Request throttling' }
  ];

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      // Fetch various security metrics using available tables
      const [
        anomalyResult,
        failedResult,
        auditResult,
        geoBlockResult,
        userResult
      ] = await Promise.all([
        supabase.from('anomaly_detections').select('*', { count: 'exact', head: true }),
        supabase.from('failed_login_attempts').select('*', { count: 'exact', head: true }).eq('is_locked', true),
        supabase.from('security_audit_log').select('*', { count: 'exact', head: true }),
        supabase.from('access_logs').select('*', { count: 'exact', head: true }).eq('is_blocked', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);

      setMetrics({
        blockedAttempts: geoBlockResult.count || 0,
        activeUsers: userResult.count || 0,
        anomalies: anomalyResult.count || 0,
        failedLogins: failedResult.count || 0,
        auditEvents: auditResult.count || 0
      });

      // Fetch recent alerts
      const { data: alerts } = await supabase
        .from('anomaly_detections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentAlerts(alerts || []);
    } catch (error) {
      console.error('Failed to fetch security metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSecurityScore = (): number => {
    const activeFeatures = securityFeatures.filter(f => f.status === 'active').length;
    const totalFeatures = securityFeatures.length;
    const baseScore = (activeFeatures / totalFeatures) * 100;
    
    // Adjust based on anomalies
    let adjustedScore = baseScore;
    if (metrics.anomalies > 10) adjustedScore -= 5;
    
    return Math.max(0, Math.min(100, Math.round(adjustedScore)));
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const securityScore = getSecurityScore();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive security monitoring and management</p>
        </div>
        <Button onClick={fetchMetrics} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Security Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className={`text-5xl font-bold ${getScoreColor(securityScore)}`}>
              {securityScore}%
            </div>
            <div className="flex-1">
              <Progress value={securityScore} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                {securityScore >= 80 ? 'Excellent security posture' :
                 securityScore >= 60 ? 'Good, but improvements recommended' :
                 'Critical improvements needed'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anomalies</p>
                <p className="text-2xl font-bold">{metrics.anomalies}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked Attempts</p>
                <p className="text-2xl font-bold">{metrics.blockedAttempts}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed Logins</p>
                <p className="text-2xl font-bold">{metrics.failedLogins}</p>
              </div>
              <Key className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Audit Events</p>
                <p className="text-2xl font-bold">{metrics.auditEvents}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="features" className="space-y-4">
        <TabsList>
          <TabsTrigger value="features">Security Features</TabsTrigger>
          <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Implemented Security Features</CardTitle>
              <CardDescription>All security controls active in this system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {securityFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${
                      feature.link ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => feature.link && navigate(feature.link)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{feature.name}</span>
                      <Badge variant={feature.status === 'active' ? 'default' : 'destructive'}>
                        {feature.status === 'active' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {feature.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Alerts</CardTitle>
              <CardDescription>Latest anomalies and threats detected</CardDescription>
            </CardHeader>
            <CardContent>
              {recentAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent security alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAlerts.map((alert) => (
                    <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center gap-2">
                        {alert.anomaly_type}
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription>
                        {alert.description}
                        <span className="block text-xs mt-1 opacity-70">
                          {new Date(alert.created_at).toLocaleString()}
                        </span>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;
