import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Eye, EyeOff, Settings, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook' },
  { id: 'twitter', name: 'Twitter/X' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'telegram', name: 'Telegram' }
];

export default function PlatformOAuthApps() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: oauthApps, isLoading } = useQuery({
    queryKey: ['platform-oauth-apps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_oauth_apps')
        .select('*');

      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ platformId, data }: { platformId: string; data: any }) => {
      const existingApp = oauthApps?.find(app => app.platform_id === platformId);

      if (existingApp) {
        const { error } = await supabase
          .from('platform_oauth_apps')
          .update({
            client_id: data.client_id,
            client_secret: data.client_secret,
            redirect_url: data.redirect_url,
            is_active: data.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingApp.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('platform_oauth_apps')
          .insert({
            platform_id: platformId,
            client_id: data.client_id,
            client_secret: data.client_secret,
            redirect_url: data.redirect_url,
            is_active: data.is_active
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-oauth-apps'] });
      toast({
        title: "Success",
        description: "Platform OAuth app updated successfully",
      });
      setEditingPlatform(null);
      setFormData({});
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEdit = (platformId: string) => {
    const app = oauthApps?.find(a => a.platform_id === platformId);
    setEditingPlatform(platformId);
    setFormData({
      client_id: app?.client_id || '',
      client_secret: app?.client_secret || '',
      redirect_url: app?.redirect_url || `${window.location.origin}/oauth-callback`,
      is_active: app?.is_active ?? true
    });
  };

  const handleSave = (platformId: string) => {
    if (!formData.client_id || !formData.client_secret) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({ platformId, data: formData });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/60">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Platform OAuth Apps</h1>
        </div>
        <p className="text-muted-foreground">
          Manage centralized OAuth credentials used by all companies (Buffer/Hootsuite style)
        </p>
      </div>

      <Alert className="mb-6">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Super Admin Only:</strong> These credentials will be used by all companies that choose "Use Platform OAuth".
          Companies can still opt to use their own OAuth apps if needed.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {PLATFORMS.map(platform => {
          const app = oauthApps?.find(a => a.platform_id === platform.id);
          const isEditing = editingPlatform === platform.id;
          const isConfigured = !!app?.client_id;

          return (
            <Card key={platform.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {platform.name}
                      {isConfigured && (
                        <Badge variant={app.is_active ? "default" : "secondary"}>
                          {app.is_active ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {isConfigured ? "Configured and ready" : "Not configured"}
                    </CardDescription>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(platform.id)}
                    >
                      {isConfigured ? 'Edit' : 'Configure'}
                    </Button>
                  )}
                </div>
              </CardHeader>

              {isEditing && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${platform.id}-client-id`}>Client ID / App ID *</Label>
                    <Input
                      id={`${platform.id}-client-id`}
                      value={formData.client_id || ''}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      placeholder="Enter client ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${platform.id}-client-secret`}>Client Secret *</Label>
                    <div className="relative">
                      <Input
                        id={`${platform.id}-client-secret`}
                        type={showSecrets[platform.id] ? 'text' : 'password'}
                        value={formData.client_secret || ''}
                        onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                        placeholder="Enter client secret"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowSecrets({ ...showSecrets, [platform.id]: !showSecrets[platform.id] })}
                      >
                        {showSecrets[platform.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`${platform.id}-redirect`}>OAuth Redirect URL</Label>
                    <Input
                      id={`${platform.id}-redirect`}
                      value={formData.redirect_url || ''}
                      onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                      placeholder={`${window.location.origin}/oauth-callback`}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`${platform.id}-active`}
                      checked={formData.is_active ?? true}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor={`${platform.id}-active`}>Active</Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleSave(platform.id)}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingPlatform(null);
                        setFormData({});
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
