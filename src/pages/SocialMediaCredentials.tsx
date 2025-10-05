import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Link2, Unlink } from "lucide-react";

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', color: 'bg-blue-500' },
  { id: 'instagram', name: 'Instagram', color: 'bg-pink-500' },
  { id: 'twitter', name: 'Twitter', color: 'bg-sky-500' },
  { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
  { id: 'tiktok', name: 'TikTok', color: 'bg-black' },
  { id: 'telegram', name: 'Telegram', color: 'bg-blue-400' },
];

export default function SocialMediaCredentials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState<string | null>(null);

  // Fetch connected accounts
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

  // Disconnect account mutation
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
      toast({
        title: "Account disconnected",
        description: "Social media account has been disconnected successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disconnect account",
        variant: "destructive",
      });
    },
  });

  const handleConnect = async (platformId: string) => {
    toast({
      title: "Coming soon",
      description: `${platformId} OAuth integration is coming soon! Contact your admin to configure platform credentials.`,
    });
  };

  const getConnectedAccount = (platformId: string) => {
    return tokens?.find(t => t.platform === platformId && t.is_active);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Social Media Credentials</h1>
          <p className="text-muted-foreground mt-2">
            Connect your social media accounts to start publishing content
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORMS.map((platform) => {
              const connectedAccount = getConnectedAccount(platform.id);
              const isConnected = !!connectedAccount;
              const isConnecting = connecting === platform.id;

              return (
                <Card key={platform.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white font-bold`}>
                          {platform.name[0]}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{platform.name}</CardTitle>
                          {isConnected && (
                            <CardDescription className="text-xs mt-1">
                              @{connectedAccount.account_name}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      {isConnected ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Connected
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isConnected ? (
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          <p>Connected on {new Date(connectedAccount.created_at).toLocaleDateString()}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => disconnectMutation.mutate(connectedAccount.id)}
                          disabled={disconnectMutation.isPending}
                        >
                          <Unlink className="mr-2 h-4 w-4" />
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleConnect(platform.id)}
                        disabled={isConnecting}
                      >
                        {isConnecting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Link2 className="mr-2 h-4 w-4" />
                            Connect {platform.name}
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Learn how to get API credentials for each platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• <strong>Facebook/Instagram:</strong> Create an app at developers.facebook.com</p>
            <p>• <strong>Twitter:</strong> Apply for API access at developer.twitter.com</p>
            <p>• <strong>LinkedIn:</strong> Create an app at linkedin.com/developers</p>
            <p>• <strong>TikTok:</strong> Register at developers.tiktok.com</p>
            <p>• <strong>Telegram:</strong> Create a bot using @BotFather</p>
          </CardContent>
      </Card>
    </div>
  );
}
