import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CompanyEmailSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [config, setConfig] = useState({
    id: "",
    sender_email: "",
    sender_name: "",
    is_active: true,
  });

  useEffect(() => {
    fetchCompanyAndConfig();
  }, []);

  const fetchCompanyAndConfig = async () => {
    try {
      // Get user's company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!profile?.company_id) {
        toast({
          title: "Error",
          description: "You are not associated with a company",
          variant: "destructive",
        });
        return;
      }

      setCompanyId(profile.company_id);

      // Try to fetch existing config
      const { data: existingConfig } = await supabase
        .from("email_configurations")
        .select("*")
        .eq("company_id", profile.company_id)
        .single();

      if (existingConfig) {
        setConfig(existingConfig);
      }
    } catch (error: any) {
      console.error("Error fetching config:", error);
    }
  };

  const handleSave = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      if (config.id) {
        // Update existing
        const { error } = await supabase
          .from("email_configurations")
          .update({
            sender_email: config.sender_email,
            sender_name: config.sender_name,
            is_active: config.is_active,
          })
          .eq("id", config.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("email_configurations")
          .insert({
            company_id: companyId,
            sender_email: config.sender_email,
            sender_name: config.sender_name,
            is_active: config.is_active,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Email settings saved successfully",
      });
      
      // Refresh config
      fetchCompanyAndConfig();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Email Settings</h1>
        <p className="text-muted-foreground">
          Configure your company's email sender settings
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your email domain must be verified in Resend. Contact your system administrator if you need help.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Company Email Configuration
          </CardTitle>
          <CardDescription>
            These settings will be used for emails sent from your company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sender_name">Sender Name</Label>
            <Input
              id="sender_name"
              value={config.sender_name}
              onChange={(e) =>
                setConfig({ ...config, sender_name: e.target.value })
              }
              placeholder="Your Company Name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sender_email">Sender Email</Label>
            <Input
              id="sender_email"
              type="email"
              value={config.sender_email}
              onChange={(e) =>
                setConfig({ ...config, sender_email: e.target.value })
              }
              placeholder="notifications@yourcompany.com"
            />
            <p className="text-sm text-muted-foreground">
              Must be a verified domain
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable email sending
              </p>
            </div>
            <Switch
              checked={config.is_active}
              onCheckedChange={(checked) =>
                setConfig({ ...config, is_active: checked })
              }
            />
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
