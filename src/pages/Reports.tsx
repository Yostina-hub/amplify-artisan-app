import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, DollarSign, Package, FileText, Target, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { PageHelp } from "@/components/PageHelp";

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: salesStats } = useQuery({
    queryKey: ["salesStats", dateRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      const [invoices, quotes, opportunities] = await Promise.all([
        supabase.from("invoices" as any).select("*").gte("created_at", daysAgo.toISOString()),
        supabase.from("quotes" as any).select("*").gte("created_at", daysAgo.toISOString()),
        supabase.from("opportunities").select("*").gte("created_at", daysAgo.toISOString()),
      ]);

      return {
        totalRevenue: invoices.data?.filter((i: any) => i.status === "paid").reduce((sum: number, i: any) => sum + i.total_amount, 0) || 0,
        totalInvoiced: invoices.data?.reduce((sum: number, i: any) => sum + i.total_amount, 0) || 0,
        totalQuoted: quotes.data?.reduce((sum: number, q: any) => sum + q.total_amount, 0) || 0,
        opportunitiesValue: opportunities.data?.reduce((sum: number, o: any) => sum + o.amount, 0) || 0,
        invoiceCount: invoices.data?.length || 0,
        quoteCount: quotes.data?.length || 0,
        opportunityCount: opportunities.data?.length || 0,
        paidInvoices: invoices.data?.filter((i: any) => i.status === "paid").length || 0,
        acceptedQuotes: quotes.data?.filter((q: any) => q.status === "accepted").length || 0,
      };
    },
    enabled: !!profile?.company_id,
  });

  const { data: crmStats } = useQuery({
    queryKey: ["crmStats", dateRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      const [contacts, accounts, leads, activities] = await Promise.all([
        supabase.from("contacts").select("*").gte("created_at", daysAgo.toISOString()),
        supabase.from("accounts").select("*").gte("created_at", daysAgo.toISOString()),
        supabase.from("leads").select("*").gte("created_at", daysAgo.toISOString()),
        supabase.from("activities" as any).select("*").gte("created_at", daysAgo.toISOString()),
      ]);

      return {
        newContacts: contacts.data?.length || 0,
        newAccounts: accounts.data?.length || 0,
        newLeads: leads.data?.length || 0,
        qualifiedLeads: leads.data?.filter((l: any) => l.status === "qualified").length || 0,
        convertedLeads: leads.data?.filter((l: any) => l.status === "converted").length || 0,
        activitiesCompleted: activities.data?.filter((a: any) => a.status === "completed").length || 0,
        totalActivities: activities.data?.length || 0,
        conversionRate: leads.data?.length ? ((leads.data?.filter((l: any) => l.status === "converted").length || 0) / leads.data.length * 100).toFixed(1) : 0,
      };
    },
    enabled: !!profile?.company_id,
  });

  const { data: inventoryStats } = useQuery({
    queryKey: ["inventoryStats"],
    queryFn: async () => {
      const { data: products } = await supabase.from("products").select("*");

      const totalValue = products?.reduce((sum, p) => sum + (p.unit_price * (p.quantity_in_stock || 0)), 0) || 0;
      const lowStock = products?.filter(p => 
        p.quantity_in_stock !== null && 
        p.reorder_level !== null && 
        p.quantity_in_stock <= p.reorder_level
      ).length || 0;

      return {
        totalProducts: products?.length || 0,
        activeProducts: products?.filter(p => p.is_active).length || 0,
        totalValue,
        lowStock,
        outOfStock: products?.filter(p => p.quantity_in_stock === 0).length || 0,
      };
    },
    enabled: !!profile?.company_id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHelp
        title="Reports & Analytics"
        description="Comprehensive business intelligence and reporting across sales, CRM, inventory, and activities. Make data-driven decisions with real-time insights."
        features={[
          "Sales performance reports (revenue, invoices, quotes)",
          "CRM metrics (contacts, leads, conversion rates)",
          "Inventory status and valuation reports",
          "Activity completion and productivity tracking",
          "Customizable date ranges for trend analysis",
          "Export capabilities for external analysis",
        ]}
        tips={[
          "Review reports regularly to identify trends and opportunities",
          "Compare different time periods to measure growth",
          "Track conversion rates to optimize sales processes",
          "Monitor inventory levels to prevent stockouts",
        ]}
      />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive insights into your business performance</p>
        </div>
        <div className="w-48">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salesStats?.totalRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {salesStats?.paidInvoices || 0} paid invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salesStats?.totalInvoiced || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {salesStats?.invoiceCount || 0} invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quoted</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salesStats?.totalQuoted || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {salesStats?.quoteCount || 0} quotes • {salesStats?.acceptedQuotes || 0} accepted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salesStats?.opportunitiesValue || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {salesStats?.opportunityCount || 0} opportunities
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
              <CardDescription>
                Revenue and conversion metrics for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">Quote-to-Invoice Conversion</p>
                    <p className="text-sm text-muted-foreground">Accepted quotes converted to invoices</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {salesStats?.acceptedQuotes && salesStats?.invoiceCount
                      ? ((salesStats.invoiceCount / salesStats.acceptedQuotes) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">Payment Collection Rate</p>
                    <p className="text-sm text-muted-foreground">Paid invoices vs total invoices</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {salesStats?.invoiceCount && salesStats?.paidInvoices
                      ? ((salesStats.paidInvoices / salesStats.invoiceCount) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Average Invoice Value</p>
                    <p className="text-sm text-muted-foreground">Per invoice</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {salesStats?.invoiceCount
                      ? formatCurrency((salesStats.totalInvoiced || 0) / salesStats.invoiceCount)
                      : formatCurrency(0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crm" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crmStats?.newContacts || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Added this period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Accounts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crmStats?.newAccounts || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Added this period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Leads</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crmStats?.newLeads || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {crmStats?.convertedLeads || 0} converted
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crmStats?.conversionRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">Lead to customer</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>CRM Activity Summary</CardTitle>
              <CardDescription>
                Key metrics for customer relationship management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">Lead Qualification Rate</p>
                    <p className="text-sm text-muted-foreground">Qualified leads vs total leads</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {crmStats?.newLeads && crmStats?.qualifiedLeads
                      ? ((crmStats.qualifiedLeads / crmStats.newLeads) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">Activity Completion Rate</p>
                    <p className="text-sm text-muted-foreground">Completed vs total activities</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {crmStats?.totalActivities && crmStats?.activitiesCompleted
                      ? ((crmStats.activitiesCompleted / crmStats.totalActivities) * 100).toFixed(1)
                      : 0}%
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Total Activities</p>
                    <p className="text-sm text-muted-foreground">Completed activities</p>
                  </div>
                  <div className="text-2xl font-bold">
                    {crmStats?.activitiesCompleted || 0} / {crmStats?.totalActivities || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventoryStats?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {inventoryStats?.activeProducts || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(inventoryStats?.totalValue || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total stock value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <Package className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{inventoryStats?.lowStock || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Below reorder level</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <Package className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{inventoryStats?.outOfStock || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Need immediate attention</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Insights</CardTitle>
              <CardDescription>
                Task completion and productivity metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">Completed Activities</p>
                    <p className="text-sm text-muted-foreground">
                      {crmStats?.activitiesCompleted || 0} out of {crmStats?.totalActivities || 0} total
                    </p>
                  </div>
                  <div className="text-2xl font-bold">
                    {crmStats?.totalActivities && crmStats?.activitiesCompleted
                      ? ((crmStats.activitiesCompleted / crmStats.totalActivities) * 100).toFixed(0)
                      : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
