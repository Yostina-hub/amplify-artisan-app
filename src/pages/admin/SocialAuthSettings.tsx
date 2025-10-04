import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, ExternalLink, Info, KeyRound, Save, Edit, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Provider = {
  id: string;
  provider_name: string;
  display_name: string;
  client_id: string | null;
  client_secret: string | null;
  redirect_url: string | null;
  is_configured: boolean;
  is_enabled: boolean;
};

export default function SocialAuthSettings() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingAuth, setTestingAuth] = useState<string | null>(null);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, { client_id: string; client_secret: string }>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('oauth_provider_settings')
        .select('*')
        .order('provider_name');

      if (error) throw error;

      const projectUrl = window.location.origin;
      const providersWithRedirect = (data || []).map(provider => ({
        ...provider,
        redirect_url: provider.redirect_url || `${projectUrl}/auth/callback`,
      }));

      setProviders(providersWithRedirect);
    } catch (error: any) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Error loading providers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider.id);
    setFormData({
      ...formData,
      [provider.id]: {
        client_id: provider.client_id || '',
        client_secret: provider.client_secret || '',
      }
    });
  };

  const handleSave = async (providerId: string, providerName: string) => {
    try {
      setSaving(true);
      const data = formData[providerId];

      if (!data.client_id || !data.client_secret) {
        toast({
          title: "Validation error",
          description: "Client ID and Client Secret are required",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('oauth_provider_settings')
        .update({
          client_id: data.client_id,
          client_secret: data.client_secret,
          is_configured: true,
          redirect_url: window.location.origin + '/auth/callback',
        })
        .eq('id', providerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${providerName} credentials saved securely`,
      });

      setEditingProvider(null);
      fetchProviders();
    } catch (error: any) {
      toast({
        title: "Error saving credentials",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (providerName: string) => {
    try {
      setTestingAuth(providerName);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: providerName as any,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        toast({
          title: "Provider not configured",
          description: `${providerName} OAuth is not set up properly.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Test initiated",
          description: `Opening ${providerName} authentication window...`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTestingAuth(null);
    }
  };

  const maskCredential = (value: string | null) => {
    if (!value) return '';
    return '••••••••••••••••';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Social Authentication Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure OAuth providers for user authentication
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p className="text-sm">
            OAuth credentials are stored encrypted in the database. 
            For self-hosted deployments, configure your providers below.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Available OAuth Providers
          </CardTitle>
          <CardDescription>
            Configure social login providers for your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {providers.map((provider) => (
            <div key={provider.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <KeyRound className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{provider.display_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {provider.is_configured ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Not Configured
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {editingProvider === provider.id ? (
                    <div className="space-y-4 ml-13">
                      <div className="space-y-2">
                        <Label htmlFor={`client-id-${provider.id}`}>Client ID / App ID</Label>
                        <Input
                          id={`client-id-${provider.id}`}
                          value={formData[provider.id]?.client_id || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            [provider.id]: {
                              ...formData[provider.id],
                              client_id: e.target.value
                            }
                          })}
                          placeholder="Enter your OAuth Client ID"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`client-secret-${provider.id}`}>Client Secret / App Secret</Label>
                        <div className="relative">
                          <Input
                            id={`client-secret-${provider.id}`}
                            type={showSecret[provider.id] ? "text" : "password"}
                            value={formData[provider.id]?.client_secret || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              [provider.id]: {
                                ...formData[provider.id],
                                client_secret: e.target.value
                              }
                            })}
                            placeholder="Enter your OAuth Client Secret"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowSecret({
                              ...showSecret,
                              [provider.id]: !showSecret[provider.id]
                            })}
                          >
                            {showSecret[provider.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(provider.id, provider.display_name)}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingProvider(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 ml-13">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Client ID:</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {provider.client_id ? maskCredential(provider.client_id) : 'Not set'}
                          </code>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Client Secret:</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {provider.client_secret ? maskCredential(provider.client_secret) : 'Not set'}
                          </code>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          <strong>Redirect URL:</strong>
                        </p>
                        <code className="text-xs bg-muted px-2 py-1 rounded block">
                          {provider.redirect_url}
                        </code>
                        <p className="text-xs text-muted-foreground">
                          Add this URL to your {provider.display_name} OAuth app
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {editingProvider !== provider.id && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(provider)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                      {provider.is_configured && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testProvider(provider.provider_name)}
                          disabled={testingAuth === provider.provider_name}
                        >
                          {testingAuth === provider.provider_name ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            'Test Login'
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Separator className="mt-6" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Google OAuth Setup:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Go to Google Cloud Console and create/select a project</li>
              <li>Enable Google+ API or Google Identity services</li>
              <li>Create OAuth 2.0 Client ID credentials</li>
              <li>Add your domain and the redirect URL above to authorized URLs</li>
              <li>Copy Client ID and Secret to Lovable Cloud dashboard</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Facebook OAuth Setup:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Go to Facebook Developers and create/select an app</li>
              <li>Add "Facebook Login" product to your app</li>
              <li>Configure Valid OAuth Redirect URIs with the URL above</li>
              <li>Copy App ID and App Secret to Lovable Cloud dashboard</li>
              <li>Submit your app for review if needed for production</li>
            </ol>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              After configuring OAuth credentials in the Lovable Cloud dashboard, use the "Test Login" 
              button above to verify each provider is working correctly.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
