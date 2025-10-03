import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Calendar, MessageSquare, Twitter, Instagram, Linkedin, Facebook, Youtube, MessageCircle, Pin, Camera, Send, Phone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ServiceSection } from "@/features/dashboard/ServiceSection";
import { AIDrawer } from "@/features/dashboard/AIDrawer";
import { FreeTrialBanner } from "@/components/FreeTrialBanner";
import { SERVICE_CATEGORIES } from "@/features/dashboard/data";
import { Service } from "@/features/dashboard/types";
import { PersonalizedAds } from "@/components/PersonalizedAds";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CompanyData {
  name: string;
  userCount: number;
  postCount: number;
  scheduledPosts: number;
  campaignCount: number;
  influencerCount: number;
  totalFollowers: number;
  engagementRate: number;
  recentActivity: Array<{
    platform: string;
    action: string;
    time: string;
    icon: any;
    color: string;
  }>;
  connectedPlatforms: Array<{
    name: string;
    status: string;
    icon: any;
    color: string;
  }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCompanyData();
    }
  }, [user]);

  const fetchCompanyData = async () => {
    try {
      // Get user's profile to find company
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, full_name')
        .eq('id', user?.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      // Get company info
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', profile.company_id)
        .single();

      // Get company users count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id);

      // Get company posts
      const { data: posts, count: postCount } = await supabase
        .from('social_media_posts')
        .select('*', { count: 'exact' })
        .eq('company_id', profile.company_id);

      // Get scheduled posts
      const { count: scheduledCount } = await supabase
        .from('social_media_posts')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .eq('status', 'scheduled');

      // Get campaigns
      const { data: campaigns, count: campaignCount } = await supabase
        .from('ad_campaigns')
        .select('*', { count: 'exact' })
        .eq('company_id', profile.company_id);

      // Get influencers
      const { count: influencerCount } = await supabase
        .from('influencers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id);

      // Get social accounts
      const { data: accounts } = await supabase
        .from('social_media_accounts')
        .select('platform, is_active')
        .eq('company_id', profile.company_id);

      // Get recent audit logs
      const { data: auditLogs } = await supabase
        .from('audit_log_view')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
        .limit(6);

      // Calculate metrics
      const totalFollowers = 45231; // This would come from aggregated social metrics
      const avgEngagement = campaigns?.reduce((acc, c) => {
        const impressions = c.impressions || 0;
        const clicks = c.clicks || 0;
        return acc + (impressions > 0 ? (clicks / impressions) * 100 : 0);
      }, 0) / (campaigns?.length || 1) || 12.5;

      // Map recent activity
      const platformIconMap: Record<string, any> = {
        Twitter: Twitter,
        Instagram: Instagram,
        LinkedIn: Linkedin,
        Facebook: Facebook,
        YouTube: Youtube,
      };

      const platformColorMap: Record<string, string> = {
        Twitter: "text-[#1DA1F2]",
        Instagram: "text-[#E4405F]",
        LinkedIn: "text-[#0A66C2]",
        Facebook: "text-[#1877F2]",
        YouTube: "text-[#FF0000]",
      };

      const recentActivity = auditLogs?.slice(0, 6).map(log => ({
        platform: log.table_name?.replace('_', ' ') || 'System',
        action: `${log.action} - ${log.user_name || 'User'}`,
        time: new Date(log.created_at).toLocaleString(),
        icon: MessageCircle,
        color: "text-foreground",
      })) || [];

      // Map connected platforms
      const allPlatforms = [
        { name: "Twitter", icon: Twitter, color: "text-[#1DA1F2]" },
        { name: "Instagram", icon: Instagram, color: "text-[#E4405F]" },
        { name: "LinkedIn", icon: Linkedin, color: "text-[#0A66C2]" },
        { name: "Facebook", icon: Facebook, color: "text-[#1877F2]" },
        { name: "YouTube", icon: Youtube, color: "text-[#FF0000]" },
        { name: "Pinterest", icon: Pin, color: "text-[#E60023]" },
        { name: "Telegram", icon: Send, color: "text-[#0088cc]" },
        { name: "WhatsApp", icon: Phone, color: "text-[#25D366]" },
      ];

      const connectedPlatforms = allPlatforms.map(platform => ({
        ...platform,
        status: accounts?.some(a => a.platform.toLowerCase() === platform.name.toLowerCase() && a.is_active) 
          ? "Connected" 
          : "Not Connected",
      }));

      setCompanyData({
        name: company?.name || 'Your Company',
        userCount: userCount || 0,
        postCount: postCount || 0,
        scheduledPosts: scheduledCount || 0,
        campaignCount: campaignCount || 0,
        influencerCount: influencerCount || 0,
        totalFollowers,
        engagementRate: avgEngagement,
        recentActivity: recentActivity.length > 0 ? recentActivity : [
          { platform: "Twitter", action: "New follower", time: "2 hours ago", icon: Twitter, color: "text-[#1DA1F2]" },
          { platform: "Instagram", action: "Post published", time: "5 hours ago", icon: Instagram, color: "text-[#E4405F]" },
          { platform: "LinkedIn", action: "Comment received", time: "1 day ago", icon: Linkedin, color: "text-[#0A66C2]" },
          { platform: "Facebook", action: "Post scheduled", time: "2 days ago", icon: Facebook, color: "text-[#1877F2]" },
          { platform: "YouTube", action: "Video uploaded", time: "3 days ago", icon: Youtube, color: "text-[#FF0000]" },
          { platform: "TikTok", action: "Trending post", time: "4 days ago", icon: MessageCircle, color: "text-foreground" },
        ],
        connectedPlatforms,
      });
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIClick = (service: Service) => {
    setSelectedService(service);
    setAiDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-glow to-accent p-8 shadow-elegant">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,hsl(6_78%_57%_/_0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,hsl(184_91%_30%_/_0.2),transparent_50%)]" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {companyData && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                  <Building2 className="h-4 w-4 text-white" />
                  <span className="text-white text-sm font-medium">{companyData.name}</span>
                </div>
              )}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white animate-in fade-in-50 duration-500">
              Welcome Back! 👋
            </h1>
            <p className="text-white/90 text-lg animate-in fade-in-50 duration-500 delay-100">
              Your social media empire awaits. Let's create something amazing today.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/composer')}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-in zoom-in-50 duration-500 delay-200"
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-100">
          <StatCard
            title="Total Followers"
            value={companyData?.totalFollowers.toLocaleString() || "0"}
            change="+20.1%"
            icon={Users}
            trend="up"
          />
        </div>
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-200">
          <StatCard
            title="Engagement Rate"
            value={`${companyData?.engagementRate.toFixed(1) || "0"}%`}
            change="+4.3%"
            icon={TrendingUp}
            trend="up"
          />
        </div>
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-300">
          <StatCard
            title="Scheduled Posts"
            value={companyData?.scheduledPosts.toString() || "0"}
            change={companyData?.scheduledPosts ? "+2" : "0"}
            icon={Calendar}
            trend={companyData?.scheduledPosts ? "up" : "down"}
          />
        </div>
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-[400ms]">
          <StatCard
            title="Total Posts"
            value={companyData?.postCount.toLocaleString() || "0"}
            change="+12%"
            icon={MessageSquare}
            trend="up"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 animate-in fade-in-50 duration-700 delay-500">
        <Card className="col-span-4 border-2 hover:shadow-xl transition-all duration-300 hover:border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companyData?.recentActivity.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-300 hover:shadow-md group cursor-pointer">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.platform}</p>
                      <p className="text-xs text-muted-foreground">{item.action}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="col-span-3 space-y-4">
          <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Camera className="h-4 w-4 text-white" />
                </div>
                Connected Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {companyData?.connectedPlatforms.map((platform, i) => {
                  const Icon = platform.icon;
                  const isConnected = platform.status === "Connected";
                  return (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/30 hover:shadow-md transition-all duration-300 group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`w-4 h-4 ${platform.color}`} />
                        </div>
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">{platform.name}</span>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium transition-all duration-300 ${isConnected ? 'bg-gradient-to-r from-success/20 to-success/10 text-success border border-success/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                        {platform.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI-Powered Personalized Ads */}
          <PersonalizedAds maxAds={2} />
        </div>
      </div>

      {/* Service Grid */}
      <div className="space-y-8 mt-8">
        {SERVICE_CATEGORIES.map(category => (
          <ServiceSection
            key={category.id}
            title={category.title}
            services={category.services}
            onAIClick={handleAIClick}
          />
        ))}
      </div>

      {/* AI Drawer */}
      <AIDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        service={selectedService}
      />
    </div>
  );
}
