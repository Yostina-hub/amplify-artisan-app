import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, MapPin, Shield, Clock, RefreshCw, Loader2, CheckCircle, XCircle, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function AnomalyDetectionManagement() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [lockedAccounts, setLockedAccounts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAnomalies: 0,
    impossibleTravel: 0,
    bruteForce: 0,
    lockedAccounts: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch anomalies
      const { data: anomalyData } = await supabase
        .from('anomaly_detections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      setAnomalies(anomalyData || []);

      // Fetch login history
      const { data: historyData } = await supabase
        .from('user_login_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      setLoginHistory(historyData || []);

      // Fetch locked accounts
      const { data: lockedData } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .eq('is_locked', true)
        .gt('locked_until', new Date().toISOString());

      setLockedAccounts(lockedData || []);

      // Calculate stats
      const impossibleTravel = anomalyData?.filter(a => a.anomaly_type === 'impossible_travel').length || 0;
      const bruteForce = anomalyData?.filter(a => a.anomaly_type === 'brute_force').length || 0;

      setStats({
        totalAnomalies: anomalyData?.length || 0,
        impossibleTravel,
        bruteForce,
        lockedAccounts: lockedData?.length || 0
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchData();
  }, [isSuperAdmin]);

  const handleResolve = async (id: string, isFalsePositive: boolean) => {
    try {
      const { error } = await supabase
        .from('anomaly_detections')
        .update({ 
          resolved_at: new Date().toISOString(),
          is_false_positive: isFalsePositive
        })
        .eq('id', id);

      if (error) throw error;
      toast({ title: isFalsePositive ? 'Marked as false positive' : 'Anomaly resolved' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUnlock = async (id: string) => {
    try {
      const { error } = await supabase
        .from('failed_login_attempts')
        .update({ is_locked: false, locked_until: null, attempt_count: 0 })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Account unlocked' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Anomaly Detection</h1>
          <p className="text-muted-foreground mt-1">
            Monitor impossible travel, brute force attacks, and behavioral anomalies
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Anomalies</CardTitle>
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalAnomalies}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impossible Travel</CardTitle>
            <MapPin className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.impossibleTravel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brute Force</CardTitle>
            <Shield className="w-5 h-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.bruteForce}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked Accounts</CardTitle>
            <Clock className="w-5 h-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.lockedAccounts}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="anomalies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="logins">Login History</TabsTrigger>
          <TabsTrigger value="locked">Locked Accounts ({lockedAccounts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="anomalies">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anomalies.map((anomaly) => (
                      <TableRow key={anomaly.id}>
                        <TableCell className="text-sm">
                          {format(new Date(anomaly.created_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {anomaly.anomaly_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(anomaly.severity)}>
                            {anomaly.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {anomaly.description}
                        </TableCell>
                        <TableCell>
                          {anomaly.source_city || anomaly.source_country || '-'}
                        </TableCell>
                        <TableCell>
                          {anomaly.resolved_at ? (
                            <Badge variant="outline">
                              {anomaly.is_false_positive ? 'False Positive' : 'Resolved'}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!anomaly.resolved_at && (
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleResolve(anomaly.id, false)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleResolve(anomaly.id, true)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {anomalies.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No anomalies detected
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logins">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.map((login) => (
                    <TableRow key={login.id}>
                      <TableCell className="text-sm">
                        {format(new Date(login.created_at), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {login.user_id?.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {login.ip_address}
                      </TableCell>
                      <TableCell>
                        {[login.city, login.country_code].filter(Boolean).join(', ') || '-'}
                      </TableCell>
                      <TableCell className="max-w-32 truncate text-xs text-muted-foreground">
                        {login.user_agent?.substring(0, 30) || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={login.success ? 'default' : 'destructive'}>
                          {login.success ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locked">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Locked Until</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lockedAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono">
                        {account.identifier}
                      </TableCell>
                      <TableCell className="capitalize">
                        {account.identifier_type}
                      </TableCell>
                      <TableCell>{account.attempt_count}</TableCell>
                      <TableCell>
                        {account.locked_until 
                          ? format(new Date(account.locked_until), 'MMM d, HH:mm')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUnlock(account.id)}
                        >
                          <Unlock className="w-4 h-4 mr-1" />
                          Unlock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {lockedAccounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No locked accounts
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
