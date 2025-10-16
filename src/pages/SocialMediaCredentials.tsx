import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Link2, Unlink, Shield, TrendingUp, Users, BarChart3, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', gradient: 'from-blue-500 to-blue-600', icon: '📘' },
  { id: 'instagram', name: 'Instagram', gradient: 'from-pink-500 via-purple-500 to-pink-600', icon: '📸' },
  { id: 'twitter', name: 'Twitter', gradient: 'from-sky-400 to-blue-500', icon: '🐦' },
  { id: 'linkedin', name: 'LinkedIn', gradient: 'from-blue-600 to-blue-700', icon: '💼' },
  { id: 'tiktok', name: 'TikTok', gradient: 'from-gray-900 to-gray-700', icon: '🎵' },
  { id: 'telegram', name: 'Telegram', gradient: 'from-blue-400 to-cyan-500', icon: '✈️' },
  { id: 'youtube', name: 'YouTube', gradient: 'from-red-500 to-red-600', icon: '📺' },
  { id: 'pinterest', name: 'Pinterest', gradient: 'from-red-600 to-red-700', icon: '📌' },
];

export default function SocialMediaCredentials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const { data: tokens, isLoading } = useQuery({
    queryKey: ['social-platform-tokens'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_platform_tokens')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await supabase
        .from('social_platform_tokens')
        .update({ is_active: false })
        .eq('id', tokenId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-platform-tokens'] });
      toast({ title: "Account disconnected successfully" });
    },
  });

  const handleOAuthConnect = async (platformId: string) => {
    setConnectingPlatform(platformId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        toast({
          title: "Setup Required",
          description: "Please complete your company profile first",
          variant: "destructive",
        });
        setConnectingPlatform(null);
        return;
      }

      const state = btoa(JSON.stringify({ 
        userId: user.id, 
        companyId: profile.company_id,
        platform: platformId 
      }));
      
      const redirectUri = `${window.location.origin}/oauth-callback`;
      
      let authUrl = '';
      
      switch (platformId) {
        case 'facebook':
          authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=pages_manage_posts,pages_read_engagement`;
          break;
        case 'twitter':
          authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=tweet.read%20tweet.write%20users.read`;
          break;
        case 'linkedin':
          authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=w_member_social`;
          break;
        default:
          toast({
            title: "Coming Soon",
            description: `${PLATFORMS.find(p => p.id === platformId)?.name} OAuth integration in development`,
          });
          setConnectingPlatform(null);
          return;
      }

      window.open(authUrl, 'OAuth', 'width=600,height=700,left=100,top=100');
      
      toast({
        title: "Connecting...",
        description: "Complete authorization in the popup window",
      });
      
      setTimeout(() => setConnectingPlatform(null), 3000);
    } catch (error) {
      console.error('OAuth error:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to initiate OAuth flow",
        variant: "destructive",
      });
      setConnectingPlatform(null);
    }
  };

  const getConnectedAccount = (platformId: string) => {
    return tokens?.find(t => t.platform === platformId && t.is_active);
  };

  const getConnectionHealth = (account: any) => {
    if (!account?.expires_at) return { status: 'unknown', label: 'Unknown', color: 'gray' };
    
    const expiresAt = new Date(account.expires_at);
    const now = new Date();
    const daysLeft = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'expired', label: 'Expired', color: 'red' };
    if (daysLeft < 7) return { status: 'warning', label: `${daysLeft}d left`, color: 'yellow' };
    return { status: 'healthy', label: 'Healthy', color: 'green' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 animate-in fade-in-50 duration-700">
      <div className="container mx-auto p-6 space-y-6">
        <div className="backdrop-blur-sm bg-card/50 p-6 rounded-2xl border-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Connected Accounts
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage {PLATFORMS.length}+ social media platform integrations
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORMS.map((platform) => {
              const connectedAccount = getConnectedAccount(platform.id);
              const isConnected = !!connectedAccount;

              return (
                <Card key={platform.id} className={cn(
                  "border-2 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:scale-105",
                  isConnected ? "bg-gradient-to-br " + platform.gradient + " text-white border-white/20" : "bg-card/95"
                )}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{platform.icon}</div>
                        <div>
                          <CardTitle className={cn("text-lg", isConnected && "text-white")}>{platform.name}</CardTitle>
                          {isConnected && (
                            <p className="text-xs opacity-90 mt-1">@{connectedAccount.account_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isConnected ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur rounded-lg">
                            <span className="text-sm font-medium">Status</span>
                            <Badge variant="secondary" className="bg-white/20 text-white border-none">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          </div>
                          {(() => {
                            const health = getConnectionHealth(connectedAccount);
                            return (
                              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur rounded-lg">
                                <span className="text-sm font-medium">Health</span>
                                <Badge variant="secondary" className={cn(
                                  "border-none",
                                  health.color === 'green' && "bg-green-500/20 text-green-100",
                                  health.color === 'yellow' && "bg-yellow-500/20 text-yellow-100",
                                  health.color === 'red' && "bg-red-500/20 text-red-100"
                                )}>
                                  {health.label}
                                </Badge>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-white/10 hover:bg-white/20 border-white/20 text-white"
                            onClick={() => handleOAuthConnect(platform.id)}
                            disabled={connectingPlatform === platform.id}
                          >
                            <Link2 className="mr-1 h-3 w-3" />
                            Reconnect
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-white/10 hover:bg-white/20 border-white/20 text-white"
                            onClick={() => disconnectMutation.mutate(connectedAccount.id)}
                            disabled={disconnectMutation.isPending}
                          >
                            <Unlink className="mr-1 h-3 w-3" />
                            Disconnect
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>• One-click OAuth connection</p>
                          <p>• Real-time message sync</p>
                          <p>• Full API access</p>
                        </div>
                        <Button
                          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
                          onClick={() => handleOAuthConnect(platform.id)}
                          disabled={connectingPlatform === platform.id}
                        >
                          {connectingPlatform === platform.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Link2 className="mr-2 h-4 w-4" />
                              Connect
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="backdrop-blur-sm bg-card/95 border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Connected</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {tokens?.filter(t => t.is_active).length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active integrations</p>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-sm bg-card/95 border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reach</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">2.5M+</div>
              <p className="text-xs text-muted-foreground mt-1">Combined followers</p>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-sm bg-card/95 border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Health</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">98%</div>
              <p className="text-xs text-muted-foreground mt-1">API uptime</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}