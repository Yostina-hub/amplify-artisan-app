import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TrialSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [trialDuration, setTrialDuration] = useState<number>(3);
  const [isTrialEnabled, setIsTrialEnabled] = useState<boolean>(true);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['trial-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trial_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setTrialDuration(data.trial_duration_days);
        setIsTrialEnabled(data.is_trial_enabled);
      }
      
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error('No settings found');
      
      const { error } = await supabase
        .from('trial_settings')
        .update({
          trial_duration_days: trialDuration,
          is_trial_enabled: isTrialEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trial-settings'] });
      toast({
        title: "Settings Updated",
        description: "Trial settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const { data: activeTrials } = useQuery({
    queryKey: ['active-trials-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('subscription_requests')
        .select('*', { count: 'exact', head: true })
        .eq('is_trial', true)
        .eq('status', 'approved')
        .gt('trial_ends_at', new Date().toISOString());
      
      if (error) throw error;
      return count || 0;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Free Trial Settings</h1>
          <p className="text-muted-foreground">Configure your free trial program</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Trial Status
                </CardTitle>
                <CardDescription>Current trial program statistics</CardDescription>
              </div>
              <Badge variant={isTrialEnabled ? "default" : "secondary"} className="text-sm">
                {isTrialEnabled ? "Active" : "Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Active Trials</p>
                <p className="text-2xl font-bold">{activeTrials || 0}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Trial Duration</p>
                <p className="text-2xl font-bold">{settings?.trial_duration_days || 0} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Manage free trial settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <Label htmlFor="trial-enabled" className="text-base font-medium">
                  Enable Free Trials
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow new users to start a free trial
                </p>
              </div>
              <Switch
                id="trial-enabled"
                checked={isTrialEnabled}
                onCheckedChange={setIsTrialEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trial-duration" className="text-base font-medium">
                Trial Duration (Days)
              </Label>
              <Input
                id="trial-duration"
                type="number"
                min="1"
                max="30"
                value={trialDuration}
                onChange={(e) => setTrialDuration(parseInt(e.target.value))}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Set how many days users get free access (1-30 days)
              </p>
            </div>

            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
