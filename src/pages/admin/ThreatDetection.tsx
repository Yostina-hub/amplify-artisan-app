import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  Ban, 
  Eye, 
  CheckCircle, 
  XCircle,
  Activity,
  Globe,
  Bot,
  Clock,
  TrendingDown,
  Search,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface ThreatDetection {
  id: string;
  ip_address: string;
  user_id: string | null;
  threat_type: string;
  severity: string;
  action_taken: string;
  details: Record<string, any>;
  user_agent: string | null;
  request_path: string | null;
  is_resolved: boolean;
  created_at: string;
}

interface IPReputation {
  id: string;
  ip_address: string;
  reputation_score: number;
  is_blocked: boolean;
  blocked_reason: string | null;
  blocked_until: string | null;
  total_requests: number;
  suspicious_requests: number;
  last_seen_at: string;
}

interface HoneypotInteraction {
  id: string;
  ip_address: string;
  user_agent: string | null;
  honeypot_field: string;
  field_value: string | null;
  page_url: string | null;
  form_name: string | null;
  created_at: string;
}

const ThreatDetection = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const [threats, setThreats] = useState<ThreatDetection[]>([]);
  const [ipReputations, setIPReputations] = useState<IPReputation[]>([]);
  const [honeypots, setHoneypots] = useState<HoneypotInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalThreats: 0,
    blockedIPs: 0,
    honeypotTriggers: 0,
    avgReputationScore: 0
  });

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isSuperAdmin, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch threats
      const { data: threatsData } = await supabase
        .from('threat_detections')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch IP reputations
      const { data: ipData } = await supabase
        .from('ip_reputation')
        .select('*')
        .order('last_seen_at', { ascending: false })
        .limit(100);

      // Fetch honeypot interactions
      const { data: honeypotData } = await supabase
        .from('honeypot_interactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      setThreats((threatsData || []) as ThreatDetection[]);
      setIPReputations((ipData || []) as IPReputation[]);
      setHoneypots((honeypotData || []) as HoneypotInteraction[]);

      // Calculate stats
      const blockedCount = (ipData || []).filter((ip: any) => ip.is_blocked).length;
      const avgScore = (ipData || []).reduce((acc: number, ip: any) => acc + (ip.reputation_score || 0), 0) / ((ipData || []).length || 1);

      setStats({
        totalThreats: (threatsData || []).length,
        blockedIPs: blockedCount,
        honeypotTriggers: (honeypotData || []).length,
        avgReputationScore: Math.round(avgScore)
      });
    } catch (error) {
      console.error('Error fetching threat data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load threat detection data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async (ip: string, block: boolean) => {
    try {
      const { error } = await supabase
        .from('ip_reputation')
        .update({
          is_blocked: block,
          blocked_reason: block ? 'Manually blocked by admin' : null,
          blocked_until: block ? new Date(Date.now() + 86400000).toISOString() : null // 24 hours
        })
        .eq('ip_address', ip);

      if (error) throw error;

      toast({
        title: block ? 'IP Blocked' : 'IP Unblocked',
        description: `${ip} has been ${block ? 'blocked' : 'unblocked'}`
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update IP status',
        variant: 'destructive'
      });
    }
  };

  const handleResolveThreat = async (threatId: string) => {
    try {
      const { error } = await supabase
        .from('threat_detections')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id
        })
        .eq('id', threatId);

      if (error) throw error;

      toast({
        title: 'Threat Resolved',
        description: 'The threat has been marked as resolved'
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve threat',
        variant: 'destructive'
      });
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-500/20 text-blue-400',
      medium: 'bg-yellow-500/20 text-yellow-400',
      high: 'bg-orange-500/20 text-orange-400',
      critical: 'bg-red-500/20 text-red-400'
    };
    return <Badge className={colors[severity] || 'bg-muted'}>{severity}</Badge>;
  };

  const getActionBadge = (action: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      warn: { color: 'bg-yellow-500/20 text-yellow-400', icon: AlertTriangle },
      challenge: { color: 'bg-blue-500/20 text-blue-400', icon: Eye },
      throttle: { color: 'bg-orange-500/20 text-orange-400', icon: Clock },
      block: { color: 'bg-red-500/20 text-red-400', icon: Ban }
    };
    const { color, icon: Icon } = config[action] || { color: 'bg-muted', icon: Activity };
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {action}
      </Badge>
    );
  };

  const getReputationColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    if (score >= 20) return 'text-orange-400';
    return 'text-red-400';
  };

  const filteredThreats = threats.filter(t => 
    t.ip_address.includes(searchTerm) || 
    t.threat_type.includes(searchTerm.toLowerCase())
  );

  const filteredIPs = ipReputations.filter(ip => 
    ip.ip_address.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Threat Detection & Response System
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and respond to security threats in real-time
          </p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Threats</p>
                <p className="text-3xl font-bold">{stats.totalThreats}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked IPs</p>
                <p className="text-3xl font-bold">{stats.blockedIPs}</p>
              </div>
              <Ban className="h-10 w-10 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Honeypot Triggers</p>
                <p className="text-3xl font-bold">{stats.honeypotTriggers}</p>
              </div>
              <Bot className="h-10 w-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg IP Score</p>
                <p className="text-3xl font-bold">{stats.avgReputationScore}%</p>
              </div>
              <TrendingDown className="h-10 w-10 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by IP address or threat type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="threats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="threats">Threat Detections</TabsTrigger>
          <TabsTrigger value="reputation">IP Reputation</TabsTrigger>
          <TabsTrigger value="honeypots">Honeypot Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="threats">
          <Card>
            <CardHeader>
              <CardTitle>Recent Threats</CardTitle>
              <CardDescription>Detected security threats and responses</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredThreats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No threats detected
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredThreats.map((threat) => (
                      <TableRow key={threat.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(threat.created_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{threat.ip_address}</TableCell>
                        <TableCell className="capitalize">{threat.threat_type.replace('_', ' ')}</TableCell>
                        <TableCell>{getSeverityBadge(threat.severity)}</TableCell>
                        <TableCell>{getActionBadge(threat.action_taken)}</TableCell>
                        <TableCell>
                          {threat.is_resolved ? (
                            <Badge className="bg-green-500/20 text-green-400">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-400">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!threat.is_resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveThreat(threat.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reputation">
          <Card>
            <CardHeader>
              <CardTitle>IP Reputation Scores</CardTitle>
              <CardDescription>Track and manage IP address reputations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Total Requests</TableHead>
                    <TableHead>Suspicious</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIPs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No IP reputation data
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIPs.map((ip) => (
                      <TableRow key={ip.id}>
                        <TableCell className="font-mono text-sm flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          {ip.ip_address}
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${getReputationColor(ip.reputation_score)}`}>
                            {ip.reputation_score}%
                          </span>
                        </TableCell>
                        <TableCell>{ip.total_requests}</TableCell>
                        <TableCell className="text-orange-400">{ip.suspicious_requests}</TableCell>
                        <TableCell>
                          {ip.is_blocked ? (
                            <Badge className="bg-red-500/20 text-red-400">
                              <Ban className="h-3 w-3 mr-1" />
                              Blocked
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/20 text-green-400">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Allowed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(ip.last_seen_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={ip.is_blocked ? 'outline' : 'destructive'}
                            onClick={() => handleBlockIP(ip.ip_address, !ip.is_blocked)}
                          >
                            {ip.is_blocked ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Unblock
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-1" />
                                Block
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="honeypots">
          <Card>
            <CardHeader>
              <CardTitle>Honeypot Interactions</CardTitle>
              <CardDescription>Bot detection via hidden form fields</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Value Entered</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>Page URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {honeypots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No honeypot triggers recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    honeypots.map((hp) => (
                      <TableRow key={hp.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(hp.created_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{hp.ip_address}</TableCell>
                        <TableCell className="font-mono text-sm">{hp.honeypot_field}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{hp.field_value || '-'}</TableCell>
                        <TableCell>{hp.form_name || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {hp.page_url || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ThreatDetection;
