import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, FileText, AlertCircle, CheckCircle, XCircle, BookOpen, ArrowRight, Search, TrendingUp, MessageSquare } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  pendingCompanies: number;
  approvedCompanies: number;
  rejectedCompanies: number;
  totalPosts: number;
  activeTrials: number;
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
      // Fetch companies stats
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*');

      if (companiesError) throw companiesError;

      const pendingCompanies = companies?.filter(c => c.status === 'pending').length || 0;
      const approvedCompanies = companies?.filter(c => c.status === 'approved').length || 0;
      const rejectedCompanies = companies?.filter(c => c.status === 'rejected').length || 0;

      // Fetch total users
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Fetch total posts
      const { count: postsCount, error: postsError } = await supabase
        .from('social_media_posts')
        .select('*', { count: 'exact', head: true });

      if (postsError) throw postsError;

      // Fetch active trials
      const { count: trialsCount, error: trialsError } = await supabase
        .from('subscription_requests')
        .select('*', { count: 'exact', head: true })
        .eq('is_trial', true)
        .eq('status', 'approved')
        .gt('trial_ends_at', new Date().toISOString());

      if (trialsError) throw trialsError;

      // Fetch company-wise stats
      const { data: profiles } = await supabase
        .from('profiles')
        .select('company_id');

      const { data: posts } = await supabase
        .from('social_media_posts')
        .select('company_id');

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

      setStats({
        totalUsers: usersCount || 0,
        totalCompanies: companies?.length || 0,
        pendingCompanies,
        approvedCompanies,
        rejectedCompanies,
        totalPosts: postsCount || 0,
        activeTrials: trialsCount || 0,
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
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyId);

      const { data: posts } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('company_id', companyId);

      const { data: campaigns } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('company_id', companyId);

      const { data: influencers } = await supabase
        .from('influencers')
        .select('*')
        .eq('company_id', companyId);

      const { data: auditLogs } = await supabase
        .from('audit_log_view')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Company-wise system overview and management
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowGuide(!showGuide)}>
          <BookOpen className="mr-2 h-4 w-4" />
          {showGuide ? 'Hide' : 'Show'} Guide
        </Button>
      </div>

      {showGuide && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Getting Started Guide
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={dismissGuide}>
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
            </Accordion>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Companies"
          value={stats.totalCompanies.toString()}
          change={`${stats.pendingCompanies} pending`}
          icon={Building2}
          trend="up"
        />
        <StatCard
          title="Approved Companies"
          value={stats.approvedCompanies.toString()}
          change={`${stats.rejectedCompanies} rejected`}
          icon={CheckCircle}
          trend="up"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toString()}
          change="Across all companies"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Total Posts"
          value={stats.totalPosts.toString()}
          change={`${stats.activeTrials} active trials`}
          icon={FileText}
          trend="up"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Companies by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="font-medium">Approved</span>
                </div>
                <span className="text-2xl font-bold">{stats.approvedCompanies}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <span className="font-medium">Pending</span>
                </div>
                <span className="text-2xl font-bold">{stats.pendingCompanies}</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium">Rejected</span>
                </div>
                <span className="text-2xl font-bold">{stats.rejectedCompanies}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Companies by Users</CardTitle>
              <Link to="/admin/companies">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companyStats.slice(0, 5).map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{company.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {company.userCount} users • {company.postCount} posts
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
        <Card>
          <CardHeader>
            <CardTitle>Select Company to View Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies by name, email, or industry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCompanyId || ""} onValueChange={handleCompanySelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
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
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedCompanyId === company.id ? 'border-primary bg-muted/50' : ''
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

        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{companyDetails.name}</h3>
                  <p className="text-sm text-muted-foreground">{companyDetails.email}</p>
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
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Users</span>
                    </div>
                    <p className="text-2xl font-bold">{companyDetails.userCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Posts</span>
                    </div>
                    <p className="text-2xl font-bold">{companyDetails.postCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Campaigns</span>
                    </div>
                    <p className="text-2xl font-bold">{companyDetails.campaignCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Influencers</span>
                    </div>
                    <p className="text-2xl font-bold">{companyDetails.influencerCount}</p>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Avg Engagement Rate</p>
                  <p className="text-xl font-bold">{companyDetails.avgEngagement.toFixed(2)}%</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/admin/companies">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Manage Companies
                {stats.pendingCompanies > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs">
                    {stats.pendingCompanies}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link to="/admin/subscriptions">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Platform Subscriptions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
