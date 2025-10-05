import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Phone, PhoneCall, FileText, TrendingUp, Clock, Users, PlayCircle, Calendar, Search } from "lucide-react";
import { PageHelp } from "@/components/PageHelp";
import Softphone from "@/components/call-center/Softphone";
import SipSettings from "@/components/call-center/SipSettings";

export default function CallCenter() {
  const [search, setSearch] = useState("");
  const [newLogOpen, setNewLogOpen] = useState(false);
  const [newScriptOpen, setNewScriptOpen] = useState(false);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [sipSettingsOpen, setSipSettingsOpen] = useState(false);
  const [sipConfig, setSipConfig] = useState<any>(null);
  const [currentCallNumber, setCurrentCallNumber] = useState<string>("");
  const queryClient = useQueryClient();

  // Load SIP config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem("sip-config");
    if (savedConfig) {
      setSipConfig(JSON.parse(savedConfig));
    }
  }, []);

  const handleCallStart = (phoneNumber: string) => {
    setCurrentCallNumber(phoneNumber);
  };

  const handleCallEnd = async (duration: number) => {
    if (currentCallNumber) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user?.id)
          .single();

        await supabase.from("call_logs").insert({
          phone_number: currentCallNumber,
          contact_name: currentCallNumber,
          call_status: "completed",
          call_duration_seconds: duration,
          call_started_at: new Date(Date.now() - duration * 1000).toISOString(),
          company_id: profile?.company_id,
          agent_id: user?.id,
        });

        queryClient.invalidateQueries({ queryKey: ["call-logs"] });
        setCurrentCallNumber("");
      } catch (error) {
        console.error("Error logging call:", error);
      }
    }
  };

  // Fetch call logs
  const { data: callLogs = [] } = useQuery({
    queryKey: ["call-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch call scripts
  const { data: callScripts = [] } = useQuery({
    queryKey: ["call-scripts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_scripts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch call campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ["call-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create call log mutation
  const createCallLog = useMutation({
    mutationFn: async (values: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const { error } = await supabase.from("call_logs").insert({
        ...values,
        company_id: profile?.company_id,
        agent_id: user?.id,
        call_started_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-logs"] });
      toast.success("Call log created successfully");
      setNewLogOpen(false);
    },
  });

  // Create script mutation
  const createScript = useMutation({
    mutationFn: async (values: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const { error } = await supabase.from("call_scripts").insert({
        ...values,
        company_id: profile?.company_id,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-scripts"] });
      toast.success("Script created successfully");
      setNewScriptOpen(false);
    },
  });

  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (values: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const { error } = await supabase.from("call_campaigns").insert({
        ...values,
        company_id: profile?.company_id,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-campaigns"] });
      toast.success("Campaign created successfully");
      setNewCampaignOpen(false);
    },
  });

  const filteredLogs = callLogs.filter((log) =>
    log.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
    log.phone_number?.includes(search)
  );

  const stats = {
    totalCalls: callLogs.length,
    todayCalls: callLogs.filter(
      (log) => new Date(log.created_at).toDateString() === new Date().toDateString()
    ).length,
    avgDuration: Math.round(
      callLogs.reduce((sum, log) => sum + (log.call_duration_seconds || 0), 0) / callLogs.length || 0
    ),
    activeCampaigns: campaigns.filter((c) => c.status === "active").length,
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "default",
      missed: "destructive",
      voicemail: "secondary",
      busy: "outline",
    };
    return colors[status] || "outline";
  };

  return (
      <div className="container mx-auto p-6 space-y-6">
        <PageHelp
          title="Call Center with Integrated Softphone"
          description="Complete call center solution with built-in softphone for making/receiving calls, managing campaigns, and tracking performance. Connect via SIP or FreePBX."
          features={[
            "Integrated WebRTC softphone for voice calls",
            "SIP and FreePBX server support",
            "Make and receive calls directly from browser",
            "Real-time call controls (mute, hold, transfer)",
            "Automatic call logging and tracking",
            "Call campaigns and script management",
            "Monitor call durations and outcomes",
            "Track agent performance metrics"
          ]}
          tips={[
            "Configure SIP settings before making calls",
            "Use FreePBX integration for seamless PBX connection",
            "Allow microphone permissions for voice calls",
            "Calls are automatically logged to call history",
            "Use call scripts during active calls",
            "Monitor connection status in softphone header",
            "Use dialpad during calls for IVR navigation"
          ]}
        />
        
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Softphone Section */}
          <div className="lg:col-span-1">
            <Softphone 
              sipConfig={sipConfig}
              onCallStart={handleCallStart}
              onCallEnd={handleCallEnd}
              onOpenSettings={() => setSipSettingsOpen(true)}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Call Center</h1>
            <p className="text-muted-foreground">Manage calls, campaigns, and scripts</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={newLogOpen} onOpenChange={setNewLogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Phone className="mr-2 h-4 w-4" />
                  Log Call
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log New Call</DialogTitle>
                  <DialogDescription>Record details of a call</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createCallLog.mutate({
                      contact_name: formData.get("contact_name"),
                      phone_number: formData.get("phone_number"),
                      call_status: formData.get("call_status"),
                      call_outcome: formData.get("call_outcome"),
                      call_notes: formData.get("call_notes"),
                      call_duration_seconds: parseInt(formData.get("duration") as string) || 0,
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="contact_name">Contact Name</Label>
                    <Input id="contact_name" name="contact_name" required />
                  </div>
                  <div>
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input id="phone_number" name="phone_number" type="tel" required />
                  </div>
                  <div>
                    <Label htmlFor="call_status">Call Status</Label>
                    <Select name="call_status" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="missed">Missed</SelectItem>
                        <SelectItem value="voicemail">Voicemail</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="call_outcome">Outcome</Label>
                    <Input id="call_outcome" name="call_outcome" placeholder="e.g., Follow-up scheduled" />
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (seconds)</Label>
                    <Input id="duration" name="duration" type="number" min="0" />
                  </div>
                  <div>
                    <Label htmlFor="call_notes">Notes</Label>
                    <Textarea id="call_notes" name="call_notes" />
                  </div>
                  <Button type="submit">Log Call</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={newScriptOpen} onOpenChange={setNewScriptOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  New Script
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Call Script</DialogTitle>
                  <DialogDescription>Define a reusable call script</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createScript.mutate({
                      name: formData.get("name"),
                      script_type: formData.get("script_type"),
                      script_content: formData.get("script_content"),
                      opening_message: formData.get("opening_message"),
                      closing_message: formData.get("closing_message"),
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Script Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="script_type">Type</Label>
                    <Select name="script_type">
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="opening_message">Opening Message</Label>
                    <Textarea id="opening_message" name="opening_message" />
                  </div>
                  <div>
                    <Label htmlFor="script_content">Main Script</Label>
                    <Textarea id="script_content" name="script_content" rows={5} required />
                  </div>
                  <div>
                    <Label htmlFor="closing_message">Closing Message</Label>
                    <Textarea id="closing_message" name="closing_message" />
                  </div>
                  <Button type="submit">Create Script</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={newCampaignOpen} onOpenChange={setNewCampaignOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Call Campaign</DialogTitle>
                  <DialogDescription>Launch a new calling campaign</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createCampaign.mutate({
                      name: formData.get("name"),
                      description: formData.get("description"),
                      campaign_type: formData.get("campaign_type"),
                      start_date: formData.get("start_date"),
                      end_date: formData.get("end_date"),
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Campaign Name</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="campaign_type">Type</Label>
                    <Select name="campaign_type">
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_time">One-time</SelectItem>
                        <SelectItem value="recurring">Recurring</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input id="start_date" name="start_date" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input id="end_date" name="end_date" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" />
                  </div>
                  <Button type="submit">Create Campaign</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <PhoneCall className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCalls}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Calls</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCalls}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">Call Logs</TabsTrigger>
            <TabsTrigger value="scripts">Scripts</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by contact name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <Card key={log.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{log.contact_name}</CardTitle>
                          <CardDescription>{log.phone_number}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(log.call_status) as any}>
                        {log.call_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {log.call_outcome && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Outcome:</span>
                          <span>{log.call_outcome}</span>
                        </div>
                      )}
                      {log.call_duration_seconds && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{formatDuration(log.call_duration_seconds)}</span>
                        </div>
                      )}
                      {log.call_notes && (
                        <div>
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="mt-1">{log.call_notes}</p>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Logged: {new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredLogs.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <PhoneCall className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No call logs found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="scripts" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {callScripts.map((script) => (
                <Card key={script.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">{script.name}</CardTitle>
                        {script.script_type && (
                          <Badge variant="outline" className="mt-1">
                            {script.script_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      {script.opening_message && (
                        <div>
                          <span className="font-medium text-muted-foreground">Opening:</span>
                          <p className="mt-1">{script.opening_message}</p>
                        </div>
                      )}
                      {script.script_content && (
                        <div>
                          <span className="font-medium text-muted-foreground">Script:</span>
                          <p className="mt-1 line-clamp-3">{script.script_content}</p>
                        </div>
                      )}
                      <Button size="sm" variant="outline" className="w-full">
                        View Full Script
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {callScripts.length === 0 && (
                <Card className="md:col-span-2">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No scripts created yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PlayCircle className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-base">{campaign.name}</CardTitle>
                          <CardDescription>{campaign.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline">{campaign.campaign_type}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Calls Made:</span>
                        <span>{campaign.calls_made || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completed:</span>
                        <span>{campaign.calls_completed || 0}</span>
                      </div>
                      {campaign.leads_generated > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Leads:</span>
                          <Badge>{campaign.leads_generated}</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {campaigns.length === 0 && (
                <Card className="md:col-span-2">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <PlayCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No campaigns created yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
          </div>
        </div>

        {/* SIP Settings Dialog */}
        <SipSettings
          open={sipSettingsOpen}
          onOpenChange={setSipSettingsOpen}
          onSave={setSipConfig}
          initialConfig={sipConfig}
        />
      </div>
  );
}
