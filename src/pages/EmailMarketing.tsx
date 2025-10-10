import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, Plus, Trash2, Send, Calendar, TrendingUp, Users, Phone, Clock, Eye, MousePointer, Play } from "lucide-react";
import { PageHelp } from "@/components/PageHelp";
import { useEngagementTracker } from "@/hooks/useEngagementTracker";
import ContactsManager from "@/components/email/ContactsManager";
import CampaignScheduler from "@/components/email/CampaignScheduler";
import EmailAnalytics from "@/components/email/EmailAnalytics";
import { format } from "date-fns";

export default function EmailMarketing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useEngagementTracker();

  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isCallCampaignDialogOpen, setIsCallCampaignDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<any>(null);
  const [testEmail, setTestEmail] = useState("");

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    body_html: "",
  });

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    subject: "",
    content: "",
    template_id: "",
    scheduled_for: null as Date | null,
  });

  const [newCallCampaign, setNewCallCampaign] = useState({
    name: "",
    description: "",
    campaign_type: "one_time",
    scheduled_at: "",
  });

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', session.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['email-templates', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['email-campaigns', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*, email_templates(*)')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: callCampaigns = [] } = useQuery({
    queryKey: ['call-campaigns', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('call_campaigns')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const { data: callLogs = [] } = useQuery({
    queryKey: ['call-logs', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return [];
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (template: typeof newTemplate) => {
      const { error } = await supabase
        .from('email_templates')
        .insert([{
          ...template,
          company_id: profile?.company_id,
          created_by: session?.user?.id,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({ title: "Template created successfully" });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: typeof newCampaign) => {
      const { error } = await supabase
        .from('email_campaigns')
        .insert([{
          ...campaign,
          scheduled_for: campaign.scheduled_for?.toISOString(),
          company_id: profile?.company_id,
          created_by: session?.user?.id,
          status: campaign.scheduled_for ? 'scheduled' : 'draft',
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({ title: "Campaign created successfully" });
      setIsCampaignDialogOpen(false);
      resetCampaignForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createCallCampaignMutation = useMutation({
    mutationFn: async (campaign: typeof newCallCampaign) => {
      const { error } = await supabase
        .from('call_campaigns')
        .insert([{
          ...campaign,
          company_id: profile?.company_id,
          created_by: session?.user?.id,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-campaigns'] });
      toast({ title: "Call campaign created successfully" });
      setIsCallCampaignDialogOpen(false);
      resetCallCampaignForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({ title: "Template deleted" });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({ title: "Campaign deleted" });
    },
  });

  const deleteCallCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('call_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-campaigns'] });
      toast({ title: "Call campaign deleted" });
    },
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async ({ campaignId, testMode, testEmail }: { campaignId: string, testMode?: boolean, testEmail?: string }) => {
      const { data, error } = await supabase.functions.invoke('send-marketing-email', {
        body: { campaignId, testMode, testEmail },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({
        title: "Success",
        description: variables.testMode 
          ? "Test email sent successfully" 
          : `Campaign sent to ${data.sentCount} contacts`,
      });
      setIsPreviewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTemplateMutation.mutate(newTemplate);
  };

  const handleCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaignMutation.mutate(newCampaign);
  };

  const handleCallCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCallCampaignMutation.mutate(newCallCampaign);
  };

  const resetTemplateForm = () => {
    setNewTemplate({ name: "", subject: "", body_html: "" });
  };

  const resetCampaignForm = () => {
    setNewCampaign({ name: "", subject: "", content: "", template_id: "", scheduled_for: null });
  };

  const resetCallCampaignForm = () => {
    setNewCallCampaign({ name: "", description: "", campaign_type: "one_time", scheduled_at: "" });
  };

  const handlePreview = (campaign: any) => {
    setPreviewCampaign(campaign);
    setIsPreviewDialogOpen(true);
  };

  const handleSendTest = () => {
    if (previewCampaign && testEmail) {
      sendCampaignMutation.mutate({
        campaignId: previewCampaign.id,
        testMode: true,
        testEmail,
      });
    }
  };

  const handleSendCampaign = (campaignId: string) => {
    sendCampaignMutation.mutate({ campaignId });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      draft: "secondary",
      scheduled: "default",
      sent: "default",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getCallOutcomeBadge = (outcome: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      answered: "default",
      no_answer: "secondary",
      busy: "secondary",
      failed: "destructive",
    };
    return <Badge variant={variants[outcome] || "secondary"}>{outcome}</Badge>;
  };

  const campaignStats = {
    total: campaigns.length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    totalSent: campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0),
    totalOpened: campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0),
    totalClicked: campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0),
    openRate: campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0) > 0
      ? ((campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0) / campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)) * 100).toFixed(1)
      : '0.0',
    clickRate: campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0) > 0
      ? ((campaigns.reduce((sum, c) => sum + (c.clicked_count || 0), 0) / campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)) * 100).toFixed(1)
      : '0.0',
  };

  const callStats = {
    total: callCampaigns.length,
    active: callCampaigns.filter(c => c.status === 'active').length,
    totalCalls: callCampaigns.reduce((sum, c) => sum + (c.calls_made || 0), 0),
    completedCalls: callCampaigns.reduce((sum, c) => sum + (c.calls_completed || 0), 0),
    leadsGenerated: callCampaigns.reduce((sum, c) => sum + (c.leads_generated || 0), 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHelp
        title="Email & Call Marketing"
        description="Create and manage email and call campaigns to reach your customers. Track campaign performance with detailed analytics."
        features={[
          "Design email campaigns with custom templates",
          "Schedule and manage call campaigns",
          "Track email open rates and click-through rates",
          "Monitor call campaign performance and outcomes",
          "Manage contact lists and segments",
          "Send test emails before launching campaigns"
        ]}
        tips={[
          "Test email templates before sending large campaigns",
          "Schedule campaigns for optimal sending times",
          "Use call scripts to maintain consistent messaging",
          "Review analytics regularly to optimize campaign strategies",
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marketing Campaigns</h1>
          <p className="text-muted-foreground mt-1">Manage email and call campaigns with analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {campaignStats.sent} sent • {campaignStats.draft} draft
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.totalSent}</div>
            <p className="text-xs text-muted-foreground mt-1">Total emails delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.openRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{campaignStats.totalOpened} opens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.clickRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{campaignStats.totalClicked} clicks</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Email Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="call_campaigns">Call Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Email Campaign</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCampaignSubmit} className="space-y-4">
                  <div>
                    <Label>Campaign Name *</Label>
                    <Input
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Subject *</Label>
                    <Input
                      value={newCampaign.subject}
                      onChange={(e) => setNewCampaign({ ...newCampaign, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Template</Label>
                    <Select
                      value={newCampaign.template_id}
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, template_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Content *</Label>
                    <Textarea
                      value={newCampaign.content}
                      onChange={(e) => setNewCampaign({ ...newCampaign, content: e.target.value })}
                      rows={6}
                      placeholder="Email content (supports HTML)"
                      required
                    />
                  </div>
                  <CampaignScheduler
                    scheduledFor={newCampaign.scheduled_for}
                    onScheduleChange={(date) => setNewCampaign({ ...newCampaign, scheduled_for: date })}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCampaignDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createCampaignMutation.isPending}>
                      Create Campaign
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email Campaigns</CardTitle>
              <CardDescription>Manage and track your email campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Clicked</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No campaigns yet. Create your first campaign to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.subject}</TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>{campaign.sent_count || 0}</TableCell>
                        <TableCell>{campaign.opened_count || 0}</TableCell>
                        <TableCell>{campaign.clicked_count || 0}</TableCell>
                        <TableCell>{format(new Date(campaign.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(campaign)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {campaign.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendCampaign(campaign.id)}
                                disabled={sendCampaignMutation.isPending}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <EmailAnalytics campaigns={campaigns} />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Contacts</CardTitle>
              <CardDescription>Manage your email marketing contacts</CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.company_id && <ContactsManager companyId={profile.company_id} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="call_campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCallCampaignDialogOpen} onOpenChange={setIsCallCampaignDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Call Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Call Campaign</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCallCampaignSubmit} className="space-y-4">
                  <div>
                    <Label>Campaign Name *</Label>
                    <Input
                      value={newCallCampaign.name}
                      onChange={(e) => setNewCallCampaign({ ...newCallCampaign, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newCallCampaign.description}
                      onChange={(e) => setNewCallCampaign({ ...newCallCampaign, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Campaign Type</Label>
                    <Select
                      value={newCallCampaign.campaign_type}
                      onValueChange={(value) => setNewCallCampaign({ ...newCallCampaign, campaign_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_time">One Time</SelectItem>
                        <SelectItem value="recurring">Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCallCampaignDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createCallCampaignMutation.isPending}>
                      Create Campaign
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Call Campaigns</CardTitle>
              <CardDescription>Manage your call center campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Calls Made</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callCampaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No call campaigns yet. Create your first campaign to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    callCampaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.campaign_type}</TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>{campaign.calls_made || 0}</TableCell>
                        <TableCell>{campaign.calls_completed || 0}</TableCell>
                        <TableCell>{campaign.leads_generated || 0}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCallCampaignMutation.mutate(campaign.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Email Template</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTemplateSubmit} className="space-y-4">
                  <div>
                    <Label>Template Name *</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Subject *</Label>
                    <Input
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Content *</Label>
                    <Textarea
                      value={newTemplate.body_html}
                      onChange={(e) => setNewTemplate({ ...newTemplate, body_html: e.target.value })}
                      rows={8}
                      placeholder="Email template content (supports HTML)"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTemplateMutation.isPending}>
                      Create Template
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Manage your reusable email templates</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No templates yet. Create your first template to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.subject}</TableCell>
                        <TableCell>{format(new Date(template.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
      </Tabs>

      {/* Preview & Send Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Campaign Preview & Send</DialogTitle>
          </DialogHeader>
          {previewCampaign && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted">
                <div className="mb-2">
                  <strong>Subject:</strong> {previewCampaign.subject}
                </div>
                <div className="border-t pt-4 mt-4">
                <div dangerouslySetInnerHTML={{ 
                    __html: previewCampaign.email_templates?.body_html || previewCampaign.content 
                  }} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Send Test Email</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button
                    onClick={handleSendTest}
                    disabled={!testEmail || sendCampaignMutation.isPending}
                  >
                    Send Test
                  </Button>
                </div>
              </div>
              {previewCampaign.status === 'draft' && (
                <Button
                  className="w-full"
                  onClick={() => handleSendCampaign(previewCampaign.id)}
                  disabled={sendCampaignMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Campaign to All Contacts
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}