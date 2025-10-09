import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, TrendingUp, Calendar, MessageSquare, Building2, Crown, 
  Shield, Target, BarChart3, Globe, Zap, Camera, ArrowRight, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ServiceSection } from "@/features/dashboard/ServiceSection";
import { AIDrawer } from "@/features/dashboard/AIDrawer";
import { SERVICE_CATEGORIES } from "@/features/dashboard/data";
import { Service } from "@/features/dashboard/types";
import { PersonalizedAds } from "@/components/PersonalizedAds";
import { RecommendedContentFeed } from "@/components/RecommendedContentFeed";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UnifiedGrowthShowcase } from "@/components/UnifiedGrowthShowcase";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  userType: 'admin' | 'company' | 'user';
  companyName?: string;
  metrics: {
    primary: { label: string; title: string; value: string; change: string; icon: any; trend: 'up' | 'down' };
    secondary: { label: string; title: string; value: string; change: string; icon: any; trend: 'up' | 'down' };
    tertiary: { label: string; title: string; value: string; change: string; icon: any; trend: 'up' | 'down' };
    quaternary: { label: string; title: string; value: string; change: string; icon: any; trend: 'up' | 'down' };
  };
  recentActivity: Array<{
    platform: string;
    action: string;
    time: string;
    icon: any;
    color: string;
  }>;
  connectedPlatforms?: Array<{
    name: string;
    status: string;
    icon: any;
    color: string;
  }>;
  locationMetrics?: Array<{
    country: string;
    continent: string;
    mentions: number;
    comments: number;
    impressions: number;
    engagement: number;
  }>;
  platformHealth?: {
    uptime: string;
    activeCompanies: number;
    totalUsers: number;
  };
}

