import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Download, 
  Calendar,
  RefreshCw,
  Settings2,
  FileText,
  BarChart3,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  Shield,
  MessageSquare,
  PieChart,
  Activity,
  Zap,
  Target,
  Mail,
  PhoneCall,
  Building2,
  UserPlus,
  Briefcase,
  ClipboardList,
  Wallet,
  ArrowUpRight
} from "lucide-react";
import { PageHelp } from "@/components/PageHelp";
import { ReportCard } from "@/components/reports/ReportCard";
import { QuickReportGenerator } from "@/components/reports/QuickReportGenerator";
import { ReportInsights } from "@/components/reports/ReportInsights";
import { ReportStats } from "@/components/reports/ReportStats";
import { RecentReports } from "@/components/reports/RecentReports";
import { ReportCategories } from "@/components/reports/ReportCategories";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Comprehensive report definitions
const allReports = [
  // Sales Reports
  {
    id: "revenue-analysis",
    title: "Revenue Analysis",
    description: "Complete revenue breakdown with trends, forecasts, and growth patterns across all channels.",
    icon: <DollarSign className="h-5 w-5 text-primary" />,
    category: "sales",
    categoryLabel: "Sales",
    trend: "up" as const,
    trendValue: "+18.5%",
    isPopular: true,
    gradient: "bg-gradient-to-br from-green-500/10 to-emerald-500/5",
  },
  {
    id: "invoice-summary",
    title: "Invoice Summary",
    description: "Track all invoices including paid, pending, overdue with aging analysis and collection metrics.",
    icon: <FileText className="h-5 w-5 text-primary" />,
    category: "sales",
    categoryLabel: "Sales",
    trend: "up" as const,
    trendValue: "+12%",
    lastGenerated: "2 hours ago",
    gradient: "bg-gradient-to-br from-blue-500/10 to-cyan-500/5",
  },
  {
    id: "quote-conversion",
    title: "Quote Conversion",
    description: "Quote-to-invoice conversion rates, win/loss analysis, and deal velocity metrics.",
    icon: <ArrowUpRight className="h-5 w-5 text-primary" />,
    category: "sales",
    categoryLabel: "Sales",
    trend: "up" as const,
    trendValue: "+8.3%",
    gradient: "bg-gradient-to-br from-violet-500/10 to-purple-500/5",
  },
  {
    id: "payment-collection",
    title: "Payment Collection",
    description: "Payment collection efficiency, DSO metrics, and cash flow analysis.",
    icon: <Wallet className="h-5 w-5 text-primary" />,
    category: "sales",
    categoryLabel: "Sales",
    trend: "neutral" as const,
    gradient: "bg-gradient-to-br from-amber-500/10 to-orange-500/5",
  },
  {
    id: "pipeline-analysis",
    title: "Pipeline Analysis",
    description: "Sales pipeline health, stage conversion, and forecasted revenue by stage.",
    icon: <Target className="h-5 w-5 text-primary" />,
    category: "sales",
    categoryLabel: "Sales",
    isNew: true,
    trend: "up" as const,
    trendValue: "+23%",
    gradient: "bg-gradient-to-br from-pink-500/10 to-rose-500/5",
  },
  {
    id: "sales-performance",
    title: "Sales Performance",
    description: "Individual and team sales performance, quota attainment, and commission tracking.",
    icon: <TrendingUp className="h-5 w-5 text-primary" />,
    category: "sales",
    categoryLabel: "Sales",
    isPopular: true,
    trend: "up" as const,
    trendValue: "+15%",
    gradient: "bg-gradient-to-br from-green-500/10 to-teal-500/5",
  },
  // CRM Reports
  {
    id: "contact-growth",
    title: "Contact Growth",
    description: "New contacts added, source attribution, and engagement scoring trends.",
    icon: <Users className="h-5 w-5 text-primary" />,
    category: "crm",
    categoryLabel: "CRM",
    trend: "up" as const,
    trendValue: "+45 this week",
    gradient: "bg-gradient-to-br from-blue-500/10 to-indigo-500/5",
  },
  {
    id: "lead-conversion",
    title: "Lead Conversion",
    description: "Lead qualification rates, conversion funnels, and time-to-conversion analysis.",
    icon: <UserPlus className="h-5 w-5 text-primary" />,
    category: "crm",
    categoryLabel: "CRM",
    isPopular: true,
    trend: "up" as const,
    trendValue: "+22%",
    gradient: "bg-gradient-to-br from-green-500/10 to-emerald-500/5",
  },
  {
    id: "account-health",
    title: "Account Health",
    description: "Account engagement scores, risk indicators, and expansion opportunities.",
    icon: <Building2 className="h-5 w-5 text-primary" />,
    category: "crm",
    categoryLabel: "CRM",
    trend: "neutral" as const,
    gradient: "bg-gradient-to-br from-slate-500/10 to-gray-500/5",
  },
  {
    id: "activity-summary",
    title: "Activity Summary",
    description: "Tasks, calls, emails, and meetings logged with completion rates and follow-up tracking.",
    icon: <ClipboardList className="h-5 w-5 text-primary" />,
    category: "crm",
    categoryLabel: "CRM",
    trend: "up" as const,
    trendValue: "+156 tasks",
    lastGenerated: "1 hour ago",
    gradient: "bg-gradient-to-br from-purple-500/10 to-violet-500/5",
  },
  {
    id: "customer-lifetime",
    title: "Customer Lifetime Value",
    description: "CLV analysis, customer segmentation by value, and retention cohorts.",
    icon: <Briefcase className="h-5 w-5 text-primary" />,
    category: "crm",
    categoryLabel: "CRM",
    isNew: true,
    trend: "up" as const,
    trendValue: "+$12.4K avg",
    gradient: "bg-gradient-to-br from-amber-500/10 to-yellow-500/5",
  },
  // Inventory Reports
  {
    id: "inventory-status",
    title: "Inventory Status",
    description: "Current stock levels, reorder alerts, and warehouse distribution overview.",
    icon: <Package className="h-5 w-5 text-primary" />,
    category: "inventory",
    categoryLabel: "Inventory",
    trend: "down" as const,
    trendValue: "5 low stock",
    gradient: "bg-gradient-to-br from-orange-500/10 to-amber-500/5",
  },
  {
    id: "inventory-valuation",
    title: "Inventory Valuation",
    description: "Total inventory value, cost analysis, and margin calculations by product category.",
    icon: <DollarSign className="h-5 w-5 text-primary" />,
    category: "inventory",
    categoryLabel: "Inventory",
    isPopular: true,
    trend: "up" as const,
    trendValue: "$2.4M total",
    gradient: "bg-gradient-to-br from-green-500/10 to-lime-500/5",
  },
  {
    id: "product-movement",
    title: "Product Movement",
    description: "Fast/slow moving products, turnover rates, and demand forecasting.",
    icon: <Activity className="h-5 w-5 text-primary" />,
    category: "inventory",
    categoryLabel: "Inventory",
    trend: "up" as const,
    trendValue: "+8% velocity",
    gradient: "bg-gradient-to-br from-cyan-500/10 to-teal-500/5",
  },
  {
    id: "stock-aging",
    title: "Stock Aging",
    description: "Inventory aging analysis, dead stock identification, and write-off recommendations.",
    icon: <Clock className="h-5 w-5 text-primary" />,
    category: "inventory",
    categoryLabel: "Inventory",
    trend: "neutral" as const,
    gradient: "bg-gradient-to-br from-red-500/10 to-rose-500/5",
  },
  // Analytics Reports
  {
    id: "performance-dashboard",
    title: "Performance Dashboard",
    description: "KPI overview across all business metrics with trend analysis and benchmarks.",
    icon: <BarChart3 className="h-5 w-5 text-primary" />,
    category: "analytics",
    categoryLabel: "Analytics",
    isPopular: true,
    trend: "up" as const,
    trendValue: "+12% MoM",
    gradient: "bg-gradient-to-br from-indigo-500/10 to-purple-500/5",
  },
  {
    id: "trend-analysis",
    title: "Trend Analysis",
    description: "Historical trend patterns, seasonality detection, and predictive forecasts.",
    icon: <TrendingUp className="h-5 w-5 text-primary" />,
    category: "analytics",
    categoryLabel: "Analytics",
    isNew: true,
    trend: "up" as const,
    trendValue: "AI-Powered",
    gradient: "bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5",
  },
  {
    id: "comparative-analysis",
    title: "Comparative Analysis",
    description: "Period-over-period comparisons, YoY growth, and benchmark analysis.",
    icon: <PieChart className="h-5 w-5 text-primary" />,
    category: "analytics",
    categoryLabel: "Analytics",
    trend: "up" as const,
    trendValue: "+28% YoY",
    gradient: "bg-gradient-to-br from-blue-500/10 to-sky-500/5",
  },
  {
    id: "funnel-analysis",
    title: "Funnel Analysis",
    description: "Complete funnel visualization from lead to close with drop-off analysis.",
    icon: <Target className="h-5 w-5 text-primary" />,
    category: "analytics",
    categoryLabel: "Analytics",
    trend: "up" as const,
    trendValue: "+5% conversion",
    gradient: "bg-gradient-to-br from-green-500/10 to-emerald-500/5",
  },
  // Social Reports
  {
    id: "social-engagement",
    title: "Social Engagement",
    description: "Cross-platform engagement metrics, reach, impressions, and content performance.",
    icon: <MessageSquare className="h-5 w-5 text-primary" />,
    category: "social",
    categoryLabel: "Social",
    isPopular: true,
    trend: "up" as const,
    trendValue: "+34% reach",
    gradient: "bg-gradient-to-br from-pink-500/10 to-rose-500/5",
  },
  {
    id: "audience-growth",
    title: "Audience Growth",
    description: "Follower growth trends, demographics, and audience quality scores.",
    icon: <Users className="h-5 w-5 text-primary" />,
    category: "social",
    categoryLabel: "Social",
    trend: "up" as const,
    trendValue: "+1.2K followers",
    gradient: "bg-gradient-to-br from-blue-500/10 to-indigo-500/5",
  },
  {
    id: "content-performance",
    title: "Content Performance",
    description: "Top performing content, optimal posting times, and content type analysis.",
    icon: <Zap className="h-5 w-5 text-primary" />,
    category: "social",
    categoryLabel: "Social",
    isNew: true,
    trend: "up" as const,
    trendValue: "+56% engagement",
    gradient: "bg-gradient-to-br from-amber-500/10 to-orange-500/5",
  },
  // Security Reports
  {
    id: "security-overview",
    title: "Security Overview",
    description: "Security posture summary, threat detections, and compliance status.",
    icon: <Shield className="h-5 w-5 text-primary" />,
    category: "security",
    categoryLabel: "Security",
    trend: "neutral" as const,
    lastGenerated: "3 hours ago",
    gradient: "bg-gradient-to-br from-red-500/10 to-rose-500/5",
  },
  {
    id: "audit-log",
    title: "Audit Log Report",
    description: "User activity audit trail, access logs, and security event timeline.",
    icon: <ClipboardList className="h-5 w-5 text-primary" />,
    category: "security",
    categoryLabel: "Security",
    trend: "neutral" as const,
    gradient: "bg-gradient-to-br from-slate-500/10 to-gray-500/5",
  },
];

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateRange, setDateRange] = useState("30");

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const filteredReports = allReports.filter((report) => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleGenerateReport = async (reportId: string) => {
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Page Help */}
        <PageHelp
          title="Reports Hub"
          description="Your central hub for generating, scheduling, and analyzing business reports. Access instant insights with one-click report generation powered by AI."
          features={[
            "One-click instant report generation across all modules",
            "AI-powered insights and recommendations",
            "20+ pre-built report templates (Sales, CRM, Inventory, Analytics)",
            "Real-time data with trend indicators",
            "Export to PDF, Excel, CSV, and JSON formats",
            "Scheduled report automation with email delivery",
            "Interactive previews and drill-down capabilities",
          ]}
          tips={[
            "Use Quick Reports for instant executive summaries",
            "Check AI Insights for anomaly detection and opportunities",
            "Schedule recurring reports for automated delivery",
            "Combine multiple report types for comprehensive analysis",
          ]}
        />

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Reports Hub</h1>
                <p className="text-muted-foreground mt-0.5">
                  Generate powerful insights with one click
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <ReportStats />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions & Insights */}
          <div className="space-y-6">
            <QuickReportGenerator />
            <ReportInsights />
          </div>

          {/* Right Column - Report Library */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categories */}
            <ReportCategories 
              selectedCategory={selectedCategory} 
              onCategoryChange={setSelectedCategory} 
            />

            {/* Reports Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  id={report.id}
                  title={report.title}
                  description={report.description}
                  icon={report.icon}
                  category={report.categoryLabel}
                  trend={report.trend}
                  trendValue={report.trendValue}
                  lastGenerated={report.lastGenerated}
                  isPopular={report.isPopular}
                  isNew={report.isNew}
                  onGenerate={() => handleGenerateReport(report.id)}
                  gradient={report.gradient}
                />
              ))}
            </div>

            {filteredReports.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No reports found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Reports Section */}
        <RecentReports />
      </div>
    </div>
  );
}
