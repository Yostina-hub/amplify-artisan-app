import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as Icons from "lucide-react";

interface Platform {
  id: string;
  name: string;
  display_name: string;
  icon_name: string | null;
  requires_oauth: boolean;
  requires_api_key: boolean;
  is_active: boolean;
}

interface Subscription {
  platform_id: string;
  is_active: boolean;
  subscribed_at: string;
}

export default function CompanyPlatformSubscriptions() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, Subscription>>({});
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const { toast } = useToast();

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
          description: "You need to be assigned to a company to manage subscriptions",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setCompanyId(profile.company_id);

      // Fetch all active platforms
      const { data: platformsData, error: platformsError } = await supabase
        .from("social_platforms")
        .select("*")
        .eq("is_active", true)
        .order("display_name");

      if (platformsError) throw platformsError;

      setPlatforms(platformsData || []);

      // Fetch company's subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from("company_platform_subscriptions")
        .select("*")
        .eq("company_id", profile.company_id);

      if (subsError) throw subsError;

      // Organize subscriptions by platform_id
      const subsMap: Record<string, Subscription> = {};
      (subsData || []).forEach((sub: any) => {
        subsMap[sub.platform_id] = sub;
      });
      setSubscriptions(subsMap);
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

  const handleSubscribe = async (platformId: string) => {
    if (!companyId) return;

    try {
      setSubscribing(platformId);

      const { error } = await supabase
        .from("company_platform_subscriptions")
        .insert([{
          company_id: companyId,
          platform_id: platformId,
          is_active: true,
        }]);

      if (error) throw error;

      toast({ 
        title: "Subscribed successfully",
        description: "You can now configure this platform in Platform Settings"
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error subscribing",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubscribing(null);
    }
  };

  const handleUnsubscribe = async (platformId: string) => {
    if (!companyId) return;

    const confirmed = window.confirm(
      "Are you sure you want to unsubscribe from this platform? This will deactivate all related configurations."
    );

    if (!confirmed) return;

    try {
      setSubscribing(platformId);

      const { error } = await supabase
        .from("company_platform_subscriptions")
        .update({ is_active: false })
        .eq("company_id", companyId)
        .eq("platform_id", platformId);

      if (error) throw error;

      toast({ title: "Unsubscribed successfully" });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error unsubscribing",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubscribing(null);
    }
  };

  const getPlatformIcon = (iconName: string | null) => {
    if (!iconName) return Icons.Circle;
    const Icon = (Icons as any)[iconName];
    return Icon || Icons.Circle;
  };

  const isSubscribed = (platformId: string) => {
    return subscriptions[platformId]?.is_active === true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="container mx-auto p-8">
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
    <div className="container mx-auto p-8 space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold">Platform Subscriptions</h1>
        <p className="text-muted-foreground mt-2">
          Subscribe to social media platforms to start managing your presence
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          After subscribing to a platform, you'll need to configure its API credentials in Platform Settings.
        </AlertDescription>
      </Alert>

      {platforms.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No platforms are currently available. Contact your system administrator.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => {
          const Icon = getPlatformIcon(platform.icon_name);
          const subscribed = isSubscribed(platform.id);
          const processing = subscribing === platform.id;

          return (
            <Card key={platform.id} className={subscribed ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-8 w-8" />
                    <div>
                      <CardTitle>{platform.display_name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {platform.requires_oauth && "OAuth 2.0"}{" "}
                        {platform.requires_api_key && "API Key"}
                      </CardDescription>
                    </div>
                  </div>
                  {subscribed && (
                    <Badge variant="default" className="gap-1">
                      <Check className="h-3 w-3" />
                      Active
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {subscribed ? (
                  <Button
                    variant="outline"
                    onClick={() => handleUnsubscribe(platform.id)}
                    disabled={processing}
                    className="w-full"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Unsubscribe"
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(platform.id)}
                    disabled={processing}
                    className="w-full"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {Object.keys(subscriptions).length > 0 && (
        <Alert>
          <AlertDescription>
            You have {Object.keys(subscriptions).length} platform subscription(s). Configure them in{" "}
            <a href="/company/platform-settings" className="text-primary hover:underline font-medium">
              Platform Settings
            </a>.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
