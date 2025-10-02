import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Twitter, Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type SocialAccount = {
  id: string;
  platform: string;
  account_name: string;
  is_active: boolean;
};

export default function Settings() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_accounts')
        .select('*');
      
      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching accounts",
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
        .update({ is_active: false })
        .eq('id', accountId);
      
      if (error) throw error;
      
      toast({
        title: "Account disconnected",
        description: "Your account has been disconnected successfully",
      });
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return <Twitter className="h-5 w-5" />;
      case 'facebook': return <Facebook className="h-5 w-5" />;
      case 'instagram': return <Instagram className="h-5 w-5" />;
      case 'linkedin': return <Linkedin className="h-5 w-5" />;
      case 'youtube': return <Youtube className="h-5 w-5" />;
      default: return null;
    }
  };

  const platforms = ['Twitter', 'Facebook', 'Instagram', 'LinkedIn', 'YouTube', 'TikTok'];

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
          ) : (
            platforms.map((platform) => {
              const connectedAccount = accounts.find(
                (acc) => acc.platform.toLowerCase() === platform.toLowerCase() && acc.is_active
              );
              
              return (
                <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPlatformIcon(platform)}
                    <div>
                      <span className="font-medium">{platform}</span>
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">Connect</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Connect {platform}</DialogTitle>
                          <DialogDescription>
                            Enter your {platform} account credentials to connect
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Account Username</Label>
                            <Input placeholder={`@username`} />
                          </div>
                          <div className="space-y-2">
                            <Label>Access Token</Label>
                            <Input type="password" placeholder="Paste your API token here" />
                          </div>
                          <Button className="w-full">Connect Account</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
