import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Eye, EyeOff, ExternalLink, CheckCircle2, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

const PLATFORM_GUIDES = {
  facebook: {
    name: "Facebook",
    docsUrl: "https://developers.facebook.com/docs/facebook-login/web",
    instructions: [
      "Go to Facebook Developers Console",
      "Create a new app or select existing",
      "Add Facebook Login product",
      "Copy App ID and App Secret",
      "Add OAuth redirect URL in app settings"
    ]
  },
  twitter: {
    name: "Twitter/X",
    docsUrl: "https://developer.twitter.com/en/docs/authentication/oauth-2-0",
    instructions: [
      "Go to Twitter Developer Portal",
      "Create a new project and app",
      "Enable OAuth 2.0",
      "Copy Client ID and Client Secret",
      "Add callback URL to your app settings"
    ]
  },
  instagram: {
    name: "Instagram",
    docsUrl: "https://developers.facebook.com/docs/instagram-basic-display-api",
    instructions: [
      "Use Facebook for Developers",
      "Create Instagram App",
      "Configure Instagram Basic Display",
      "Get App ID and App Secret",
      "Add redirect URI"
    ]
  },
  linkedin: {
    name: "LinkedIn",
    docsUrl: "https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication",
    instructions: [
      "Go to LinkedIn Developers",
      "Create new app",
      "Request access to Sign In with LinkedIn",
      "Copy Client ID and Client Secret",
      "Add authorized redirect URL"
    ]
  },
  tiktok: {
    name: "TikTok",
    docsUrl: "https://developers.tiktok.com/doc/login-kit-web",
    instructions: [
      "Go to TikTok Developers",
      "Create new app",
      "Enable Login Kit",
      "Copy Client Key and Client Secret",
      "Configure redirect URL"
    ]
  },
  telegram: {
    name: "Telegram",
    docsUrl: "https://core.telegram.org/bots#creating-a-new-bot",
    instructions: [
      "Message @BotFather on Telegram",
      "Use /newbot command",
      "Follow instructions to create bot",
      "Copy the API token provided",
      "No OAuth needed - uses bot token"
    ]
  }
};

export default function SocialPlatformSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: configs, isLoading } = useQuery({
    queryKey: ['platform-configs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from('company_platform_configs')
        .select('*')
        .eq('company_id', profile.company_id);

      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ platform, data }: { platform: string; data: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('No company found');

      const existingConfig = configs?.find(c => c.platform_id === platform);

      if (existingConfig) {
        const { error } = await supabase
          .from('company_platform_configs')
          .update({
            client_id: data.client_id,
            client_secret: data.client_secret,
            redirect_url: data.redirect_url,
            use_platform_oauth: data.use_platform_oauth,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_platform_configs')
          .insert({
            company_id: profile.company_id,
            platform_id: platform,
            client_id: data.client_id,
            client_secret: data.client_secret,
            redirect_url: data.redirect_url,
            use_platform_oauth: data.use_platform_oauth,
            is_active: true
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-configs'] });
      toast({
        title: "Settings Saved",
        description: "Platform configuration updated successfully",
      });
      setEditingPlatform(null);
      setFormData({});
    },
    onError: (error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleEdit = (platformId: string) => {
    const config = configs?.find(c => c.platform_id === platformId);
    setEditingPlatform(platformId);
    setFormData({
      client_id: config?.client_id || '',
      client_secret: config?.client_secret || '',
      redirect_url: config?.redirect_url || `${window.location.origin}/oauth-callback`,
      use_platform_oauth: config?.use_platform_oauth ?? true
    });
  };

  const handleSave = (platformId: string) => {
    if (!formData.use_platform_oauth && (!formData.client_id || !formData.client_secret)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({ platform: platformId, data: formData });
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
            <Settings className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">Social Platform Settings</h1>
        </div>
        <p className="text-muted-foreground">Configure OAuth credentials for each platform</p>
      </div>

      <Alert className="mb-6">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          Configure your OAuth apps here, then connect accounts on the{" "}
          <a href="/social-media-credentials" className="font-medium underline">
            Social Connections
          </a>{" "}
          page.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {Object.entries(PLATFORM_GUIDES).map(([platformId, guide]) => {
          const config = configs?.find(c => c.platform_id === platformId);
          const isEditing = editingPlatform === platformId;
          const isConfigured = !!config?.client_id;

          return (
            <Card key={platformId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{guide.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <a
                        href={guide.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline flex items-center gap-1"
                      >
                        Setup Guide <ExternalLink className="h-3 w-3" />
                      </a>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConfigured && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(platformId)}
                      >
                        {isConfigured ? 'Edit' : 'Configure'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {isEditing && (
                <CardContent>
                  <Tabs defaultValue="config" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="config">Configuration</TabsTrigger>
                      <TabsTrigger value="guide">Setup Guide</TabsTrigger>
                    </TabsList>

                    <TabsContent value="config" className="space-y-4 mt-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-4">
                        <div className="space-y-0.5">
                          <Label htmlFor={`${platformId}-use-platform`} className="text-base font-medium">
                            Use Platform OAuth (Recommended)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Use centralized credentials managed by the platform
                          </p>
                        </div>
                        <Switch
                          id={`${platformId}-use-platform`}
                          checked={formData.use_platform_oauth ?? true}
                          onCheckedChange={(checked) => setFormData({ ...formData, use_platform_oauth: checked })}
                        />
                      </div>

                      {!formData.use_platform_oauth && (
                        <>
                          <Alert className="mb-4">
                            <AlertDescription>
                              You're using your own OAuth apps. Make sure to configure them properly in your developer accounts.
                            </AlertDescription>
                          </Alert>

                          <div className="space-y-2">
                            <Label htmlFor={`${platformId}-client-id`}>Client ID / App ID *</Label>
                        <Input
                          id={`${platformId}-client-id`}
                          value={formData.client_id || ''}
                          onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                          placeholder="Enter your client ID"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${platformId}-client-secret`}>Client Secret / App Secret *</Label>
                        <div className="relative">
                          <Input
                            id={`${platformId}-client-secret`}
                            type={showSecrets[platformId] ? 'text' : 'password'}
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
                            onClick={() => setShowSecrets({ ...showSecrets, [platformId]: !showSecrets[platformId] })}
                          >
                            {showSecrets[platformId] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${platformId}-redirect`}>OAuth Redirect URL</Label>
                        <Input
                          id={`${platformId}-redirect`}
                          value={formData.redirect_url || ''}
                          onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                          placeholder={`${window.location.origin}/oauth-callback`}
                        />
                            <p className="text-xs text-muted-foreground">
                              Add this URL to your app's authorized redirect URIs
                            </p>
                          </div>
                        </>
                      )}

                      {formData.use_platform_oauth && (
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription>
                            Using centralized platform credentials. No additional configuration needed.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => handleSave(platformId)}
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
                              Save Configuration
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
                    </TabsContent>

                    <TabsContent value="guide" className="mt-4">
                      <div className="space-y-3">
                        <h4 className="font-medium">Setup Instructions:</h4>
                        <ol className="space-y-2 list-decimal list-inside text-sm">
                          {guide.instructions.map((instruction, idx) => (
                            <li key={idx} className="text-muted-foreground">
                              {instruction}
                            </li>
                          ))}
                        </ol>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => window.open(guide.docsUrl, '_blank')}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open Documentation
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
