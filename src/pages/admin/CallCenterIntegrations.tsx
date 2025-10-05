import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Phone, Plus, Edit, Trash2, Server } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHelp } from "@/components/PageHelp";

interface Integration {
  id: string;
  company_id: string;
  provider: string;
  account_sid: string | null;
  phone_number: string | null;
  api_key_encrypted: string | null;
  webhook_url: string | null;
  configuration: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CallCenterIntegrations() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState({
    provider: "freepbx",
    account_sid: "",
    phone_number: "",
    api_key: "",
    webhook_url: "",
    sip_server: "",
    sip_domain: "",
    sip_port: "5060",
    sip_transport: "UDP",
    configuration: {} as any,
    is_active: true,
  });

  const { data: integrations, isLoading } = useQuery({
    queryKey: ["call-center-integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_center_integrations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Integration[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("company_id")
        .single();

      if (roleError) throw roleError;

      const { data: result, error } = await supabase
        .from("call_center_integrations")
        .insert([{
          company_id: userRole.company_id,
          provider: data.provider,
          account_sid: data.account_sid || null,
          phone_number: data.phone_number || null,
          api_key_encrypted: data.api_key || null,
          webhook_url: data.webhook_url || null,
          configuration: {
            sip_server: data.sip_server,
            sip_domain: data.sip_domain,
            sip_port: data.sip_port,
            sip_transport: data.sip_transport,
            ...data.configuration,
          },
          is_active: data.is_active,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-center-integrations"] });
      toast.success("Integration created successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to create integration: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { data: result, error } = await supabase
        .from("call_center_integrations")
        .update({
          provider: data.provider,
          account_sid: data.account_sid || null,
          phone_number: data.phone_number || null,
          api_key_encrypted: data.api_key || null,
          webhook_url: data.webhook_url || null,
          configuration: {
            sip_server: data.sip_server,
            sip_domain: data.sip_domain,
            sip_port: data.sip_port,
            sip_transport: data.sip_transport,
            ...data.configuration,
          },
          is_active: data.is_active,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-center-integrations"] });
      toast.success("Integration updated successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to update integration: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("call_center_integrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-center-integrations"] });
      toast.success("Integration deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete integration: ${error.message}`);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("call_center_integrations")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-center-integrations"] });
      toast.success("Integration status updated");
    },
    onError: (error: any) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      provider: "freepbx",
      account_sid: "",
      phone_number: "",
      api_key: "",
      webhook_url: "",
      sip_server: "",
      sip_domain: "",
      sip_port: "5060",
      sip_transport: "UDP",
      configuration: {},
      is_active: true,
    });
    setEditingIntegration(null);
  };

  const handleEdit = (integration: Integration) => {
    setEditingIntegration(integration);
    setFormData({
      provider: integration.provider,
      account_sid: integration.account_sid || "",
      phone_number: integration.phone_number || "",
      api_key: integration.api_key_encrypted || "",
      webhook_url: integration.webhook_url || "",
      sip_server: integration.configuration?.sip_server || "",
      sip_domain: integration.configuration?.sip_domain || "",
      sip_port: integration.configuration?.sip_port || "5060",
      sip_transport: integration.configuration?.sip_transport || "UDP",
      configuration: integration.configuration || {},
      is_active: integration.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIntegration) {
      updateMutation.mutate({ id: editingIntegration.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Server className="h-8 w-8" />
            Call Center Integrations
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage telephony system integrations and SIP configurations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIntegration ? "Edit Integration" : "Add New Integration"}
              </DialogTitle>
              <DialogDescription>
                Configure your telephony system integration settings
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="sip">SIP Settings</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider Type</Label>
                    <Select
                      value={formData.provider}
                      onValueChange={(value) => setFormData({ ...formData, provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freepbx">FreePBX Server</SelectItem>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="voip.ms">VoIP.ms</SelectItem>
                        <SelectItem value="custom">Custom SIP Provider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      placeholder="+1234567890"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_sid">Account SID / Username</Label>
                    <Input
                      id="account_sid"
                      placeholder="Account identifier"
                      value={formData.account_sid}
                      onChange={(e) => setFormData({ ...formData, account_sid: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api_key">API Key / Password</Label>
                    <Input
                      id="api_key"
                      type="password"
                      placeholder="••••••••"
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </TabsContent>

                <TabsContent value="sip" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="sip_server">SIP Server</Label>
                    <Input
                      id="sip_server"
                      placeholder="sip.example.com or 192.168.1.100"
                      value={formData.sip_server}
                      onChange={(e) => setFormData({ ...formData, sip_server: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sip_domain">SIP Domain</Label>
                    <Input
                      id="sip_domain"
                      placeholder="example.com"
                      value={formData.sip_domain}
                      onChange={(e) => setFormData({ ...formData, sip_domain: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sip_port">SIP Port</Label>
                      <Input
                        id="sip_port"
                        placeholder="5060"
                        value={formData.sip_port}
                        onChange={(e) => setFormData({ ...formData, sip_port: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sip_transport">Transport</Label>
                      <Select
                        value={formData.sip_transport}
                        onValueChange={(value) => setFormData({ ...formData, sip_transport: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UDP">UDP</SelectItem>
                          <SelectItem value="TCP">TCP</SelectItem>
                          <SelectItem value="TLS">TLS</SelectItem>
                          <SelectItem value="WSS">WebSocket (WSS)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.provider === "freepbx" && (
                    <div className="bg-primary/5 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">FreePBX Configuration Tips:</h4>
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        <li>Enable WebRTC module in FreePBX</li>
                        <li>Configure WebSocket transport (usually port 8089)</li>
                        <li>Ensure valid SSL certificate for WSS connections</li>
                        <li>Create SIP extensions for each agent</li>
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook_url">Webhook URL</Label>
                    <Input
                      id="webhook_url"
                      placeholder="https://your-domain.com/webhook"
                      value={formData.webhook_url}
                      onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      URL to receive call events and notifications
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="configuration">Additional Configuration (JSON)</Label>
                    <Textarea
                      id="configuration"
                      placeholder='{"key": "value"}'
                      value={JSON.stringify(formData.configuration, null, 2)}
                      onChange={(e) => {
                        try {
                          const config = JSON.parse(e.target.value);
                          setFormData({ ...formData, configuration: config });
                        } catch (error) {
                          // Invalid JSON, ignore
                        }
                      }}
                      className="font-mono text-sm"
                      rows={6}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingIntegration ? "Update" : "Create"} Integration
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <PageHelp
        title="Call Center Integrations"
        description="Manage telephony system integrations and SIP configurations"
        features={[
          "Configure multiple telephony providers",
          "FreePBX server integration with WebRTC support",
          "Third-party SIP provider configuration",
          "Manage SIP credentials and server settings",
          "Webhook integration for call events",
          "Enable/disable integrations on demand",
        ]}
        tips={[
          "Test connections after configuring integrations",
          "Use WSS transport for secure WebRTC connections",
          "Configure webhooks for real-time call events",
          "Keep SIP credentials secure and encrypted",
        ]}
      />

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading integrations...</p>
            </div>
          </CardContent>
        </Card>
      ) : integrations && integrations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg capitalize">{integration.provider}</CardTitle>
                      <CardDescription>{integration.phone_number || "No phone number"}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={integration.is_active}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({ id: integration.id, is_active: checked })
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Server:</span>
                    <span className="font-mono">{integration.configuration?.sip_server || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Domain:</span>
                    <span className="font-mono">{integration.configuration?.sip_domain || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transport:</span>
                    <span className="font-mono">{integration.configuration?.sip_transport || "UDP"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={integration.is_active ? "text-green-600" : "text-red-600"}>
                      {integration.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(integration)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this integration?")) {
                        deleteMutation.mutate(integration.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Server className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Integrations Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first telephony integration
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
