import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Loader2, Save, Eye, EyeOff, Shield, CheckCircle2, 
  XCircle, ExternalLink, Copy, Zap, Globe, Settings2,
  Facebook, Instagram, Linkedin, Youtube, MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { 
    id: 'facebook', 
    name: 'Facebook', 
    icon: Facebook,
    color: 'from-blue-500 to-blue-600',
    docsUrl: 'https://developers.facebook.com/docs/facebook-login/web',
    scopes: 'pages_manage_posts, pages_read_engagement'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    icon: Instagram,
    color: 'from-pink-500 via-purple-500 to-orange-400',
    docsUrl: 'https://developers.facebook.com/docs/instagram-basic-display-api',
    scopes: 'user_profile, user_media'
  },
  { 
    id: 'twitter', 
    name: 'Twitter/X', 
    icon: () => <span className="text-lg">𝕏</span>,
    color: 'from-gray-800 to-gray-900',
    docsUrl: 'https://developer.twitter.com/en/docs/authentication/oauth-2-0',
    scopes: 'tweet.read, tweet.write, users.read'
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    icon: Linkedin,
    color: 'from-blue-600 to-blue-700',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication',
    scopes: 'w_member_social'
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    icon: () => <span className="text-lg">🎵</span>,
    color: 'from-gray-900 to-pink-500',
    docsUrl: 'https://developers.tiktok.com/doc/login-kit-web',
    scopes: 'user.info.basic, video.list, video.publish'
  },
  { 
    id: 'youtube', 
    name: 'YouTube', 
    icon: Youtube,
    color: 'from-red-500 to-red-600',
    docsUrl: 'https://developers.google.com/youtube/v3/getting-started',
    scopes: 'youtube.upload, youtube.readonly'
  },
  { 
    id: 'pinterest', 
    name: 'Pinterest', 
    icon: () => <span className="text-lg">📌</span>,
    color: 'from-red-600 to-rose-500',
    docsUrl: 'https://developers.pinterest.com/docs/getting-started/introduction/',
    scopes: 'boards:read, pins:read, pins:write'
  },
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
            is_active: data.is_active ?? true
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-oauth-apps'] });
      toast({ title: "Platform OAuth saved successfully" });
      setEditingPlatform(null);
      setFormData({});
    },
    onError: (error) => {
      toast({
        title: "Failed to save",
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
      redirect_url: app?.redirect_url || `${window.location.origin}/functions/v1/oauth-callback`,
      is_active: app?.is_active ?? true
    });
  };

  const handleSave = (platformId: string) => {
    if (!formData.client_id?.trim() || !formData.client_secret?.trim()) {
      toast({
        title: "Missing credentials",
        description: "Client ID and Client Secret are required",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate({ platformId, data: formData });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const configuredCount = oauthApps?.filter(app => app.is_active && app.client_id).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl space-y-6 animate-in fade-in-50">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/60">
              <Shield className="h-6 w-6 text-white" />
            </div>
            Platform OAuth Apps
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure centralized OAuth for all companies (Buffer/Hootsuite style)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 px-3 py-1">
            <Zap className="h-3 w-3 text-primary" />
            {configuredCount}/{PLATFORMS.length} Active
          </Badge>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="border-primary/20 bg-primary/5">
        <Globe className="h-4 w-4 text-primary" />
        <AlertTitle>Centralized OAuth Management</AlertTitle>
        <AlertDescription>
          Configure OAuth apps here once. All client companies can then connect their social accounts 
          with just one click - no developer accounts needed on their end.
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{configuredCount}</div>
                <p className="text-xs text-muted-foreground">Active Platforms</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-600">{PLATFORMS.length - configuredCount}</div>
                <p className="text-xs text-muted-foreground">Pending Setup</p>
              </div>
              <Settings2 className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{PLATFORMS.length}</div>
                <p className="text-xs text-muted-foreground">Supported</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">∞</div>
                <p className="text-xs text-muted-foreground">Client Connections</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Cards */}
      <div className="grid gap-4">
        {PLATFORMS.map(platform => {
          const app = oauthApps?.find(a => a.platform_id === platform.id);
          const isEditing = editingPlatform === platform.id;
          const isConfigured = !!app?.client_id;
          const isActive = app?.is_active;
          const IconComponent = platform.icon;

          return (
            <Card key={platform.id} className={cn(
              "transition-all duration-300",
              isEditing && "ring-2 ring-primary shadow-lg"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl bg-gradient-to-br text-white",
                      platform.color
                    )}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {platform.name}
                        {isConfigured && (
                          <Badge 
                            variant={isActive ? "default" : "secondary"}
                            className={cn(
                              "text-xs",
                              isActive && "bg-green-500 hover:bg-green-600"
                            )}
                          >
                            {isActive ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" /> Inactive</>
                            )}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Scopes: {platform.scopes}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(platform.docsUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Docs
                    </Button>
                    {!isEditing && (
                      <Button
                        variant={isConfigured ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleEdit(platform.id)}
                      >
                        {isConfigured ? 'Edit' : 'Configure'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {isEditing && (
                <CardContent className="space-y-4 border-t pt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Client ID */}
                    <div className="space-y-2">
                      <Label htmlFor={`${platform.id}-client-id`} className="font-medium">
                        Client ID / App ID *
                      </Label>
                      <Input
                        id={`${platform.id}-client-id`}
                        value={formData.client_id || ''}
                        onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                        placeholder="Enter your client ID"
                      />
                    </div>

                    {/* Client Secret */}
                    <div className="space-y-2">
                      <Label htmlFor={`${platform.id}-client-secret`} className="font-medium">
                        Client Secret *
                      </Label>
                      <div className="relative">
                        <Input
                          id={`${platform.id}-client-secret`}
                          type={showSecrets[platform.id] ? 'text' : 'password'}
                          value={formData.client_secret || ''}
                          onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                          placeholder="Enter your client secret"
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
                  </div>

                  {/* Redirect URL */}
                  <div className="space-y-2">
                    <Label className="font-medium">OAuth Redirect URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.redirect_url || ''}
                        onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(formData.redirect_url || '')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add this URL to your app's authorized redirect URIs in the developer console
                    </p>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="font-medium">Enable Platform</Label>
                      <p className="text-xs text-muted-foreground">
                        When enabled, clients can connect with one click
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_active ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleSave(platform.id)}
                      disabled={saveMutation.isPending}
                      className="gap-2"
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Configuration
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

      {/* Direct Token Platforms Info */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            Direct Token Platforms
          </CardTitle>
          <CardDescription>
            Telegram and WhatsApp use direct API tokens instead of OAuth. 
            Clients can enter their credentials directly in the Social Connections page.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
