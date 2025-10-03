import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, AlertCircle, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as Icons from "lucide-react";
import { platformConfigSchema } from "@/lib/validations";

interface Platform {
  id: string;
  name: string;
  display_name: string;
  icon_name: string | null;
  requires_oauth: boolean;
  requires_api_key: boolean;
}

interface CompanyConfig {
  id?: string;
  platform_id: string;
  client_id: string;
  client_secret: string;
  api_key: string;
  api_secret: string;
  redirect_url: string;
  webhook_url: string;
  channel_id: string;
  is_active: boolean;
}

export default function CompanyPlatformSettings() {
  const { isCompanyAdmin, isSuperAdmin } = useAuth();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [configs, setConfigs] = useState<Record<string, CompanyConfig>>({});
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const isAdmin = isCompanyAdmin || isSuperAdmin;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) {
        toast({
          title: "No company assigned",
          description: "You need to be assigned to a company to manage platform settings",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setCompanyId(profile.company_id);

      // Fetch subscribed platforms and existing configs
      const [subscriptionsRes, configsRes] = await Promise.all([
        supabase
          .from("company_platform_subscriptions")
          .select("platform_id, social_platforms(*)")
          .eq("company_id", profile.company_id)
          .eq("is_active", true)
          .eq("status", "approved"),
        supabase.from("company_platform_configs").select("*").eq("company_id", profile.company_id),
      ]);

      if (subscriptionsRes.error) throw subscriptionsRes.error;
      if (configsRes.error) throw configsRes.error;

      // Extract platforms from subscriptions
      const subscribedPlatforms = subscriptionsRes.data
        ?.map((sub: any) => sub.social_platforms)
        .filter(Boolean) || [];
      
      setPlatforms(subscribedPlatforms);

      // Organize configs by platform_id
      const configMap: Record<string, CompanyConfig> = {};
      (configsRes.data || []).forEach((config: any) => {
        configMap[config.platform_id] = config;
      });
      setConfigs(configMap);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (platformId: string) => {
    if (!companyId) return;

    try {
      setSaving(platformId);
      const config = configs[platformId];

      // Validate input
      const validationResult = platformConfigSchema.safeParse(config);
      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        throw new Error(firstError.message);
      }

      if (config?.id) {
        // Update existing
        const { error } = await supabase
          .from("company_platform_configs")
          .update({
            client_id: validationResult.data.client_id,
            client_secret: validationResult.data.client_secret,
            api_key: validationResult.data.api_key,
            api_secret: validationResult.data.api_secret,
            redirect_url: validationResult.data.redirect_url,
            webhook_url: validationResult.data.webhook_url,
            channel_id: config.channel_id,
            is_active: config.is_active,
          })
          .eq("id", config.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("company_platform_configs")
          .insert([{
            company_id: companyId,
            platform_id: platformId,
            ...validationResult.data,
            channel_id: config.channel_id,
            is_active: config.is_active,
          }]);

        if (error) throw error;
      }

      toast({ title: "Settings saved successfully" });
      fetchData(); // Refresh to get updated IDs
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const updateConfig = (platformId: string, field: keyof CompanyConfig, value: any) => {
    setConfigs((prev) => ({
      ...prev,
      [platformId]: {
        ...prev[platformId],
        platform_id: platformId,
        [field]: value,
      } as CompanyConfig,
    }));
  };

  const getPlatformIcon = (iconName: string | null) => {
    if (!iconName) return Icons.Circle;
    const Icon = (Icons as any)[iconName];
    return Icon || Icons.Circle;
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Only company administrators can access platform API settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to be assigned to a company to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Platform API Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your company's OAuth apps and API credentials for each platform
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Admin Access Required:</strong> These are sensitive OAuth credentials. Only company administrators can view and modify these settings. Each user will connect their own accounts using these credentials.
        </AlertDescription>
      </Alert>

      {platforms.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Your company doesn't have any platform subscriptions yet. Contact your system administrator to add platforms.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {platforms.map((platform) => {
          const config = configs[platform.id] || {
            platform_id: platform.id,
            client_id: "",
            client_secret: "",
            api_key: "",
            api_secret: "",
            redirect_url: "",
            webhook_url: "",
            channel_id: "",
            is_active: true,
          };
          const Icon = getPlatformIcon(platform.icon_name);

          return (
            <Card key={platform.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6" />
                    <div>
                      <CardTitle>{platform.display_name}</CardTitle>
                      <CardDescription>
                        {platform.requires_oauth && "OAuth 2.0"}{" "}
                        {platform.requires_api_key && "API Key"}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={(checked) =>
                      updateConfig(platform.id, "is_active", checked)
                    }
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {platform.requires_oauth && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Client ID / App ID</Label>
                        <Input
                          type="text"
                          value={config.client_id}
                          onChange={(e) =>
                            updateConfig(platform.id, "client_id", e.target.value)
                          }
                          placeholder="Enter your OAuth client ID"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Client Secret / App Secret</Label>
                        <Input
                          type="password"
                          value={config.client_secret}
                          onChange={(e) =>
                            updateConfig(platform.id, "client_secret", e.target.value)
                          }
                          placeholder="Enter your OAuth client secret"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Redirect URL</Label>
                      <Input
                        type="url"
                        value={config.redirect_url}
                        onChange={(e) =>
                          updateConfig(platform.id, "redirect_url", e.target.value)
                        }
                        placeholder="https://yourapp.com/callback"
                      />
                    </div>
                  </>
                )}

                {platform.requires_api_key && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={config.api_key}
                        onChange={(e) =>
                          updateConfig(platform.id, "api_key", e.target.value)
                        }
                        placeholder="Enter your API key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Secret (if required)</Label>
                      <Input
                        type="password"
                        value={config.api_secret}
                        onChange={(e) =>
                          updateConfig(platform.id, "api_secret", e.target.value)
                        }
                        placeholder="Enter your API secret"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Webhook URL (optional)</Label>
                  <Input
                    type="url"
                    value={config.webhook_url}
                    onChange={(e) =>
                      updateConfig(platform.id, "webhook_url", e.target.value)
                    }
                    placeholder="https://yourapp.com/webhooks"
                  />
                </div>

                {platform.name === "telegram" && (
                  <div className="space-y-2">
                    <Label>Channel/Group ID</Label>
                    <Input
                      type="text"
                      value={config.channel_id}
                      onChange={(e) =>
                        updateConfig(platform.id, "channel_id", e.target.value)
                      }
                      placeholder="@yourchannel or -1001234567890"
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter your Telegram channel username (e.g., @yourchannel) or group ID
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => handleSave(platform.id)}
                  disabled={saving === platform.id}
                  className="w-full"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving === platform.id ? "Saving..." : "Save Configuration"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
