import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Mail, Send, FileText, TrendingUp } from "lucide-react";

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  template_type: string;
  is_active: boolean;
  created_at: string;
};

type EmailCampaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  recipients_count: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  created_at: string;
};

export default function EmailMarketing() {
  const queryClient = useQueryClient();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [templateData, setTemplateData] = useState({
    name: "",
    subject: "",
    body_html: "",
    template_type: "general",
  });
  const [campaignData, setCampaignData] = useState({
    name: "",
    subject: "",
    template_id: "",
  });

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["email_templates", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("email_templates" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as EmailTemplate[];
    },
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["email_campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_campaigns" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as EmailCampaign[];
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateData) => {
      const { error } = await supabase.from("email_templates" as any).insert({
        ...data,
        company_id: profile?.company_id,
        created_by: session?.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_templates"] });
      toast.success("Template created successfully");
      resetTemplateForm();
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: typeof campaignData) => {
      const { error } = await supabase.from("email_campaigns" as any).insert({
        ...data,
        company_id: profile?.company_id,
        created_by: session?.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_campaigns"] });
      toast.success("Campaign created successfully");
      resetCampaignForm();
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_templates"] });
      toast.success("Template deleted successfully");
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_campaigns" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email_campaigns"] });
      toast.success("Campaign deleted successfully");
    },
  });

  const handleTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTemplateMutation.mutate(templateData);
  };

  const handleCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaignMutation.mutate(campaignData);
  };

  const resetTemplateForm = () => {
    setTemplateData({
      name: "",
      subject: "",
      body_html: "",
      template_type: "general",
    });
    setTemplateDialogOpen(false);
  };

  const resetCampaignForm = () => {
    setCampaignData({
      name: "",
      subject: "",
      template_id: "",
    });
    setCampaignDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      scheduled: "secondary",
      sending: "secondary",
      sent: "default",
      paused: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const campaignStats = {
    total: campaigns.length,
    draft: campaigns.filter((c) => c.status === "draft").length,
    sent: campaigns.filter((c) => c.status === "sent").length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sent_count, 0),
    totalOpened: campaigns.reduce((sum, c) => sum + c.opened_count, 0),
    avgOpenRate: campaigns.length
      ? (
          (campaigns.reduce((sum, c) => sum + (c.sent_count ? (c.opened_count / c.sent_count) * 100 : 0), 0) /
            campaigns.length)
        ).toFixed(1)
      : 0,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Marketing</h1>
          <p className="text-muted-foreground mt-1">Manage email templates and campaigns</p>
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
            <CardTitle className="text-sm font-medium">Emails Opened</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.totalOpened}</div>
            <p className="text-xs text-muted-foreground mt-1">Recipients engaged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.avgOpenRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all campaigns</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search campaigns..." className="pl-8" />
            </div>
            <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetCampaignForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Email Campaign</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCampaignSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="campaign_name">Campaign Name *</Label>
                    <Input
                      id="campaign_name"
                      value={campaignData.name}
                      onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="campaign_subject">Subject *</Label>
                    <Input
                      id="campaign_subject"
                      value={campaignData.subject}
                      onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="template_id">Template</Label>
                    <Select
                      value={campaignData.template_id}
                      onValueChange={(value) => setCampaignData({ ...campaignData, template_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
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
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetCampaignForm}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Campaign</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        No campaigns found
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.subject}</TableCell>
                        <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                        <TableCell>{campaign.recipients_count}</TableCell>
                        <TableCell>{campaign.sent_count}</TableCell>
                        <TableCell>
                          {campaign.opened_count} (
                          {campaign.sent_count
                            ? ((campaign.opened_count / campaign.sent_count) * 100).toFixed(1)
                            : 0}
                          %)
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                          >
                            Delete
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
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetTemplateForm()}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Email Template</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTemplateSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="template_name">Template Name *</Label>
                    <Input
                      id="template_name"
                      value={templateData.name}
                      onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="template_type">Type *</Label>
                    <Select
                      value={templateData.template_type}
                      onValueChange={(value) => setTemplateData({ ...templateData, template_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="quote">Quote</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={templateData.subject}
                      onChange={(e) => setTemplateData({ ...templateData, subject: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="body_html">Email Body (HTML) *</Label>
                    <Textarea
                      id="body_html"
                      value={templateData.body_html}
                      onChange={(e) => setTemplateData({ ...templateData, body_html: e.target.value })}
                      rows={10}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use variables like {"{"}{"{"} customer_name {"}"}{"}"}, {"{"}{"{"} total_amount {"}"}{"}"}, etc.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetTemplateForm}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Template</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No templates found
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.template_type}</Badge>
                        </TableCell>
                        <TableCell>{template.subject}</TableCell>
                        <TableCell>
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                          >
                            Delete
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
    </div>
  );
}
