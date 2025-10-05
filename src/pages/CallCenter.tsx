import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, PhoneCall, PhoneOff, Clock, Users, TrendingUp, List, UserCheck, PauseCircle, Hash, Ban, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHelp } from "@/components/PageHelp";
import Softphone from "@/components/call-center/Softphone";
import SipSettings from "@/components/call-center/SipSettings";
import ExtensionAuth from "@/components/call-center/ExtensionAuth";
import { useAuth } from "@/hooks/useAuth";

export default function CallCenter() {
  const { user } = useAuth();
  const [sipConfig, setSipConfig] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [agentExtension, setAgentExtension] = useState<string>("");

  // Fetch company integration config
  const { data: companyIntegration } = useQuery({
    queryKey: ["company-integration"],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!userRole?.company_id) return null;

      const { data, error } = await supabase
        .from("call_center_integrations")
        .select("*")
        .eq("company_id", userRole.company_id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    // Priority: Company integration > localStorage
    if (companyIntegration?.configuration) {
      const configuration = companyIntegration.configuration as Record<string, any>;
      const config = {
        sipServer: configuration.sip_server || "",
        sipUser: agentExtension || companyIntegration.account_sid || "",
        sipPassword: companyIntegration.api_key_encrypted || "",
        sipDomain: configuration.sip_domain || "",
      };
      setSipConfig(config);
    } else {
      const savedConfig = localStorage.getItem("sip-config");
      if (savedConfig) {
        setSipConfig(JSON.parse(savedConfig));
      }
    }
  }, [companyIntegration, agentExtension]);

  const { data: callStats } = useQuery({
    queryKey: ["call-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("call_logs")
        .select("*")
        .gte("created_at", today.toISOString());

      if (error) throw error;

      const total = data.length;
      const completed = data.filter((log) => log.call_status === "completed").length;
      const active = data.filter((log) => log.call_status === "active").length;
      const avgDuration =
        data.reduce((sum, log) => sum + (log.call_duration_seconds || 0), 0) / total || 0;

      return { total, completed, active, avgDuration };
    },
  });

  const { data: recentCalls, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["recent-calls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const handleSaveSipConfig = (config: any) => {
    setSipConfig(config);
  };

  const handleCallStart = (phoneNumber: string) => {
    console.log("Call started:", phoneNumber);
  };

  const handleCallEnd = async (duration: number) => {
    if (!user || !agentExtension) return;

    const { data: userRole } = await supabase
      .from("user_roles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (!userRole) return;

    await supabase.from("call_logs").insert({
      phone_number: "Unknown",
      call_duration_seconds: duration,
      call_status: "completed",
      agent_id: user.id,
      agent_name: `${user.user_metadata?.full_name || user.email} (Ext: ${agentExtension})`,
      company_id: userRole.company_id,
      call_started_at: new Date(Date.now() - duration * 1000).toISOString(),
    });
  };

  const handleExtensionAuth = (extension: string) => {
    setAgentExtension(extension);
    setIsAuthenticated(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <PhoneCall className="h-8 w-8" />
            Call Center
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAuthenticated
              ? `Agent Extension: ${agentExtension} | Manage calls and operations`
              : "Authentication required to access call center"}
          </p>
        </div>
        {isAuthenticated && (
          <Badge variant="default" className="text-sm">
            <Users className="h-4 w-4 mr-1" />
            Extension: {agentExtension}
          </Badge>
        )}
      </div>

      <PageHelp
        title="Call Center"
        description="Complete call center solution with extension-based authentication and integrated softphone"
        features={[
          "Authenticate with your extension number",
          "Access integrated softphone for making calls",
          "View real-time call statistics and metrics",
          "Track call logs and performance metrics",
          "Monitor agent activity and call outcomes",
          "Manage call campaigns and follow-ups",
        ]}
        tips={[
          "Enter your extension to access the softphone",
          "Configure SIP settings before making calls",
          "Calls are automatically logged with your extension",
          "Use tabs to navigate between different features",
        ]}
      />

      {!isAuthenticated ? (
        <ExtensionAuth onAuthenticate={handleExtensionAuth} />
      ) : (
        <>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted-foreground"></div>
                <span className="text-2xl font-bold">{agentExtension}</span>
              </div>
              <Badge variant="secondary" className="text-sm">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Agent'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant="outline">Offline</Badge>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls Today</CardTitle>
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{callStats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {callStats?.completed || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{callStats?.active || 0}</div>
                <p className="text-xs text-muted-foreground">Currently in progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {callStats?.avgDuration ? `${Math.floor(callStats.avgDuration / 60)}m` : "0m"}
                </div>
                <p className="text-xs text-muted-foreground">Average per call</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {callStats?.total
                    ? `${Math.round((callStats.completed / callStats.total) * 100)}%`
                    : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">Call completion rate</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="softphone" className="w-full">
            <TabsList className="w-full h-auto p-0 bg-transparent border-b justify-start gap-0">
              <TabsTrigger 
                value="softphone" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-base font-medium"
              >
                Soft Phone
              </TabsTrigger>
              <TabsTrigger 
                value="call-status" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
              >
                Call Status
              </TabsTrigger>
              <TabsTrigger 
                value="call-list" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
              >
                Call List
              </TabsTrigger>
              <TabsTrigger 
                value="agent-logon" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
              >
                <PauseCircle className="h-4 w-4 mr-2" />
                Agent Logon
              </TabsTrigger>
              <TabsTrigger 
                value="pauses" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
              >
                Pauses
              </TabsTrigger>
              <TabsTrigger 
                value="dialout" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
              >
                <Phone className="h-4 w-4 mr-2" />
                Dialout
              </TabsTrigger>
              <TabsTrigger 
                value="blacklist" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
              >
                Blacklist
              </TabsTrigger>
              <TabsTrigger 
                value="cases" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 text-base font-normal text-muted-foreground data-[state=active]:text-foreground"
              >
                <FileText className="h-4 w-4 mr-2" />
                Cases
              </TabsTrigger>
            </TabsList>

            <TabsContent value="softphone" className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <Softphone
                    sipConfig={sipConfig}
                    onCallStart={handleCallStart}
                    onCallEnd={handleCallEnd}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                  />
                </div>

                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Call Logs</CardTitle>
                      <CardDescription>View your recent call activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingLogs ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </div>
                      ) : recentCalls && recentCalls.length > 0 ? (
                        <div className="space-y-4">
                          {recentCalls.map((call) => (
                            <div
                              key={call.id}
                              className="flex items-center justify-between p-4 border rounded-lg"
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`p-2 rounded-full ${
                                    call.call_status === "completed"
                                      ? "bg-green-100 dark:bg-green-950"
                                      : "bg-red-100 dark:bg-red-950"
                                  }`}
                                >
                                  {call.call_status === "completed" ? (
                                    <PhoneCall className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <PhoneOff className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{call.phone_number}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {call.agent_name || "Unknown Agent"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={
                                    call.call_status === "completed" ? "default" : "secondary"
                                  }
                                >
                                  {call.call_status}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {call.call_duration_seconds
                                    ? `${Math.floor(call.call_duration_seconds / 60)}m ${
                                        call.call_duration_seconds % 60
                                      }s`
                                    : "N/A"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No call logs found
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="call-status">
              <Card>
                <CardHeader>
                  <CardTitle>Call Status</CardTitle>
                  <CardDescription>
                    Monitor real-time call status and agent availability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Call status monitoring coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="call-list">
              <Card>
                <CardHeader>
                  <CardTitle>Call List</CardTitle>
                  <CardDescription>Manage call queues and scheduled calls</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Call list management coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agent-logon">
              <Card>
                <CardHeader>
                  <CardTitle>Agent Logon</CardTitle>
                  <CardDescription>Manage agent sessions and availability status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-muted-foreground">
                            Extension: {agentExtension}
                          </p>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAuthenticated(false);
                        setAgentExtension("");
                      }}
                      className="w-full"
                    >
                      <PhoneOff className="mr-2 h-4 w-4" />
                      Logout from Extension
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pauses">
              <Card>
                <CardHeader>
                  <CardTitle>Pauses</CardTitle>
                  <CardDescription>Manage break times and agent availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Pause management coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dialout">
              <Card>
                <CardHeader>
                  <CardTitle>Dialout</CardTitle>
                  <CardDescription>Manual and automated dialing features</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Dialout features coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="blacklist">
              <Card>
                <CardHeader>
                  <CardTitle>Blacklist</CardTitle>
                  <CardDescription>Manage blocked numbers and DNC lists</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Blacklist management coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cases">
              <Card>
                <CardHeader>
                  <CardTitle>Cases</CardTitle>
                  <CardDescription>Manage support cases and tickets</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Case management coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg mt-6">
            <div className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              <span className="font-semibold">Dialpad</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
              <span className="font-semibold">{agentExtension}</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Phone className="h-5 w-5" />
              <span className="font-semibold">Active Calls (0)</span>
            </div>
          </div>
        </>
      )}

      <SipSettings
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onSave={handleSaveSipConfig}
        initialConfig={sipConfig}
      />
    </div>
  );
}
