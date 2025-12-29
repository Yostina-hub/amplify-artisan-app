import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Globe, Shield, MapPin, Plus, Trash2, RefreshCw, Loader2, AlertTriangle, CheckCircle, Ban } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Common countries list
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'RU', name: 'Russia' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
];

export default function GeoBlockingManagement() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    country_code: '',
    action: 'block',
    reason: ''
  });

  const [stats, setStats] = useState({
    totalBlocked: 0,
    totalAllowed: 0,
    uniqueCountries: 0,
    recentBlocks: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch rules
      const { data: rulesData } = await supabase
        .from('geo_blocking_rules')
        .select('*')
        .order('country_name');

      setRules(rulesData || []);

      // Fetch logs
      const { data: logsData } = await supabase
        .from('geo_access_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      setLogs(logsData || []);

      // Fetch settings
      const { data: settingsData } = await supabase
        .from('geo_settings')
        .select('*')
        .is('company_id', null)
        .single();

      setSettings(settingsData || { mode: 'disabled', default_action: 'allow' });

      // Calculate stats
      const blocked = logsData?.filter(l => l.action_taken === 'blocked').length || 0;
      const allowed = logsData?.filter(l => l.action_taken === 'allowed').length || 0;
      const countries = new Set(logsData?.map(l => l.country_code)).size;
      const recentBlocks = logsData?.filter(l => 
        l.action_taken === 'blocked' && 
        new Date(l.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0;

      setStats({
        totalBlocked: blocked,
        totalAllowed: allowed,
        uniqueCountries: countries,
        recentBlocks
      });
    } catch (error) {
      console.error('Error fetching geo data:', error);
      toast({ title: 'Error', description: 'Failed to load geo-blocking data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchData();
  }, [isSuperAdmin]);

  const handleAddRule = async () => {
    if (!newRule.country_code) {
      toast({ title: 'Error', description: 'Please select a country', variant: 'destructive' });
      return;
    }

    const country = COUNTRIES.find(c => c.code === newRule.country_code);
    
    try {
      const { error } = await supabase.from('geo_blocking_rules').insert({
        country_code: newRule.country_code,
        country_name: country?.name || newRule.country_code,
        action: newRule.action,
        reason: newRule.reason || null
      });

      if (error) throw error;

      toast({ title: 'Rule Added', description: `${country?.name} has been added to the ${newRule.action} list` });
      setIsAddDialogOpen(false);
      setNewRule({ country_code: '', action: 'block', reason: '' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const { error } = await supabase.from('geo_blocking_rules').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Rule Deleted' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleRule = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('geo_blocking_rules')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateSettings = async (updates: Partial<typeof settings>) => {
    try {
      if (settings?.id) {
        await supabase.from('geo_settings').update(updates).eq('id', settings.id);
      } else {
        await supabase.from('geo_settings').insert({ ...updates, company_id: null });
      }
      setSettings({ ...settings, ...updates });
      toast({ title: 'Settings Updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
          <h1 className="text-3xl font-bold">Geo-Blocking</h1>
          <p className="text-muted-foreground mt-1">
            Control access based on geographic location
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Geo-Blocking Rule</DialogTitle>
                <DialogDescription>
                  Create a rule to block or allow access from a specific country
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={newRule.country_code} onValueChange={(v) => setNewRule({ ...newRule, country_code: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Action</Label>
                  <Select value={newRule.action} onValueChange={(v) => setNewRule({ ...newRule, action: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="allow">Allow</SelectItem>
                      <SelectItem value="challenge">Challenge (MFA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason (optional)</Label>
                  <Input 
                    placeholder="e.g., High fraud region"
                    value={newRule.reason}
                    onChange={(e) => setNewRule({ ...newRule, reason: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddRule}>Add Rule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
            <Ban className="w-5 h-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalBlocked}</p>
            <p className="text-xs text-muted-foreground">{stats.recentBlocks} in last 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allowed Requests</CardTitle>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalAllowed}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries Seen</CardTitle>
            <Globe className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.uniqueCountries}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Shield className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rules.filter(r => r.is_active).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
          <CardDescription>Configure how geo-blocking operates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Mode</Label>
              <p className="text-sm text-muted-foreground">How rules are applied</p>
            </div>
            <Select 
              value={settings?.mode || 'disabled'} 
              onValueChange={(v) => handleUpdateSettings({ mode: v })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="blocklist">Blocklist (block listed countries)</SelectItem>
                <SelectItem value="allowlist">Allowlist (only allow listed countries)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label>VPN Detection</Label>
              <p className="text-sm text-muted-foreground">Block known VPN IP addresses</p>
            </div>
            <Switch 
              checked={settings?.vpn_detection_enabled || false}
              onCheckedChange={(v) => handleUpdateSettings({ vpn_detection_enabled: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Tor Blocking</Label>
              <p className="text-sm text-muted-foreground">Block Tor exit nodes</p>
            </div>
            <Switch 
              checked={settings?.tor_blocking_enabled || false}
              onCheckedChange={(v) => handleUpdateSettings({ tor_blocking_enabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Rules ({rules.length})</TabsTrigger>
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
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
                      <TableHead>Country</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCountryFlag(rule.country_code)}</span>
                            {rule.country_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            rule.action === 'block' ? 'destructive' : 
                            rule.action === 'allow' ? 'default' : 'secondary'
                          }>
                            {rule.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {rule.reason || '-'}
                        </TableCell>
                        <TableCell>
                          <Switch 
                            checked={rule.is_active}
                            onCheckedChange={(v) => handleToggleRule(rule.id, v)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No geo-blocking rules configured
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
                      <TableHead>Country</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Path</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{getCountryFlag(log.country_code)}</span>
                            {log.country_name || log.country_code}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.city || '-'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ip_address}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            log.action_taken === 'blocked' ? 'destructive' : 
                            log.action_taken === 'challenged' ? 'secondary' : 'outline'
                          }>
                            {log.action_taken}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-32 truncate">
                          {log.request_path || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No access logs yet
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
  );
}

// Helper to get country flag emoji
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
