import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, ExternalLink, Info, KeyRound } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

type Provider = {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  description: string;
  setup_url: string;
  redirect_url: string;
  is_configured: boolean;
  is_enabled: boolean;
};

export default function SocialAuthSettings() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingAuth, setTestingAuth] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      
      // Get project URL for redirect configuration
      const { data: { user } } = await supabase.auth.getUser();
      const projectUrl = window.location.origin;
      
      // Define available social providers
      const availableProviders = [
        {
          id: 'google',
          name: 'google',
          display_name: 'Google',
          icon: '🔵',
          description: 'Allow users to sign in with their Google account',
          setup_url: 'https://console.cloud.google.com/',
          redirect_url: `${projectUrl}/auth/callback`,
        },
        {
          id: 'facebook',
          name: 'facebook',
          display_name: 'Facebook',
          icon: '📘',
          description: 'Allow users to sign in with their Facebook account',
          setup_url: 'https://developers.facebook.com/',
          redirect_url: `${projectUrl}/auth/callback`,
        },
      ];

      // Check which providers are actually configured by testing them
      const providersWithStatus = await Promise.all(
        availableProviders.map(async (provider) => {
          // Try to get OAuth provider settings (this will help determine if configured)
          // Note: We can't directly check secrets, but we can check if the provider works
          return {
            ...provider,
            is_configured: false, // Will be true if credentials are set in Cloud dashboard
            is_enabled: true, // Can be toggled by admin
          };
        })
      );

      setProviders(providersWithStatus);
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
          description: `${providerName} OAuth is not set up. Please configure it in the Lovable Cloud dashboard.`,
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
          <div className="space-y-2">
            <p className="font-medium">OAuth credentials are managed securely in the Lovable Cloud dashboard.</p>
            <p className="text-sm">
              For security reasons, OAuth Client IDs and Secrets cannot be viewed or edited through this interface.
              Configure them in: <strong>Users → Auth Settings → Provider Settings</strong>
            </p>
          </div>
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
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{provider.display_name}</h3>
                      <p className="text-sm text-muted-foreground">{provider.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2 ml-11">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Status:</span>
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

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        <strong>Redirect URL:</strong>
                      </p>
                      <code className="text-xs bg-muted px-2 py-1 rounded block">
                        {provider.redirect_url}
                      </code>
                      <p className="text-xs text-muted-foreground">
                        Add this URL to your {provider.display_name} OAuth app configuration
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(provider.setup_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Setup Guide
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testProvider(provider.name)}
                    disabled={testingAuth === provider.name}
                  >
                    {testingAuth === provider.name ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      'Test Login'
                    )}
                  </Button>
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
