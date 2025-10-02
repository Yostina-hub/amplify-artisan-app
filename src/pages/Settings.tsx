import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as Icons from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { querySocialMediaAccountsSafe } from "@/lib/safeQuery";

type SocialAccount = {
  id: string;
  platform: string;
  account_name: string;
  is_active: boolean;
};

type Platform = {
  id: string;
  name: string;
  display_name: string;
  icon_name: string | null;
};

export default function Settings() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, platformsRes] = await Promise.all([
        querySocialMediaAccountsSafe().select('*'),
        supabase.from('social_platforms').select('id, name, display_name, icon_name').eq('is_active', true),
      ]);
      
      if (accountsRes.error) throw accountsRes.error;
      if (platformsRes.error) throw platformsRes.error;
      
      setAccounts(accountsRes.data || []);
      setPlatforms(platformsRes.data || []);
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

  const handleDisconnect = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('social_media_accounts')
        .delete()
        .eq('id', accountId);
      
      if (error) throw error;
      
      toast({
        title: "Account disconnected",
        description: "Your account has been disconnected successfully",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformData = platforms.find(p => p.name.toLowerCase() === platform.toLowerCase());
    if (!platformData?.icon_name) return null;
    
    const Icon = (Icons as any)[platformData.icon_name];
    return Icon ? <Icon className="h-5 w-5" /> : null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and social media connections
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="john@example.com" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Social Media Accounts</CardTitle>
          <CardDescription>Manage your social media platform connections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p>Loading accounts...</p>
          ) : platforms.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No platforms available</p>
              <Button 
                variant="link" 
                onClick={() => navigate('/social-accounts')}
                className="mt-2"
              >
                Manage Social Accounts
              </Button>
            </div>
          ) : (
            platforms.map((platform) => {
              const connectedAccount = accounts.find(
                (acc) => acc.platform.toLowerCase() === platform.name.toLowerCase() && acc.is_active
              );
              
              return (
                <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(platform.name)}
                    <div>
                      <span className="font-medium">{platform.display_name}</span>
                      {connectedAccount && (
                        <p className="text-sm text-muted-foreground">@{connectedAccount.account_name}</p>
                      )}
                    </div>
                  </div>
                  {connectedAccount ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDisconnect(connectedAccount.id)}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => navigate('/social-accounts')}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive email updates</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Post Reminders</p>
              <p className="text-sm text-muted-foreground">Get reminded about scheduled posts</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Comment Notifications</p>
              <p className="text-sm text-muted-foreground">Get notified about new comments</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
