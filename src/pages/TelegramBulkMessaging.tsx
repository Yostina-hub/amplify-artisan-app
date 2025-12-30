import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Send, 
  Users, 
  Phone, 
  Plus, 
  Upload, 
  Play, 
  Pause, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare,
  RefreshCw,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  message_template: string;
  status: string;
  total_contacts: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  scheduled_at: string | null;
  created_at: string;
}

interface Contact {
  id: string;
  phone_number: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  sent_at: string | null;
  error_message: string | null;
}

export default function TelegramBulkMessaging() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [authStep, setAuthStep] = useState<'phone' | 'code' | 'done'>('phone');
  const [loading, setLoading] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showAddContacts, setShowAddContacts] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', description: '', message_template: '' });
  const [manualContacts, setManualContacts] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);

  useEffect(() => {
    checkAuthStatus();
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchContacts(selectedCampaign.id);
    }
  }, [selectedCampaign]);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase.functions.invoke('telegram-bulk-auth', {
        body: { action: 'check_status' }
      });

      if (data?.is_authenticated) {
        setIsAuthenticated(true);
        setAuthStep('done');
        setAuthPhone(data.phone_number || '');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from('telegram_bulk_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return;
    }

    setCampaigns(data || []);
  };

  const fetchContacts = async (campaignId: string) => {
    const { data, error } = await supabase
      .from('telegram_bulk_contacts')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      return;
    }

    setContacts(data || []);
  };

  const requestAuthCode = async () => {
    if (!authPhone) {
      toast.error('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bulk-auth', {
        body: { action: 'request_code', phone_number: authPhone }
      });

      if (error) throw error;

      if (data?.success) {
        setAuthStep('code');
        toast.success('Verification code sent to your Telegram app');
      } else {
        throw new Error(data?.error || 'Failed to send code');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to request code');
    } finally {
      setLoading(false);
    }
  };

  const verifyAuthCode = async () => {
    if (!authCode) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bulk-auth', {
        body: { action: 'verify_code', phone_number: authPhone, code: authCode }
      });

      if (error) throw error;

      if (data?.success) {
        setIsAuthenticated(true);
        setAuthStep('done');
        toast.success('Telegram account authenticated successfully');
      } else {
        throw new Error(data?.error || 'Failed to verify code');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.message_template) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      const { error } = await supabase
        .from('telegram_bulk_campaigns')
        .insert({
          company_id: profile?.company_id,
          name: newCampaign.name,
          description: newCampaign.description,
          message_template: newCampaign.message_template,
          created_by: user?.id
        });

      if (error) throw error;

      toast.success('Campaign created successfully');
      setShowNewCampaign(false);
      setNewCampaign({ name: '', description: '', message_template: '' });
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const importContacts = async (source: 'manual' | 'csv' | 'crm') => {
    if (!selectedCampaign) return;

    setLoading(true);
    try {
      let contacts: any[] = [];

      if (source === 'manual') {
        // Parse manual input (one phone per line, optionally with name)
        contacts = manualContacts.split('\n').filter(line => line.trim()).map(line => {
          const parts = line.trim().split(/[,\t]/);
          return {
            phone_number: parts[0]?.trim(),
            first_name: parts[1]?.trim() || null,
            last_name: parts[2]?.trim() || null
          };
        });
      } else if (source === 'csv' && csvFile) {
        // Parse CSV file
        const text = await csvFile.text();
        const lines = text.split('\n');
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length >= 1 && values[0]) {
            const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));
            const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('first'));
            const lastNameIndex = headers.findIndex(h => h.includes('last'));

            contacts.push({
              phone_number: values[phoneIndex >= 0 ? phoneIndex : 0],
              first_name: nameIndex >= 0 ? values[nameIndex] : null,
              last_name: lastNameIndex >= 0 ? values[lastNameIndex] : null
            });
          }
        }
      }

      const { data, error } = await supabase.functions.invoke('telegram-import-contacts', {
        body: { 
          campaign_id: selectedCampaign.id, 
          contacts, 
          source 
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Imported ${data.imported} contacts${data.skipped > 0 ? ` (${data.skipped} skipped)` : ''}`);
        setShowAddContacts(false);
        setManualContacts('');
        setCsvFile(null);
        fetchContacts(selectedCampaign.id);
        fetchCampaigns();
      } else {
        throw new Error(data?.error || 'Failed to import contacts');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import contacts');
    } finally {
      setLoading(false);
    }
  };

  const startCampaign = async (campaignId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bulk-send', {
        body: { campaign_id: campaignId, action: 'start' }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Sent ${data.sent} messages (${data.remaining} remaining)`);
        fetchCampaigns();
        if (selectedCampaign?.id === campaignId) {
          fetchContacts(campaignId);
        }
      } else {
        throw new Error(data?.error || 'Failed to start campaign');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start campaign');
    } finally {
      setLoading(false);
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bulk-send', {
        body: { campaign_id: campaignId, action: 'pause' }
      });

      if (error) throw error;

      toast.success('Campaign paused');
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message || 'Failed to pause campaign');
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const { error } = await supabase
        .from('telegram_bulk_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast.success('Campaign deleted');
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign(null);
        setContacts([]);
      }
      fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete campaign');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      draft: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      scheduled: { variant: 'outline', icon: <Clock className="w-3 h-3" /> },
      running: { variant: 'default', icon: <Play className="w-3 h-3" /> },
      paused: { variant: 'outline', icon: <Pause className="w-3 h-3" /> },
      completed: { variant: 'default', icon: <CheckCircle2 className="w-3 h-3" /> },
      failed: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      sent: { variant: 'default', icon: <CheckCircle2 className="w-3 h-3" /> },
      delivered: { variant: 'default', icon: <CheckCircle2 className="w-3 h-3" /> },
      not_found: { variant: 'outline', icon: <XCircle className="w-3 h-3" /> }
    };
    
    const config = variants[status] || { variant: 'secondary' as const, icon: null };
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Telegram Bulk Messaging</h1>
          <p className="text-muted-foreground">Send messages to contacts via phone number lookup</p>
        </div>
          <div className="flex gap-2">
            <Button onClick={() => fetchCampaigns()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
              <DialogTrigger asChild>
                <Button disabled={!isAuthenticated}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                  <DialogDescription>Set up a new bulk messaging campaign</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Campaign Name *</Label>
                    <Input 
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      placeholder="Summer Promotion 2024"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input 
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <div>
                    <Label>Message Template *</Label>
                    <Textarea 
                      value={newCampaign.message_template}
                      onChange={(e) => setNewCampaign({ ...newCampaign, message_template: e.target.value })}
                      placeholder="Hello {first_name}! ..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {'{first_name}'}, {'{last_name}'} for personalization
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewCampaign(false)}>Cancel</Button>
                  <Button onClick={createCampaign} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Campaign'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!isAuthenticated && (
          <Card className="border-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Authenticate Telegram Account
              </CardTitle>
              <CardDescription>
                Connect your Telegram account to send messages to users by phone number
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {authStep === 'phone' && (
                <div className="flex gap-2">
                  <Input
                    placeholder="+1234567890"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button onClick={requestAuthCode} disabled={loading}>
                    {loading ? 'Sending...' : 'Send Code'}
                  </Button>
                </div>
              )}
              {authStep === 'code' && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter verification code"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button onClick={verifyAuthCode} disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isAuthenticated && (
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium">Telegram Connected:</span>
                <span className="text-muted-foreground">{authPhone}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaigns List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {campaigns.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No campaigns yet</p>
              ) : (
                campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    onClick={() => setSelectedCampaign(campaign)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCampaign?.id === campaign.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.total_contacts} contacts
                        </p>
                      </div>
                      {getStatusBadge(campaign.status)}
                    </div>
                    {campaign.total_contacts > 0 && (
                      <Progress 
                        value={(campaign.sent_count / campaign.total_contacts) * 100} 
                        className="h-1 mt-2"
                      />
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Campaign Details */}
          <Card className="lg:col-span-2">
            {selectedCampaign ? (
              <>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedCampaign.name}</CardTitle>
                      <CardDescription>{selectedCampaign.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {(selectedCampaign.status === 'draft' || selectedCampaign.status === 'paused') && (
                        <Button 
                          onClick={() => startCampaign(selectedCampaign.id)}
                          disabled={loading || selectedCampaign.total_contacts === 0}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </Button>
                      )}
                      {selectedCampaign.status === 'running' && (
                        <Button 
                          onClick={() => pauseCampaign(selectedCampaign.id)}
                          variant="outline"
                          disabled={loading}
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => deleteCampaign(selectedCampaign.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{selectedCampaign.total_contacts}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{selectedCampaign.sent_count}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedCampaign.delivered_count}</p>
                      <p className="text-xs text-muted-foreground">Delivered</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{selectedCampaign.failed_count}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  </div>

                  {/* Message Template */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Message Template:</p>
                    <p className="whitespace-pre-wrap">{selectedCampaign.message_template}</p>
                  </div>

                  {/* Contacts Tab */}
                  <Tabs defaultValue="contacts">
                    <div className="flex items-center justify-between">
                      <TabsList>
                        <TabsTrigger value="contacts">
                          <Users className="w-4 h-4 mr-2" />
                          Contacts ({contacts.length})
                        </TabsTrigger>
                      </TabsList>
                      <Dialog open={showAddContacts} onOpenChange={setShowAddContacts}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Contacts
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Add Contacts</DialogTitle>
                            <DialogDescription>Import contacts for this campaign</DialogDescription>
                          </DialogHeader>
                          <Tabs defaultValue="manual">
                            <TabsList className="grid grid-cols-3 w-full">
                              <TabsTrigger value="manual">Manual</TabsTrigger>
                              <TabsTrigger value="csv">CSV</TabsTrigger>
                              <TabsTrigger value="crm">CRM</TabsTrigger>
                            </TabsList>
                            <TabsContent value="manual" className="space-y-4">
                              <div>
                                <Label>Phone Numbers</Label>
                                <Textarea
                                  value={manualContacts}
                                  onChange={(e) => setManualContacts(e.target.value)}
                                  placeholder="+1234567890, John, Doe&#10;+9876543210, Jane"
                                  rows={6}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  One per line: phone, first_name, last_name (comma separated)
                                </p>
                              </div>
                              <Button onClick={() => importContacts('manual')} disabled={loading} className="w-full">
                                {loading ? 'Importing...' : 'Import Contacts'}
                              </Button>
                            </TabsContent>
                            <TabsContent value="csv" className="space-y-4">
                              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                                <Input
                                  type="file"
                                  accept=".csv"
                                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                  className="max-w-xs mx-auto"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                  CSV with columns: phone, first_name, last_name
                                </p>
                              </div>
                              <Button 
                                onClick={() => importContacts('csv')} 
                                disabled={loading || !csvFile}
                                className="w-full"
                              >
                                {loading ? 'Importing...' : 'Upload & Import'}
                              </Button>
                            </TabsContent>
                            <TabsContent value="crm" className="space-y-4">
                              <div className="text-center py-4">
                                <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                                <p>Import contacts from your CRM database</p>
                                <p className="text-xs text-muted-foreground">
                                  All contacts with phone numbers will be imported
                                </p>
                              </div>
                              <Button onClick={() => importContacts('crm')} disabled={loading} className="w-full">
                                {loading ? 'Importing...' : 'Import from CRM'}
                              </Button>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <TabsContent value="contacts">
                      <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Phone</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Sent At</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {contacts.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                  No contacts added yet
                                </TableCell>
                              </TableRow>
                            ) : (
                              contacts.map((contact) => (
                                <TableRow key={contact.id}>
                                  <TableCell className="font-mono text-sm">{contact.phone_number}</TableCell>
                                  <TableCell>
                                    {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '-'}
                                  </TableCell>
                                  <TableCell>{getStatusBadge(contact.status)}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {contact.sent_at ? new Date(contact.sent_at).toLocaleString() : '-'}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[400px]">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a campaign to view details</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
  );
}
