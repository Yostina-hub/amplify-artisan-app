import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EmailSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    id: "",
    sender_email: "",
    sender_name: "",
    is_verified: false,
    is_active: true,
  });

  useEffect(() => {
    fetchEmailConfig();
  }, []);

  const fetchEmailConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("email_configurations")
        .select("*")
        .is("company_id", null)
        .single();

      if (error) throw error;
      if (data) {
        setConfig(data);
      }
    } catch (error: any) {
      console.error("Error fetching email config:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("email_configurations")
        .update({
          sender_email: config.sender_email,
          sender_name: config.sender_name,
          is_active: config.is_active,
        })
        .eq("id", config.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email settings saved successfully",
      });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide email sender settings
          </p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Make sure your sender email is verified in Resend dashboard at{" "}
          <a
            href="https://resend.com/domains"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            https://resend.com/domains
          </a>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            System Email Configuration
          </CardTitle>
          <CardDescription>
            These settings will be used for all system emails (company approvals, notifications, etc.)
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
              placeholder="Your Organization Name"
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
              placeholder="no-reply@yourdomain.com"
            />
            <p className="text-sm text-muted-foreground">
              Must be a verified domain in your Resend account
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
