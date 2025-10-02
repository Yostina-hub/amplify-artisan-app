import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as Icons from "lucide-react";
import { socialMediaAccountSchema } from "@/lib/validations";
import { querySocialMediaAccountsSafe } from "@/lib/safeQuery";

interface Platform {
  id: string;
  name: string;
  display_name: string;
  icon_name: string | null;
  requires_oauth: boolean;
  requires_api_key: boolean;
}

interface Credential {
  id: string;
  platform: string;
  account_name: string;
}

export default function SocialMediaCredentials() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [formData, setFormData] = useState({
    account_name: "",
    access_token: "",
    refresh_token: "",
    api_key: "",
    api_secret: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      let platformsData: Platform[] = [];

      if (profile?.company_id) {
        // Get subscribed platforms only
        const { data: subscriptions, error: subsError } = await supabase
          .from("company_platform_subscriptions")
          .select("platform_id, social_platforms(*)")
          .eq("company_id", profile.company_id)
          .eq("is_active", true);

        if (subsError) throw subsError;

        platformsData = subscriptions
          ?.map((sub: any) => sub.social_platforms)
          .filter(Boolean) || [];
      }

      const { data: credentialsData, error: credsError } = await querySocialMediaAccountsSafe()
        .select("id, platform, account_name");

      if (credsError) throw credsError;

      setPlatforms(platformsData);
      setCredentials(credentialsData || []);
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

  const handleConnect = async () => {
    if (!selectedPlatform) return;

    try {
      // Validate input
      const validationResult = socialMediaAccountSchema.safeParse(formData);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        throw new Error(firstError.message);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const insertData: any = {
        user_id: user.id,
        platform: selectedPlatform.name,
        account_name: validationResult.data.account_name,
        account_id: validationResult.data.account_name,
        is_active: true,
      };

      if (selectedPlatform.requires_oauth) {
        insertData.access_token = validationResult.data.access_token;
        insertData.refresh_token = validationResult.data.refresh_token;
      }

      if (selectedPlatform.requires_api_key) {
        insertData.access_token = validationResult.data.api_key;
        insertData.refresh_token = validationResult.data.api_secret;
      }

      const { error } = await supabase.from("social_media_accounts").insert([insertData]);

      if (error) throw error;

      toast({ title: "Account connected successfully" });
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error connecting account",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;

    try {
      const { error } = await supabase.from("social_media_accounts").delete().eq("id", id);

      if (error) throw error;
      toast({ title: "Account disconnected" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      account_name: "",
      access_token: "",
      refresh_token: "",
      api_key: "",
      api_secret: "",
    });
    setSelectedPlatform(null);
  };

  const openConnectDialog = (platform: Platform) => {
    setSelectedPlatform(platform);
    resetForm();
    setIsDialogOpen(true);
  };

  const getPlatformIcon = (iconName: string | null) => {
    if (!iconName) return Icons.Circle;
    const Icon = (Icons as any)[iconName];
    return Icon || Icons.Circle;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Media Accounts</h1>
        <p className="text-muted-foreground mt-2">
          Connect and manage your social media accounts
        </p>
      </div>

      <Tabs defaultValue="connected" className="w-full">
        <TabsList>
          <TabsTrigger value="connected">Connected Accounts</TabsTrigger>
          <TabsTrigger value="available">Available Platforms</TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="space-y-4">
          {credentials.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No accounts connected yet. Connect your first account from the Available Platforms tab.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {credentials.map((credential) => {
                const platform = platforms.find(p => p.name === credential.platform);
                const Icon = getPlatformIcon(platform?.icon_name || null);
                return (
                  <Card key={credential.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <div>
                            <CardTitle className="text-lg">
                              {platform?.display_name || credential.platform}
                            </CardTitle>
                            <CardDescription>{credential.account_name}</CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDisconnect(credential.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {platforms.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  No platforms available. Your company needs to be subscribed to platforms first. Contact your administrator.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {platforms.map((platform) => {
                const Icon = getPlatformIcon(platform.icon_name);
                return (
                  <Card key={platform.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <CardTitle className="text-lg">{platform.display_name}</CardTitle>
                        </div>
                        <Button size="sm" onClick={() => openConnectDialog(platform)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Connect
                        </Button>
                      </div>
                      <CardDescription>
                        {platform.requires_oauth && "OAuth authentication"}
                        {platform.requires_api_key && "API key required"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {selectedPlatform?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name / Username</Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder="Enter your account name"
              />
            </div>

            {selectedPlatform?.requires_oauth && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="access_token">Access Token</Label>
                  <Input
                    id="access_token"
                    type="password"
                    value={formData.access_token}
                    onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                    placeholder="Enter access token"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refresh_token">Refresh Token (optional)</Label>
                  <Input
                    id="refresh_token"
                    type="password"
                    value={formData.refresh_token}
                    onChange={(e) => setFormData({ ...formData, refresh_token: e.target.value })}
                    placeholder="Enter refresh token"
                  />
                </div>
              </>
            )}

            {selectedPlatform?.requires_api_key && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="Enter API key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_secret">API Secret (optional)</Label>
                  <Input
                    id="api_secret"
                    type="password"
                    value={formData.api_secret}
                    onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                    placeholder="Enter API secret"
                  />
                </div>
              </>
            )}

            <Button onClick={handleConnect} className="w-full">
              Connect Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
