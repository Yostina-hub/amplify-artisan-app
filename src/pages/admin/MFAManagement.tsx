import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Users, Key, Clock, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function MFAManagement() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    mfaEnabled: 0,
    recentVerifications: 0,
    blockedAttempts: 0,
  });
  const [mfaUsers, setMfaUsers] = useState<any[]>([]);
  const [otpLogs, setOtpLogs] = useState<any[]>([]);
  const [rateLimits, setRateLimits] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch MFA settings
      const { data: settings, error: settingsError } = await supabase
        .from('mfa_user_settings')
        .select('*')
        .order('updated_at', { ascending: false });

      if (settingsError) throw settingsError;
      setMfaUsers(settings || []);

      // Fetch OTP logs
      const { data: logs, error: logsError } = await supabase
        .from('mfa_otp_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;
      setOtpLogs(logs || []);

      // Fetch rate limits
      const { data: limits, error: limitsError } = await supabase
        .from('mfa_rate_limits')
        .select('*')
        .eq('is_blocked', true)
        .order('updated_at', { ascending: false });

      if (limitsError) throw limitsError;
      setRateLimits(limits || []);

      // Calculate stats
      const enabledCount = settings?.filter(s => s.mfa_enabled).length || 0;
      const recentVerifications = logs?.filter(l => 
        l.verified_at && new Date(l.verified_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0;

      setStats({
        totalUsers: settings?.length || 0,
        mfaEnabled: enabledCount,
        recentVerifications,
        blockedAttempts: limits?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching MFA data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch MFA data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const clearRateLimit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mfa_rate_limits')
        .update({ is_blocked: false, blocked_until: null })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Rate limit cleared' });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear rate limit',
        variant: 'destructive',
      });
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">MFA Management</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage two-factor authentication across the platform
            </p>
          </div>
          <Button onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">With MFA Settings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MFA Enabled</CardTitle>
              <Shield className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.mfaEnabled}</p>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verifications</CardTitle>
              <Key className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.recentVerifications}</p>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked</CardTitle>
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.blockedAttempts}</p>
              <p className="text-xs text-muted-foreground">Rate limited</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">MFA Users</TabsTrigger>
            <TabsTrigger value="logs">OTP Logs</TabsTrigger>
            <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users with MFA</CardTitle>
                <CardDescription>All users who have configured MFA settings</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Last Verified</TableHead>
                        <TableHead>Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mfaUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-xs">
                            {user.user_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.mfa_enabled ? 'default' : 'secondary'}>
                              {user.mfa_enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{user.preferred_method}</TableCell>
                          <TableCell>
                            {user.last_mfa_at 
                              ? format(new Date(user.last_mfa_at), 'MMM d, HH:mm')
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell>
                            {format(new Date(user.updated_at), 'MMM d, HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                      {mfaUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No users with MFA settings found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>OTP Logs</CardTitle>
                <CardDescription>Recent OTP code requests and verifications</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otpLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">
                            {log.user_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="capitalize">{log.purpose}</TableCell>
                          <TableCell className="capitalize">{log.delivery_method}</TableCell>
                          <TableCell>
                            <Badge variant={
                              log.verified_at ? 'default' : 
                              log.is_used ? 'secondary' : 
                              new Date(log.expires_at) < new Date() ? 'destructive' : 'outline'
                            }>
                              {log.verified_at ? 'Verified' : 
                               log.is_used ? 'Used' : 
                               new Date(log.expires_at) < new Date() ? 'Expired' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.attempts}/{log.max_attempts}</TableCell>
                          <TableCell>
                            {format(new Date(log.created_at), 'MMM d, HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                      {otpLogs.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No OTP logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rate-limits">
            <Card>
              <CardHeader>
                <CardTitle>Blocked Rate Limits</CardTitle>
                <CardDescription>Users or IPs currently blocked due to rate limiting</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Identifier</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead>Blocked Until</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rateLimits.map((limit) => (
                        <TableRow key={limit.id}>
                          <TableCell className="font-mono text-xs">
                            {limit.identifier.substring(0, 16)}...
                          </TableCell>
                          <TableCell className="capitalize">{limit.identifier_type}</TableCell>
                          <TableCell className="capitalize">{limit.action_type.replace('_', ' ')}</TableCell>
                          <TableCell>{limit.request_count}/{limit.max_requests}</TableCell>
                          <TableCell>
                            {limit.blocked_until 
                              ? format(new Date(limit.blocked_until), 'MMM d, HH:mm')
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => clearRateLimit(limit.id)}
                            >
                              Unblock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {rateLimits.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No blocked rate limits
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
