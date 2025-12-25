import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, CheckCircle, XCircle, Link2, Unlink, Shield, 
  Globe, Eye, EyeOff, Send, AlertCircle, Zap, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Platform configurations - OAuth vs Direct Token
const PLATFORMS = [
  { 
    id: 'facebook', 
    name: 'Facebook', 
    gradient: 'from-blue-500 to-blue-600', 
    icon: '📘',
    type: 'oauth',
    scopes: 'pages_manage_posts,pages_read_engagement'
  },
  { 
    id: 'instagram', 
    name: 'Instagram', 
    gradient: 'from-pink-500 via-purple-500 to-pink-600', 
    icon: '📸',
    type: 'oauth',
    scopes: 'user_profile,user_media'
  },
  { 
    id: 'twitter', 
    name: 'Twitter/X', 
    gradient: 'from-sky-400 to-blue-500', 
    icon: '🐦',
    type: 'oauth',
    scopes: 'tweet.read tweet.write users.read'
  },
  { 
    id: 'linkedin', 
    name: 'LinkedIn', 
    gradient: 'from-blue-600 to-blue-700', 
    icon: '💼',
    type: 'oauth',
    scopes: 'w_member_social'
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    gradient: 'from-gray-900 to-gray-700', 
    icon: '🎵',
    type: 'oauth',
    scopes: 'user.info.basic,video.list'
  },
  { 
    id: 'telegram', 
    name: 'Telegram', 
    gradient: 'from-blue-400 to-cyan-500', 
    icon: '✈️',
    type: 'direct', // Uses bot token, not OAuth
    fields: ['bot_token', 'channel_id']
  },
  { 
    id: 'youtube', 
    name: 'YouTube', 
    gradient: 'from-red-500 to-red-600', 
    icon: '📺',
    type: 'oauth',
    scopes: 'https://www.googleapis.com/auth/youtube'
  },
  { 
    id: 'pinterest', 
    name: 'Pinterest', 
    gradient: 'from-red-600 to-rose-500', 
    icon: '📌',
    type: 'oauth',
    scopes: 'boards:read,pins:read,pins:write'
  },
  { 
    id: 'whatsapp', 
    name: 'WhatsApp', 
    gradient: 'from-green-500 to-green-600', 
    icon: '💬',
    type: 'direct',
    fields: ['api_token', 'phone_number_id']
  },
];

