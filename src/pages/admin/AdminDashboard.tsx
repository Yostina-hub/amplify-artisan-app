import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, FileText, AlertCircle, CheckCircle, XCircle, BookOpen, ArrowRight, Search, TrendingUp, MessageSquare, Sparkles, Crown, Target, Globe } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedSocialShowcase } from "@/components/AnimatedSocialShowcase";
import { AdminGrowthShowcase } from "@/components/AdminGrowthShowcase";

interface LocationMetric {
  country: string;
  continent: string;
  mentions: number;
  comments: number;
  impressions: number;
  totalEngagement: number;
}

interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  pendingCompanies: number;
  approvedCompanies: number;
  rejectedCompanies: number;
  totalPosts: number;
  activeTrials: number;
  locationMetrics: LocationMetric[];
}

interface CompanyStats {
  id: string;
  name: string;
  userCount: number;
  postCount: number;
  status: string;
  created_at: string;
  email: string;
  industry: string;
}

interface CompanyDetails {
  id: string;
  name: string;
  email: string;
  status: string;
  industry: string;
  userCount: number;
  postCount: number;
  campaignCount: number;
  influencerCount: number;
  avgEngagement: number;
  recentActivity: {
    user: string;
    action: string;
    time: string;
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCompanies: 0,
    pendingCompanies: 0,
    approvedCompanies: 0,
    rejectedCompanies: 0,
    totalPosts: 0,
    activeTrials: 0,
    locationMetrics: [],
  });
  const [companyStats, setCompanyStats] = useState<CompanyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Check if user is new (show guide on first visit)
    const hasSeenGuide = localStorage.getItem('admin-guide-seen');
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch ALL data in parallel for instant loading
      const [
        { data: companies },
        { count: usersCount },
        { count: postsCount },
        { count: trialsCount },
        { data: profiles },
        { data: posts },
        { data: allMentions },
        { data: allComments },
        { data: allImpressions }
      ] = await Promise.all([
        supabase.from('companies').select('*'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('social_media_posts').select('*', { count: 'exact', head: true }),
        supabase.from('subscription_requests').select('*', { count: 'exact', head: true }).eq('is_trial', true).eq('status', 'approved').gt('trial_ends_at', new Date().toISOString()),
        supabase.from('profiles').select('company_id'),
        supabase.from('social_media_posts').select('company_id'),
        supabase.from('social_media_mentions').select('country, continent'),
        supabase.from('social_media_comments').select('country, continent'),
        supabase.from('ad_impressions').select('country, continent')
      ]);

      const pendingCompanies = companies?.filter(c => c.status === 'pending').length || 0;
      const approvedCompanies = companies?.filter(c => c.status === 'approved').length || 0;
      const rejectedCompanies = companies?.filter(c => c.status === 'rejected').length || 0;

      const companyStatsMap = new Map<string, CompanyStats>();
      
      companies?.forEach(company => {
        const userCount = profiles?.filter(p => p.company_id === company.id).length || 0;
        const postCount = posts?.filter(p => p.company_id === company.id).length || 0;
        
        companyStatsMap.set(company.id, {
          id: company.id,
          name: company.name,
          userCount,
          postCount,
          status: company.status,
          created_at: company.created_at,
          email: company.email,
          industry: company.industry || 'N/A',
        });
      });

      // Calculate global location metrics
      const locationMap = new Map<string, LocationMetric>();
      
      allMentions?.forEach(m => {
        if (m.country && m.continent) {
          const key = `${m.country}-${m.continent}`;
          const existing = locationMap.get(key) || { country: m.country, continent: m.continent, mentions: 0, comments: 0, impressions: 0, totalEngagement: 0 };
          existing.mentions++;
          locationMap.set(key, existing);
        }
      });

      allComments?.forEach(c => {
        if (c.country && c.continent) {
          const key = `${c.country}-${c.continent}`;
          const existing = locationMap.get(key) || { country: c.country, continent: c.continent, mentions: 0, comments: 0, impressions: 0, totalEngagement: 0 };
          existing.comments++;
          locationMap.set(key, existing);
        }
      });

      allImpressions?.forEach(i => {
        if (i.country && i.continent) {
          const key = `${i.country}-${i.continent}`;
          const existing = locationMap.get(key) || { country: i.country, continent: i.continent, mentions: 0, comments: 0, impressions: 0, totalEngagement: 0 };
          existing.impressions++;
          locationMap.set(key, existing);
        }
      });

      const locationMetrics = Array.from(locationMap.values())
        .map(metric => ({
          ...metric,
          totalEngagement: metric.mentions + metric.comments + metric.impressions
        }))
        .sort((a, b) => b.totalEngagement - a.totalEngagement);

      // Add demo data for demonstration if no real data exists
      const finalLocationMetrics = locationMetrics.length > 0 ? locationMetrics : [
        { country: "United States", continent: "North America", mentions: 1245, comments: 989, impressions: 6523, totalEngagement: 8757 },
        { country: "United Kingdom", continent: "Europe", mentions: 878, comments: 645, impressions: 3892, totalEngagement: 5415 },
        { country: "Canada", continent: "North America", mentions: 634, comments: 498, impressions: 2675, totalEngagement: 3807 },
        { country: "Australia", continent: "Oceania", mentions: 498, comments: 376, impressions: 1843, totalEngagement: 2717 },
        { country: "Germany", continent: "Europe", mentions: 487, comments: 362, impressions: 1956, totalEngagement: 2805 },
        { country: "France", continent: "Europe", mentions: 365, comments: 248, impressions: 1389, totalEngagement: 2002 },
        { country: "India", continent: "Asia", mentions: 298, comments: 189, impressions: 1156, totalEngagement: 1643 },
        { country: "Brazil", continent: "South America", mentions: 234, comments: 167, impressions: 892, totalEngagement: 1293 },
      ];

      setStats({
        totalUsers: usersCount || 0,
        totalCompanies: companies?.length || 0,
        pendingCompanies,
        approvedCompanies,
        rejectedCompanies,
        totalPosts: postsCount || 0,
        activeTrials: trialsCount || 0,
        locationMetrics: finalLocationMetrics,
      });

      setCompanyStats(Array.from(companyStatsMap.values()).sort((a, b) => b.userCount - a.userCount));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem('admin-guide-seen', 'true');
  };

  const fetchCompanyDetails = async (companyId: string) => {
    setLoadingDetails(true);
    try {
      // Fetch all company details in parallel
      const [
        { data: company },
        { data: users },
        { data: posts },
        { data: campaigns },
        { data: influencers },
        { data: auditLogs }
      ] = await Promise.all([
        supabase.from('companies').select('*').eq('id', companyId).single(),
        supabase.from('profiles').select('*').eq('company_id', companyId),
        supabase.from('social_media_posts').select('*').eq('company_id', companyId),
        supabase.from('ad_campaigns').select('*').eq('company_id', companyId),
        supabase.from('influencers').select('*').eq('company_id', companyId),
        supabase.from('audit_log_view').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(5)
      ]);

      const avgEngagement = campaigns?.reduce((acc, c) => {
        const impressions = c.impressions || 0;
        const clicks = c.clicks || 0;
        return acc + (impressions > 0 ? (clicks / impressions) * 100 : 0);
      }, 0) / (campaigns?.length || 1);

      const recentActivity = auditLogs?.map(log => ({
        user: log.user_email || 'Unknown',
        action: `${log.action} ${log.table_name}`,
        time: new Date(log.created_at).toLocaleString(),
      })) || [];

      setCompanyDetails({
        id: company.id,
        name: company.name,
        email: company.email,
        status: company.status,
        industry: company.industry || 'N/A',
        userCount: users?.length || 0,
        postCount: posts?.length || 0,
        campaignCount: campaigns?.length || 0,
        influencerCount: influencers?.length || 0,
        avgEngagement: avgEngagement || 0,
        recentActivity,
      });
    } catch (error) {
      console.error('Error fetching company details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    fetchCompanyDetails(companyId);
  };

  const filteredCompanies = companyStats.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show dashboard immediately, no loading screen

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-glow to-accent p-12 shadow-2xl animate-fade-in">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,hsl(6_78%_57%_/_0.4),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,hsl(184_91%_30%_/_0.3),transparent_50%)]" />
        <div className="absolute top-10 right-10 opacity-20 animate-pulse">
          <Crown className="h-32 w-32 text-white" />
        </div>
        <div className="absolute bottom-10 left-10 opacity-10" style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) 1s infinite' }}>
          <Sparkles className="h-24 w-24 text-white" />
        </div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-4 max-w-2xl animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full transition-all hover:bg-white/20 hover:scale-105">
              <Target className="h-4 w-4 text-white" />
              <span className="text-white text-sm font-medium">Master Control Center</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-white">
              Building Empires Together 🚀
            </h1>
            <p className="text-white/90 text-xl">
              Command your digital kingdom. Empower companies. Shape the future of social media management.
            </p>
            <div className="flex gap-3">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg transition-all hover:bg-white/20 hover:scale-105 cursor-pointer">
                <div className="text-white/80 text-xs">Total Companies</div>
                <div className="text-white text-2xl font-bold">{stats.totalCompanies}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg transition-all hover:bg-white/20 hover:scale-105 cursor-pointer">
                <div className="text-white/80 text-xs">Active Users</div>
                <div className="text-white text-2xl font-bold">{stats.totalUsers}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg transition-all hover:bg-white/20 hover:scale-105 cursor-pointer">
                <div className="text-white/80 text-xs">Total Posts</div>
                <div className="text-white text-2xl font-bold">{stats.totalPosts}</div>
              </div>
            </div>
          </div>
          <Button 
            variant="outline"
            onClick={() => setShowGuide(!showGuide)}
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 animate-scale-in"
            style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            {showGuide ? 'Hide' : 'Show'} Guide
          </Button>
        </div>
      </div>

      {showGuide && (
        <Card className="border-primary shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Getting Started Guide
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={dismissGuide} className="hover:bg-destructive/10">
                Dismiss
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>1. Managing Companies</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p>Review and approve company applications from the Company Management page.</p>
                  <Link to="/admin/companies">
                    <Button variant="link" className="p-0 h-auto">
                      Go to Company Management <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>2. Managing Users</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p>Create users, assign roles, and manage access permissions.</p>
                  <Link to="/admin/users">
                    <Button variant="link" className="p-0 h-auto">
                      Go to User Management <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>3. Platform Subscriptions</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p>Review and approve company requests to subscribe to social media platforms.</p>
                  <Link to="/admin/subscriptions">
                    <Button variant="link" className="p-0 h-auto">
                      Go to Subscriptions <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>4. Content Moderation</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p>Monitor and moderate content across all companies to ensure quality standards.</p>
                  <Link to="/admin/content-moderation">
                    <Button variant="link" className="p-0 h-auto">
                      Go to Content Moderation <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>5. API Integration Management</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <p>Manage all API integrations through a graphical interface. Create, configure, and monitor any type of integration with dynamic field management.</p>
                  <Link to="/admin/api-management">
                    <Button variant="link" className="p-0 h-auto">
                      Go to API Management <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
        <div className="animate-scale-in" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
          <StatCard
            title="Total Companies"
            value={stats.totalCompanies.toString()}
            change={`${stats.pendingCompanies} pending`}
            icon={Building2}
            trend="up"
          />
        </div>
        <div className="animate-scale-in" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
          <StatCard
            title="Approved Companies"
            value={stats.approvedCompanies.toString()}
            change={`${stats.rejectedCompanies} rejected`}
            icon={CheckCircle}
            trend="up"
          />
        </div>
        <div className="animate-scale-in" style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toString()}
            change="Across all companies"
            icon={Users}
            trend="up"
          />
        </div>
        <div className="animate-scale-in" style={{ animationDelay: '0.6s', animationFillMode: 'backwards' }}>
          <StatCard
            title="Total Posts"
            value={stats.totalPosts.toString()}
            change={`${stats.activeTrials} active trials`}
            icon={FileText}
            trend="up"
          />
        </div>
      </div>

      {/* Global Location Analytics */}
      {stats.locationMetrics.length > 0 && (
        <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Global Geographic Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.locationMetrics.slice(0, 8).map((location, idx) => (
                <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-all bg-gradient-to-br from-background to-muted/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg">{location.country}</p>
                      <p className="text-xs text-muted-foreground">{location.continent}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {location.totalEngagement}
                      </p>
                      <p className="text-xs text-muted-foreground">total</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-primary/5 rounded">
                      <p className="text-muted-foreground">Mentions</p>
                      <p className="font-bold text-primary">{location.mentions}</p>
                    </div>
                    <div className="text-center p-2 bg-accent/5 rounded">
                      <p className="text-muted-foreground">Comments</p>
                      <p className="font-bold text-accent">{location.comments}</p>
                    </div>
                    <div className="text-center p-2 bg-success/5 rounded">
                      <p className="text-muted-foreground">Clicks</p>
                      <p className="font-bold text-success">{location.impressions}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:border-primary/20">
          <CardHeader>
            <CardTitle>Companies by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-success/5 transition-colors duration-300 group">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Approved</span>
                </div>
                <span className="text-2xl font-bold animate-in zoom-in-50 duration-300">{stats.approvedCompanies}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-warning/5 transition-colors duration-300 group">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Pending</span>
                </div>
                <span className="text-2xl font-bold animate-in zoom-in-50 duration-300 delay-100">{stats.pendingCompanies}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-destructive/5 transition-colors duration-300 group">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Rejected</span>
                </div>
                <span className="text-2xl font-bold animate-in zoom-in-50 duration-300 delay-200">{stats.rejectedCompanies}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:border-accent/20 animate-in fade-in-50 slide-in-from-right-4 duration-500 delay-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Companies by Users</CardTitle>
              <Link to="/admin/companies">
                <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companyStats.slice(0, 5).map((company, idx) => (
                <div 
                  key={company.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-300 hover:shadow-md group cursor-pointer animate-in fade-in-50 duration-300"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">{company.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {company.userCount} users • {company.postCount} posts
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full transition-all duration-300 group-hover:scale-110 ${
                    company.status === 'approved' ? 'bg-success/10 text-success' :
                    company.status === 'pending' ? 'bg-warning/10 text-warning' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {company.status}
                  </span>
                </div>
              ))}
              {companyStats.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No companies yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:border-primary/20 animate-in fade-in-50 slide-in-from-left-4 duration-500 delay-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Select Company to View Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative animate-in fade-in-50 duration-300">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-pulse" />
              <Input
                placeholder="Search companies by name, email, or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 transition-all duration-300 focus:scale-[1.02]"
              />
            </div>
            
            <Select value={selectedCompanyId || ""} onValueChange={handleCompanySelect}>
              <SelectTrigger className="transition-all duration-300 hover:border-primary">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {filteredCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{company.name}</span>
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                        company.status === 'approved' ? 'bg-success/10 text-success' :
                        company.status === 'pending' ? 'bg-warning/10 text-warning' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {company.status}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {filteredCompanies.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No companies found
              </div>
            )}

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredCompanies.slice(0, 10).map((company) => (
              <div
                  key={company.id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${
                    selectedCompanyId === company.id ? 'border-primary bg-gradient-to-r from-primary/10 to-accent/10 shadow-lg scale-[1.02]' : ''
                  }`}
                  onClick={() => handleCompanySelect(company.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{company.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {company.industry} • {company.userCount} users
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      company.status === 'approved' ? 'bg-success/10 text-success' :
                      company.status === 'pending' ? 'bg-warning/10 text-warning' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {company.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:border-accent/20 animate-in fade-in-50 slide-in-from-right-4 duration-500 delay-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCompanyId && (
              <div className="text-center text-muted-foreground py-12">
                Select a company to view details
              </div>
            )}
            
            {loadingDetails && (
              <div className="text-center text-muted-foreground py-12">
                Loading company details...
              </div>
            )}

            {companyDetails && !loadingDetails && (
              <div className="space-y-4 animate-in fade-in-50 scale-in duration-500">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg animate-in slide-in-from-left-4 duration-300">{companyDetails.name}</h3>
                  <p className="text-sm text-muted-foreground animate-in slide-in-from-left-4 duration-300 delay-100">{companyDetails.email}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      companyDetails.status === 'approved' ? 'bg-success/10 text-success' :
                      companyDetails.status === 'pending' ? 'bg-warning/10 text-warning' :
                      'bg-destructive/10 text-destructive'
                    }`}>
                      {companyDetails.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{companyDetails.industry}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg hover:bg-gradient-to-br hover:from-primary/5 hover:to-accent/5 transition-all duration-300 hover:shadow-md hover:scale-105 group animate-in zoom-in-50 duration-300 delay-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-muted-foreground">Users</span>
                    </div>
                    <p className="text-2xl font-bold">{companyDetails.userCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gradient-to-br hover:from-primary/5 hover:to-accent/5 transition-all duration-300 hover:shadow-md hover:scale-105 group animate-in zoom-in-50 duration-300 delay-300">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-muted-foreground">Posts</span>
                    </div>
                    <p className="text-2xl font-bold">{companyDetails.postCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gradient-to-br hover:from-primary/5 hover:to-accent/5 transition-all duration-300 hover:shadow-md hover:scale-105 group animate-in zoom-in-50 duration-300 delay-[400ms]">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-muted-foreground">Campaigns</span>
                    </div>
                    <p className="text-2xl font-bold">{companyDetails.campaignCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg hover:bg-gradient-to-br hover:from-primary/5 hover:to-accent/5 transition-all duration-300 hover:shadow-md hover:scale-105 group animate-in zoom-in-50 duration-300 delay-500">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-accent group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-muted-foreground">Influencers</span>
                    </div>
                    <p className="text-2xl font-bold">{companyDetails.influencerCount}</p>
                  </div>
                </div>

                <div className="p-3 border rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in zoom-in-50 duration-300 delay-700">
                  <p className="text-xs text-muted-foreground mb-1">Avg Engagement Rate</p>
                  <p className="text-xl font-bold text-primary">{companyDetails.avgEngagement.toFixed(2)}%</p>
                </div>

                {companyDetails.recentActivity.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Recent Activity</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {companyDetails.recentActivity.map((activity, i) => (
                        <div key={i} className="p-2 border rounded text-xs">
                          <p className="font-medium">{activity.user}</p>
                          <p className="text-muted-foreground">{activity.action}</p>
                          <p className="text-muted-foreground">{activity.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Growth Showcase */}
      <AdminGrowthShowcase />

      {/* Animated Social Media Showcase */}
      <AnimatedSocialShowcase />

      <Card className="border-2 hover:shadow-xl transition-all duration-300 hover:border-primary/20 animate-in fade-in-50 slide-in-from-bottom-4 duration-500 delay-[1000ms]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/admin/companies" className="hover-scale">
              <Button variant="outline" className="w-full justify-start hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-300 group">
                <Building2 className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                Manage Companies
                {stats.pendingCompanies > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs animate-pulse">
                    {stats.pendingCompanies}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/admin/users" className="hover-scale">
              <Button variant="outline" className="w-full justify-start hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-300 group">
                <Users className="mr-2 h-4 w-4 group-hover:text-accent transition-colors" />
                Manage Users
              </Button>
            </Link>
            <Link to="/admin/subscriptions" className="hover-scale">
              <Button variant="outline" className="w-full justify-start hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-300 group">
                <FileText className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                Platform Subscriptions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
