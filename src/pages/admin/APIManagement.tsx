import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Activity, Settings, Database, ArrowLeftRight } from "lucide-react";
import { IntegrationFields } from "@/components/admin/IntegrationFields";
import { IntegrationLogs } from "@/components/admin/IntegrationLogs";

interface ApiIntegration {
  id: string;
  name: string;
  description: string | null;
  integration_type: 'incoming' | 'outgoing' | 'bidirectional';
  base_url: string | null;
  auth_type: 'none' | 'api_key' | 'oauth2' | 'bearer_token' | 'basic_auth' | null;
  auth_config: any;
  headers: any;
  rate_limit: number | null;
  timeout_seconds: number;
  retry_attempts: number;
  is_active: boolean;
  webhook_url: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export default function APIManagement() {
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<ApiIntegration | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['api-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_integrations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ApiIntegration[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<ApiIntegration>) => {
      const insertData = {
        name: data.name!,
        integration_type: data.integration_type!,
        description: data.description || null,
        base_url: data.base_url || null,
        auth_type: data.auth_type || null,
        auth_config: data.auth_config || {},
        headers: data.headers || {},
        rate_limit: data.rate_limit || null,
        timeout_seconds: data.timeout_seconds || 30,
        retry_attempts: data.retry_attempts || 3,
        is_active: data.is_active ?? true,
        webhook_url: data.webhook_url || null,
        metadata: data.metadata || {},
      };
      
      const { error } = await supabase
        .from('api_integrations')
        .insert([insertData]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
      toast.success('Integration created successfully');
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create integration: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ApiIntegration> }) => {
      const { error } = await supabase
        .from('api_integrations')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
      toast.success('Integration updated successfully');
      setIsEditDialogOpen(false);
      setSelectedIntegration(null);
    },
    onError: (error) => {
      toast.error(`Failed to update integration: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_integrations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
      toast.success('Integration deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete integration: ${error.message}`);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('api_integrations')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incoming': return <ArrowLeftRight className="h-4 w-4 rotate-180" />;
      case 'outgoing': return <ArrowLeftRight className="h-4 w-4" />;
      case 'bidirectional': return <ArrowLeftRight className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Integration Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage all API integrations and their configurations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <IntegrationForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : !integrations || integrations.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No integrations configured yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(integration.integration_type)}
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={integration.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: integration.id, is_active: checked })
                      }
                    />
                    <Badge variant={integration.is_active ? "default" : "secondary"}>
                      {integration.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {integration.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{integration.integration_type}</Badge>
                  </div>
                  {integration.auth_type && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Auth:</span>
                      <Badge variant="outline">{integration.auth_type}</Badge>
                    </div>
                  )}
                  {integration.base_url && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">URL:</span>
                      <span className="truncate max-w-[150px]" title={integration.base_url}>
                        {integration.base_url}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedIntegration(integration);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedIntegration(integration);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this integration?')) {
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
      )}

      {selectedIntegration && !isEditDialogOpen && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedIntegration.name} - Advanced Settings</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIntegration(null)}>
                Close
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="fields">
              <TabsList>
                <TabsTrigger value="fields">
                  <Database className="h-4 w-4 mr-2" />
                  Custom Fields
                </TabsTrigger>
                <TabsTrigger value="logs">
                  <Activity className="h-4 w-4 mr-2" />
                  Activity Logs
                </TabsTrigger>
              </TabsList>
              <TabsContent value="fields" className="mt-4">
                <IntegrationFields integrationId={selectedIntegration.id} />
              </TabsContent>
              <TabsContent value="logs" className="mt-4">
                <IntegrationLogs integrationId={selectedIntegration.id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedIntegration && (
            <IntegrationForm
              integration={selectedIntegration}
              onSubmit={(data) =>
                updateMutation.mutate({ id: selectedIntegration.id, data })
              }
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedIntegration(null);
              }}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface IntegrationFormProps {
  integration?: ApiIntegration;
  onSubmit: (data: Partial<ApiIntegration>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function IntegrationForm({ integration, onSubmit, onCancel, isLoading }: IntegrationFormProps) {
  const [formData, setFormData] = useState<Partial<ApiIntegration>>(
    integration || {
      name: '',
      description: '',
      integration_type: 'bidirectional',
      auth_type: 'none',
      is_active: true,
      timeout_seconds: 30,
      retry_attempts: 3,
      auth_config: {},
      headers: {},
      metadata: {},
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{integration ? 'Edit' : 'Create'} Integration</DialogTitle>
        <DialogDescription>
          Configure the API integration settings and authentication
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Integration Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Slack Integration"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the purpose of this integration"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="integration_type">Integration Type *</Label>
            <Select
              value={formData.integration_type}
              onValueChange={(value: any) => setFormData({ ...formData, integration_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incoming">Incoming</SelectItem>
                <SelectItem value="outgoing">Outgoing</SelectItem>
                <SelectItem value="bidirectional">Bidirectional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auth_type">Authentication Type</Label>
            <Select
              value={formData.auth_type || 'none'}
              onValueChange={(value: any) => setFormData({ ...formData, auth_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="api_key">API Key</SelectItem>
                <SelectItem value="bearer_token">Bearer Token</SelectItem>
                <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                <SelectItem value="basic_auth">Basic Auth</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="base_url">Base URL</Label>
          <Input
            id="base_url"
            value={formData.base_url || ''}
            onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
            placeholder="https://api.example.com"
            type="url"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook_url">Webhook URL</Label>
          <Input
            id="webhook_url"
            value={formData.webhook_url || ''}
            onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
            placeholder="https://your-app.com/webhook/integration"
            type="url"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="timeout">Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              value={formData.timeout_seconds}
              onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) })}
              min={1}
              max={300}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="retry">Retry Attempts</Label>
            <Input
              id="retry"
              type="number"
              value={formData.retry_attempts}
              onChange={(e) => setFormData({ ...formData, retry_attempts: parseInt(e.target.value) })}
              min={0}
              max={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate_limit">Rate Limit (req/min)</Label>
            <Input
              id="rate_limit"
              type="number"
              value={formData.rate_limit || ''}
              onChange={(e) => setFormData({ ...formData, rate_limit: parseInt(e.target.value) || null })}
              placeholder="No limit"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : integration ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );
}