export default function SocialConnections() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [directConnectDialog, setDirectConnectDialog] = useState<string | null>(null);
  const [directFormData, setDirectFormData] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Get user's connected tokens
  const { data: tokens, isLoading: tokensLoading } = useQuery({
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

  // Get centralized OAuth apps configured by admin
  const { data: platformOAuthApps } = useQuery({
    queryKey: ['platform-oauth-apps-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_oauth_apps')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  // Disconnect mutation
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
      toast({ title: "Account disconnected" });
    },
  });

  // Direct connect mutation (for Telegram, WhatsApp)
  const directConnectMutation = useMutation({
    mutationFn: async ({ platform, data }: { platform: string; data: Record<string, string> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('No company found');

      // Validate based on platform
      if (platform === 'telegram') {
        if (!data.bot_token || !data.channel_id) {
          throw new Error('Bot token and channel ID are required');
        }
      }

      if (platform === 'whatsapp') {
        if (!data.api_token || !data.phone_number_id) {
          throw new Error('API token and Phone Number ID are required');
        }
      }

      const accountId = data.channel_id || data.phone_number_id;
      
      // Check if already exists
      const { data: existing } = await supabase
        .from('social_platform_tokens')
        .select('id')
        .eq('company_id', profile.company_id)
        .eq('platform', platform)
        .eq('account_id', accountId)
        .single();

      if (existing) {
        // Update existing token
        const { error } = await supabase
          .from('social_platform_tokens')
          .update({
            access_token: data.bot_token || data.api_token,
            account_name: accountId,
            is_active: true,
            metadata: { ...data, connected_via: 'direct' },
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert new token
        const { error } = await supabase
          .from('social_platform_tokens')
          .insert({
            company_id: profile.company_id,
            user_id: user.id,
            platform,
            access_token: data.bot_token || data.api_token,
            account_id: accountId,
            account_name: accountId,
            is_active: true,
            metadata: { ...data, connected_via: 'direct' }
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-platform-tokens'] });
      toast({ title: "Account connected successfully!" });
      setDirectConnectDialog(null);
      setDirectFormData({});
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle OAuth connection
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

      // Get centralized OAuth config
      const oauthConfig = platformOAuthApps?.find(app => app.platform_id === platformId);
      
      if (!oauthConfig) {
        toast({
          title: "Not Available",
          description: `${PLATFORMS.find(p => p.id === platformId)?.name} OAuth is not configured. Contact your administrator.`,
          variant: "destructive",
        });
        setConnectingPlatform(null);
        return;
      }

      const platform = PLATFORMS.find(p => p.id === platformId);
      const state = btoa(JSON.stringify({ 
        userId: user.id, 
        companyId: profile.company_id,
        platform: platformId 
      }));
      
      const redirectUri = encodeURIComponent(oauthConfig.redirect_url || `${window.location.origin}/oauth-callback`);
      const clientId = oauthConfig.client_id;
      
      let authUrl = '';
      
      switch (platformId) {
        case 'facebook':
          authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${platform?.scopes}`;
          break;
        case 'twitter':
          authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${encodeURIComponent(platform?.scopes || '')}`;
          break;
        case 'linkedin':
          authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${platform?.scopes}`;
          break;
        case 'instagram':
          authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${platform?.scopes}&response_type=code&state=${state}`;
          break;
        case 'tiktok':
          authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${clientId}&scope=${platform?.scopes}&response_type=code&redirect_uri=${redirectUri}&state=${state}`;
          break;
        case 'youtube':
          authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(platform?.scopes || '')}&state=${state}&access_type=offline`;
          break;
        case 'pinterest':
          authUrl = `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(platform?.scopes || '')}&state=${state}`;
          break;
        default:
          toast({
            title: "Coming Soon",
            description: `${platform?.name} integration coming soon`,
          });
          setConnectingPlatform(null);
          return;
      }

      // Open OAuth popup
      const popup = window.open(authUrl, 'OAuth', 'width=600,height=700,left=100,top=100');
      
      toast({
        title: "Connecting...",
        description: "Complete authorization in the popup window",
      });

      // Listen for popup close
      const checkPopup = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopup);
          setConnectingPlatform(null);
          queryClient.invalidateQueries({ queryKey: ['social-platform-tokens'] });
        }
      }, 500);
      
    } catch (error) {
      console.error('OAuth error:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to initiate connection",
        variant: "destructive",
      });
      setConnectingPlatform(null);
    }
  };

  // Handle direct connect button
  const handleDirectConnect = (platformId: string) => {
    setDirectConnectDialog(platformId);
    setDirectFormData({});
  };

  const getConnectedAccount = (platformId: string) => {
    return tokens?.find(t => t.platform === platformId && t.is_active);
  };

  const getConnectionHealth = (account: any) => {
    if (!account?.token_expires_at) return { status: 'healthy', label: 'Connected', color: 'green' };
    
    const expiresAt = new Date(account.token_expires_at);
    const now = new Date();
    const daysLeft = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { status: 'expired', label: 'Expired', color: 'red' };
    if (daysLeft < 7) return { status: 'warning', label: `${daysLeft}d left`, color: 'yellow' };
    return { status: 'healthy', label: 'Healthy', color: 'green' };
  };

  const isPlatformAvailable = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    if (platform?.type === 'direct') return true;
    return platformOAuthApps?.some(app => app.platform_id === platformId);
  };

  if (tokensLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            Social Connections
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect your social media accounts in one click
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {tokens?.filter(t => t.is_active).length || 0} Connected
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">
              {tokens?.filter(t => t.is_active).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active Connections</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {platformOAuthApps?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Available Platforms</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {PLATFORMS.filter(p => p.type === 'oauth').length}
            </div>
            <p className="text-xs text-muted-foreground">OAuth Platforms</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">
              {PLATFORMS.filter(p => p.type === 'direct').length}
            </div>
            <p className="text-xs text-muted-foreground">Direct Connect</p>
          </CardContent>
        </Card>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLATFORMS.map((platform) => {
          const connectedAccount = getConnectedAccount(platform.id);
          const isConnected = !!connectedAccount;
          const isAvailable = isPlatformAvailable(platform.id);
          const health = isConnected ? getConnectionHealth(connectedAccount) : null;

          return (
            <Card 
              key={platform.id} 
              className={cn(
                "border-2 transition-all duration-300 hover:shadow-lg",
                isConnected 
                  ? `bg-gradient-to-br ${platform.gradient} text-white border-white/20` 
                  : "hover:border-primary/50"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{platform.icon}</span>
                    <div>
                      <CardTitle className={cn("text-base", isConnected && "text-white")}>
                        {platform.name}
                      </CardTitle>
                      {isConnected && connectedAccount?.account_name && (
                        <p className="text-xs opacity-80 truncate max-w-[120px]">
                          @{connectedAccount.account_name}
                        </p>
                      )}
                    </div>
                  </div>
                  {isConnected && (
                    <CheckCircle className="h-5 w-5 text-white/80" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isConnected ? (
                  <>
                    {health && (
                      <div className="flex items-center justify-between p-2 bg-white/10 rounded-lg">
                        <span className="text-xs">Status</span>
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs border-none",
                            health.color === 'green' && "bg-green-500/30 text-white",
                            health.color === 'yellow' && "bg-yellow-500/30 text-white",
                            health.color === 'red' && "bg-red-500/30 text-white"
                          )}
                        >
                          {health.label}
                        </Badge>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-white/10 hover:bg-white/20 border-white/30 text-white"
                        onClick={() => platform.type === 'oauth' 
                          ? handleOAuthConnect(platform.id) 
                          : handleDirectConnect(platform.id)
                        }
                        disabled={connectingPlatform === platform.id}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 bg-white/10 hover:bg-white/20 border-white/30 text-white"
                        onClick={() => disconnectMutation.mutate(connectedAccount.id)}
                        disabled={disconnectMutation.isPending}
                      >
                        <Unlink className="h-3 w-3 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-muted-foreground">
                      {platform.type === 'oauth' ? (
                        <p className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Secure OAuth connection
                        </p>
                      ) : (
                        <p className="flex items-center gap-1">
                          <Send className="h-3 w-3" />
                          Direct token connection
                        </p>
                      )}
                    </div>
                    <Button
                      className={cn(
                        "w-full",
                        isAvailable 
                          ? "bg-gradient-to-r from-primary to-accent hover:opacity-90" 
                          : "bg-muted text-muted-foreground"
                      )}
                      onClick={() => platform.type === 'oauth' 
                        ? handleOAuthConnect(platform.id) 
                        : handleDirectConnect(platform.id)
                      }
                      disabled={!isAvailable || connectingPlatform === platform.id}
                    >
                      {connectingPlatform === platform.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : !isAvailable ? (
                        <>
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Not Available
                        </>
                      ) : (
                        <>
                          <Link2 className="mr-2 h-4 w-4" />
                          Connect
                        </>
                      )}
                    </Button>
                    {!isAvailable && platform.type === 'oauth' && (
                      <p className="text-xs text-muted-foreground text-center">
                        Contact admin to enable
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Direct Connect Dialog */}
      <Dialog open={!!directConnectDialog} onOpenChange={() => setDirectConnectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {PLATFORMS.find(p => p.id === directConnectDialog)?.icon}
              Connect {PLATFORMS.find(p => p.id === directConnectDialog)?.name}
            </DialogTitle>
            <DialogDescription>
              Enter your credentials to connect this platform
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {directConnectDialog === 'telegram' && (
              <>
                <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-2">
                  <p className="font-medium">Quick Setup:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Message @BotFather on Telegram</li>
                    <li>Send /newbot and follow instructions</li>
                    <li>Copy the bot token provided</li>
                    <li>Add bot as admin to your channel</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <Label>Bot Token *</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets['bot_token'] ? 'text' : 'password'}
                      value={directFormData.bot_token || ''}
                      onChange={(e) => setDirectFormData({ ...directFormData, bot_token: e.target.value })}
                      placeholder="1234567890:ABCdefGHI..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecrets({ ...showSecrets, bot_token: !showSecrets['bot_token'] })}
                    >
                      {showSecrets['bot_token'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Channel ID *</Label>
                  <Input
                    value={directFormData.channel_id || ''}
                    onChange={(e) => setDirectFormData({ ...directFormData, channel_id: e.target.value })}
                    placeholder="@yourchannel or -1001234567890"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use @username for public channels or numeric ID
                  </p>
                </div>
              </>
            )}

            {directConnectDialog === 'whatsapp' && (
              <>
                <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-2">
                  <p className="font-medium">WhatsApp Business API:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Go to Meta Business Suite</li>
                    <li>Set up WhatsApp Business API</li>
                    <li>Get your API token and Phone Number ID</li>
                  </ol>
                </div>
                <div className="space-y-2">
                  <Label>API Token *</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets['api_token'] ? 'text' : 'password'}
                      value={directFormData.api_token || ''}
                      onChange={(e) => setDirectFormData({ ...directFormData, api_token: e.target.value })}
                      placeholder="Your WhatsApp API token"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecrets({ ...showSecrets, api_token: !showSecrets['api_token'] })}
                    >
                      {showSecrets['api_token'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number ID *</Label>
                  <Input
                    value={directFormData.phone_number_id || ''}
                    onChange={(e) => setDirectFormData({ ...directFormData, phone_number_id: e.target.value })}
                    placeholder="Your phone number ID"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDirectConnectDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => directConnectMutation.mutate({ 
                platform: directConnectDialog!, 
                data: directFormData 
              })}
              disabled={directConnectMutation.isPending}
            >
              {directConnectMutation.isPending ? (
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