export default function UnifiedDashboard() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isCompanyAdmin } = useAuth();
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, isSuperAdmin, isCompanyAdmin]);

  const fetchDashboardData = async () => {
    try {
      if (isSuperAdmin) {
        await fetchAdminDashboard();
      } else {
        await fetchCompanyDashboard();
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminDashboard = async () => {
    const [
      { data: companies },
      { count: usersCount },
      { count: postsCount },
      { data: auditLogs }
    ] = await Promise.all([
      supabase.from('companies').select('*'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('social_media_posts').select('*', { count: 'exact', head: true }),
      supabase.from('audit_log_view').select('*').order('created_at', { ascending: false }).limit(6)
    ]);

    const pendingCompanies = companies?.filter(c => c.status === 'pending').length || 0;
    const approvedCompanies = companies?.filter(c => c.status === 'approved').length || 0;

    setDashboardData({
      userType: 'admin',
      metrics: {
        primary: { label: "Total Companies", title: "Total Companies", value: companies?.length.toString() || "0", change: "+32", icon: Building2, trend: "up" },
        secondary: { label: "Active Users", title: "Active Users", value: usersCount?.toLocaleString() || "0", change: "+1.2K", icon: Users, trend: "up" },
        tertiary: { label: "Total Posts", title: "Total Posts", value: postsCount?.toLocaleString() || "0", change: "+12%", icon: MessageSquare, trend: "up" },
        quaternary: { label: "System Health", title: "System Health", value: "99.9%", change: "Uptime", icon: Shield, trend: "up" }
      },
      recentActivity: auditLogs?.map(log => ({
        platform: log.table_name?.replace('_', ' ') || 'System',
        action: `${log.action} - ${log.user_name || 'User'}`,
        time: new Date(log.created_at).toLocaleString(),
        icon: Building2,
        color: "text-foreground"
      })) || [],
      platformHealth: {
        uptime: "99.9%",
        activeCompanies: approvedCompanies,
        totalUsers: usersCount || 0
      }
    });
  };

  const fetchCompanyDashboard = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, full_name')
      .eq('id', user?.id)
      .single();

    if (!profile?.company_id) {
      setLoading(false);
      return;
    }

    const [
      { data: company },
      { count: userCount },
      { data: posts, count: postCount },
      { count: scheduledCount },
      { data: campaigns }
    ] = await Promise.all([
      supabase.from('companies').select('name').eq('id', profile.company_id).single(),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id),
      supabase.from('social_media_posts').select('*', { count: 'exact' }).eq('company_id', profile.company_id),
      supabase.from('social_media_posts').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id).eq('status', 'scheduled'),
      supabase.from('ad_campaigns').select('*').eq('company_id', profile.company_id)
    ]);

    const totalFollowers = 45231;
    const avgEngagement = campaigns?.reduce((acc, c) => {
      const impressions = c.impressions || 0;
      const clicks = c.clicks || 0;
      return acc + (impressions > 0 ? (clicks / impressions) * 100 : 0);
    }, 0) / (campaigns?.length || 1) || 12.5;

    setDashboardData({
      userType: isCompanyAdmin ? 'company' : 'user',
      companyName: company?.name,
      metrics: {
        primary: { label: "Total Followers", title: "Total Followers", value: totalFollowers.toLocaleString(), change: "+20.1%", icon: Users, trend: "up" },
        secondary: { label: "Engagement Rate", title: "Engagement Rate", value: `${avgEngagement.toFixed(1)}%`, change: "+4.3%", icon: TrendingUp, trend: "up" },
        tertiary: { label: "Scheduled Posts", title: "Scheduled Posts", value: (scheduledCount || 0).toString(), change: "+2", icon: Calendar, trend: "up" },
        quaternary: { label: "Total Posts", title: "Total Posts", value: (postCount || 0).toLocaleString(), change: "+12%", icon: MessageSquare, trend: "up" }
      },
      recentActivity: []
    });
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

  const isAdmin = dashboardData?.userType === 'admin';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl p-12 shadow-elegant" 
           style={{ background: isAdmin ? 'var(--gradient-mesh)' : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}>
        <div className="absolute inset-0 animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, hsl(var(--primary-glow) / 0.3), transparent)', backgroundSize: '200% 100%' }} />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            {dashboardData?.companyName && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                <Building2 className="h-4 w-4 text-white" />
                <span className="text-white text-sm font-medium">{dashboardData.companyName}</span>
              </div>
            )}
            <h1 className="text-5xl font-bold tracking-tight text-white">
              {isAdmin ? "Command Center 👑" : "Welcome Back! 👋"}
            </h1>
            <p className="text-white/95 text-xl font-medium">
              {isAdmin 
                ? "Building empires together. Shape the future of social media."
                : "Your social media empire awaits. Let's create something amazing today."}
            </p>
          </div>
          <Button 
            onClick={() => navigate(isAdmin ? '/admin/companies' : '/composer')}
            size="lg"
            className="bg-white text-primary hover:bg-white/95 font-bold shadow-elegant hover:shadow-glow transition-all hover:scale-110 group"
          >
            {isAdmin ? <Building2 className="mr-2 h-5 w-5" /> : <MessageSquare className="mr-2 h-5 w-5" />}
            <span>{isAdmin ? "Manage Companies" : "Create Post"}</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard {...dashboardData!.metrics.primary} />
        <StatCard {...dashboardData!.metrics.secondary} />
        <StatCard {...dashboardData!.metrics.tertiary} />
        <StatCard {...dashboardData!.metrics.quaternary} />
      </div>

      {/* Quick Access Card */}
      {!isAdmin && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 hover:shadow-xl transition-all">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Track Your Performance</h3>
                <p className="text-sm text-muted-foreground">
                  View comprehensive analytics hub with social posts, ad campaigns, growth metrics, and AI insights
                </p>
              </div>
              <Button 
                onClick={() => navigate('/admin/reach-analytics')}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all"
              >
                Open Analytics Hub
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unified Growth Showcase */}
      <UnifiedGrowthShowcase userType={dashboardData!.userType} />

      {/* Admin Guide */}
      {isAdmin && (
        <Card className="border-2 hover:shadow-xl transition-all">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Platform Administration Guide
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowGuide(!showGuide)}>
                {showGuide ? 'Hide' : 'Show'} Guide
              </Button>
            </div>
          </CardHeader>
          {showGuide && (
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="companies">
                  <AccordionTrigger>Company Management</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">Oversee and manage all companies on the platform.</p>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                      <li>Approve or reject company applications</li>
                      <li>Monitor company performance metrics</li>
                      <li>Manage company subscriptions and access</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="users">
                  <AccordionTrigger>User Administration</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">Control user access and permissions across the platform.</p>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                      <li>Create and manage user accounts</li>
                      <li>Assign roles and permissions</li>
                      <li>Monitor user activity logs</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          )}
        </Card>
      )}

      {/* Personalized Content */}
      {!isAdmin && (
        <>
          <PersonalizedAds />
          <RecommendedContentFeed />
        </>
      )}

      {/* Service Grid (Non-Admin) */}
      {!isAdmin && (
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
      )}

      {/* AI Drawer */}
      <AIDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        service={selectedService}
      />
    </div>
  );
}
