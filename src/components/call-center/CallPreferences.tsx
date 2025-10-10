import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, User, CheckCircle2, XCircle, Settings } from "lucide-react";
import { toast } from "sonner";

interface CallPreferencesProps {
  onOpenPersonalSettings: () => void;
}

export default function CallPreferences({ onOpenPersonalSettings }: CallPreferencesProps) {
  const queryClient = useQueryClient();
  const [useCompany, setUseCompany] = useState(true);

  // Fetch call configuration
  const { data: callConfig, isLoading } = useQuery({
    queryKey: ["call-preferences"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.user.id)
        .single();

      if (!profile?.company_id) {
        return { 
          hasCompany: false, 
          companyIntegration: null, 
          userPreference: null 
        };
      }

      // Get user preferences
      const { data: userPref } = await supabase
        .from("user_call_preferences")
        .select("*")
        .eq("user_id", user.user.id)
        .maybeSingle();

      // Get company integration
      const { data: companyInt } = await supabase
        .from("call_center_integrations")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .maybeSingle();

      // Check if company has active subscription
      const hasActiveSubscription = companyInt?.subscription_active && 
        (!companyInt?.subscription_expires_at || new Date(companyInt.subscription_expires_at) > new Date());

      return {
        hasCompany: true,
        companyIntegration: companyInt,
        userPreference: userPref,
        hasActiveSubscription,
        companyId: profile.company_id,
        userId: user.user.id,
      };
    },
  });

  // Update local state when data loads
  useEffect(() => {
    if (callConfig?.userPreference) {
      setUseCompany(callConfig.userPreference.use_company_integration ?? true);
    }
  }, [callConfig]);

  // Save preference mutation
  const savePreferenceMutation = useMutation({
    mutationFn: async (useCompanyIntegration: boolean) => {
      if (!callConfig?.userId) return;

      const { error } = await supabase
        .from("user_call_preferences")
        .upsert({
          user_id: callConfig.userId,
          company_id: callConfig.companyId,
          use_company_integration: useCompanyIntegration,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-preferences"] });
      queryClient.invalidateQueries({ queryKey: ["call-center-config"] });
      toast.success("Call preferences updated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update preferences");
    },
  });

  const handleToggle = (checked: boolean) => {
    setUseCompany(checked);
    savePreferenceMutation.mutate(checked);
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading preferences...</div>;
  }

  if (!callConfig?.hasCompany) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal SIP Settings
          </CardTitle>
          <CardDescription>
            Configure your personal SIP credentials to make calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onOpenPersonalSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Configure SIP Settings
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Center Configuration</CardTitle>
        <CardDescription>
          Choose between company subscription or personal SIP settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Subscription Status */}
        <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
          <Building2 className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">Company Call Center</span>
              {callConfig.hasActiveSubscription ? (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  Not Subscribed
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {callConfig.hasActiveSubscription
                ? `Subscription active${callConfig.companyIntegration?.subscription_expires_at 
                    ? ` until ${new Date(callConfig.companyIntegration.subscription_expires_at).toLocaleDateString()}`
                    : ""}`
                : "No active call center subscription. Contact your admin to subscribe."}
            </p>
            {callConfig.companyIntegration?.subscription_plan && (
              <p className="text-xs text-muted-foreground mt-1">
                Plan: {callConfig.companyIntegration.subscription_plan}
              </p>
            )}
          </div>
        </div>

        {/* Toggle between company and personal */}
        {callConfig.hasActiveSubscription && (
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="use-company" className="text-base">
                Use Company Call Center
              </Label>
              <p className="text-sm text-muted-foreground">
                Use your company's subscribed call center service
              </p>
            </div>
            <Switch
              id="use-company"
              checked={useCompany}
              onCheckedChange={handleToggle}
              disabled={savePreferenceMutation.isPending}
            />
          </div>
        )}

        {/* Personal settings option */}
        {(!useCompany || !callConfig.hasActiveSubscription) && (
          <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
            <User className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <div className="font-medium mb-1">Personal SIP Settings</div>
              <p className="text-sm text-muted-foreground mb-3">
                Configure your own SIP server credentials for making calls
              </p>
              <Button onClick={onOpenPersonalSettings} variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure Personal Settings
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
