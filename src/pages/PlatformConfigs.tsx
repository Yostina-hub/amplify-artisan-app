import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Settings, Send, MessageCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

interface Platform {
  id: string;
  name: string;
  display_name: string;
  icon_name: string;
  api_base_url: string;
  oauth_authorize_url: string;
  oauth_token_url: string;
  oauth_scopes: string;
  requires_oauth: boolean;
  requires_api_key: boolean;
  is_active: boolean;
  config: any;
  created_at: string;
  updated_at: string;
}

interface PlatformConfig {
  id: string;
  platform_id: string;
  company_id: string;
  client_id: string | null;
  client_secret: string | null;
  api_key: string | null;
  api_secret: string | null;
  access_token?: string | null;
  redirect_url: string | null;
  webhook_url: string | null;
  channel_id: string | null;
  is_active: boolean;
  config: any;
  created_at: string;
  updated_at: string;
  platform?: Platform;
}

const platformIcons: Record<string, any> = {
  telegram: Send,
  tiktok: MessageCircle,
};

export default function PlatformConfigs() {
  const { user, isCompanyAdmin, isSuperAdmin } = useAuth();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Partial<PlatformConfig>>({});
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id && !isSuperAdmin) {
        toast({
          title: "No company",
          description: "You need to be associated with a company to configure platforms",
          variant: "destructive",
        });
        return;
      }

      setCompanyId(profile?.company_id || null);

      // Get all platforms
      const { data: platformsData, error: platformsError } = await supabase
        .from('social_platforms')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (platformsError) throw platformsError;

      setPlatforms(platformsData || []);

      // Get existing configurations
      if (profile?.company_id) {
        const { data: configsData, error: configsError } = await supabase
          .from('company_platform_configs')
          .select(`
            *,
            platform:social_platforms(*)
          `)
          .eq('company_id', profile.company_id);

        if (configsError) throw configsError;

        setConfigs(configsData || []);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load platform configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (platform: Platform) => {
    setSelectedPlatform(platform);
    const existingConfig = configs.find(c => c.platform_id === platform.id);
    
    if (existingConfig) {
      setFormData(existingConfig);
    } else {
      setFormData({
        platform_id: platform.id,
        company_id: companyId!,
        is_active: true,
      });
    }
    
    setIsDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!companyId || !selectedPlatform) return;

    try {
      // Basic validation for required fields
      const platformName = selectedPlatform.name.toLowerCase();
      
      if (platformName === 'telegram') {
        if (!formData.api_key?.trim()) {
          throw new Error("Bot Token is required for Telegram");
        }
        if (!formData.channel_id?.trim()) {
          throw new Error("Channel ID is required for Telegram");
        }
      }
      
      if (platformName === 'tiktok') {
        if (!formData.access_token?.trim()) {
          throw new Error("Access Token is required for TikTok");
        }
      }

      const existingConfig = configs.find(c => c.platform_id === selectedPlatform.id);

      if (existingConfig) {
        // Update existing config
        const { error } = await supabase
          .from('company_platform_configs')
          .update({
            client_id: formData.client_id || null,
            client_secret: formData.client_secret || null,
            api_key: formData.api_key || null,
            api_secret: formData.api_secret || null,
            access_token: formData.access_token || null,
            redirect_url: formData.redirect_url || null,
            webhook_url: formData.webhook_url || null,
            channel_id: formData.channel_id || null,
            is_active: formData.is_active,
            config: formData.config || null,
          })
          .eq('id', existingConfig.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Platform configuration updated",
        });
      } else {
        // Create new config
        const { error } = await supabase
          .from('company_platform_configs')
          .insert({
            platform_id: selectedPlatform.id,
            company_id: companyId,
            client_id: formData.client_id || null,
            client_secret: formData.client_secret || null,
            api_key: formData.api_key || null,
            api_secret: formData.api_secret || null,
            access_token: formData.access_token || null,
            redirect_url: formData.redirect_url || null,
            webhook_url: formData.webhook_url || null,
            channel_id: formData.channel_id || null,
            is_active: formData.is_active ?? true,
            config: formData.config || null,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Platform configuration added",
        });
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    }
  };

  const toggleShowSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const renderConfigForm = () => {
    if (!selectedPlatform) return null;

    const platformName = selectedPlatform.name.toLowerCase();

    return (
      <div className="space-y-4">
        {/* Telegram Configuration */}
        {platformName === 'telegram' && (
          <>
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                How to set up Telegram Bot
              </h4>
              <ol className="text-xs space-y-2 list-decimal list-inside text-muted-foreground">
                <li>Open Telegram and search for <span className="font-mono text-foreground">@BotFather</span></li>
                <li>Send <span className="font-mono text-foreground">/newbot</span> command to create a new bot</li>
                <li>Choose a name and username for your bot</li>
                <li>Copy the <span className="font-semibold">Bot Token</span> provided by BotFather</li>
                <li>Create or use an existing channel</li>
                <li>Add your bot as an administrator to the channel</li>
                <li>Get channel ID using <span className="font-mono text-foreground">@userinfobot</span> or forward a message to <span className="font-mono text-foreground">@getidsbot</span></li>
              </ol>
              <div className="pt-2 border-t space-y-1">
                <p className="text-xs font-medium">📌 Important Notes:</p>
                <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground ml-2">
                  <li>Bot must be admin in channel to post messages</li>
                  <li>Channel ID starts with <span className="font-mono">-100</span> for supergroups/channels</li>
                  <li>Public channels can use <span className="font-mono">@username</span> format</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">Bot Token *</Label>
              <div className="flex gap-2">
                <Input
                  id="api_key"
                  type={showSecrets['api_key'] ? 'text' : 'password'}
                  value={formData.api_key || ''}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowSecret('api_key')}
                >
                  {showSecrets['api_key'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get this token from @BotFather on Telegram
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel_id">Channel ID *</Label>
              <Input
                id="channel_id"
                value={formData.channel_id || ''}
                onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                placeholder="@yourchannel or -1001234567890"
              />
              <p className="text-xs text-muted-foreground">
                Channel username (e.g., @mychannel) or numeric ID (e.g., -1001234567890)
              </p>
            </div>
          </>
        )}

        {/* TikTok Configuration */}
        {platformName === 'tiktok' && (
          <>
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                How to get your TikTok Access Token
              </h4>
              <ol className="text-xs space-y-2 list-decimal list-inside text-muted-foreground">
                <li>Visit <a href="https://developers.tiktok.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">TikTok Developer Portal</a> and sign in</li>
                <li>Create a new app or select an existing one</li>
                <li>In App Dashboard, get your <span className="font-semibold">Client Key</span> and <span className="font-semibold">Client Secret</span></li>
                <li>Add required scopes: <span className="font-mono text-foreground">user.info.basic</span>, <span className="font-mono text-foreground">video.publish</span></li>
                <li>Set your redirect URI in app settings</li>
                <li>Build OAuth URL: 
                  <code className="block mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
                    https://www.tiktok.com/v2/auth/authorize/?client_key=YOUR_KEY&scope=user.info.basic,video.publish&response_type=code&redirect_uri=YOUR_URI
                  </code>
                </li>
                <li>User authorizes → receive authorization code in redirect</li>
                <li>Exchange code for access token via POST to:
                  <code className="block mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
                    https://open.tiktokapis.com/v2/oauth/token/
                  </code>
                </li>
                <li>Copy the <span className="font-semibold">access_token</span> from response</li>
              </ol>
              <div className="pt-2 border-t space-y-1">
                <p className="text-xs font-medium">📌 Important Requirements:</p>
                <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground ml-2">
                  <li>App must have valid Terms of Service and Privacy Policy URLs</li>
                  <li>App must be approved by TikTok (review process required)</li>
                  <li>Access tokens expire - implement refresh token flow</li>
                  <li>Videos must meet TikTok content guidelines</li>
                </ul>
                <p className="text-xs text-muted-foreground pt-2">
                  📘 <a href="https://developers.tiktok.com/doc/content-posting-api-get-started" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Full Documentation</a>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_token">Access Token *</Label>
              <div className="flex gap-2">
                <Input
                  id="access_token"
                  type={showSecrets['access_token'] ? 'text' : 'password'}
                  value={formData.access_token || ''}
                  onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                  placeholder="act.xxx..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => toggleShowSecret('access_token')}
                >
                  {showSecrets['access_token'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                OAuth 2.0 access token from TikTok Developer Portal
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="privacy_level">Privacy Level</Label>
              <Select
                value={formData.config?.privacy_level || 'SELF_ONLY'}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  config: { ...formData.config, privacy_level: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC_TO_EVERYONE">Public</SelectItem>
                  <SelectItem value="MUTUAL_FOLLOW_FRIENDS">Friends</SelectItem>
                  <SelectItem value="SELF_ONLY">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Active</Label>
            <p className="text-xs text-muted-foreground">
              Enable this platform configuration
            </p>
          </div>
          <Switch
            checked={formData.is_active ?? true}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!companyId && !isSuperAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Company Association</h3>
            <p className="text-muted-foreground">
              You need to be associated with a company to configure platform settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Configurations</h1>
        <p className="text-muted-foreground mt-1">
          Configure your social media platform credentials and settings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => {
          const config = configs.find(c => c.platform_id === platform.id);
          const Icon = platformIcons[platform.name.toLowerCase()] || Settings;
          const isConfigured = !!config;
          const isActive = config?.is_active;

          return (
            <Card key={platform.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{platform.display_name}</CardTitle>
                      <CardDescription className="text-xs">
                        Configure {platform.name} settings
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {isConfigured ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Configured</span>
                      {isActive ? (
                        <Badge variant="default" className="ml-auto">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-auto">Inactive</Badge>
                      )}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Not configured</span>
                    </>
                  )}
                </div>

                <Dialog open={isDialogOpen && selectedPlatform?.id === platform.id} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleOpenDialog(platform)}
                    >
                      {isConfigured ? 'Edit Configuration' : 'Configure'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Configure {platform.name}</DialogTitle>
                      <DialogDescription>
                        Add or update your {platform.name} credentials
                      </DialogDescription>
                    </DialogHeader>
                    {renderConfigForm()}
                    <div className="flex gap-2 justify-end mt-4">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveConfig}>
                        Save Configuration
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
