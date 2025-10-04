import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, CreditCard, Users, Calendar } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type TimeRange = "today" | "week" | "month" | "all";

const PaymentManagement = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "week":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: new Date(0), end: now };
    }
  };

  const { data: paymentStats, isLoading } = useQuery({
    queryKey: ['payment-stats', timeRange],
    queryFn: async () => {
      const { start, end } = getDateRange();
      
      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          subscription_request:subscription_requests(
            full_name,
            email,
            pricing_plan:pricing_plans(name, price)
          )
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalRevenue = transactions?.reduce((sum, t) => 
        sum + (t.status === 'verified' ? Number(t.amount) : 0), 0) || 0;
      
      const pendingAmount = transactions?.reduce((sum, t) => 
        sum + (t.status === 'pending' ? Number(t.amount) : 0), 0) || 0;

      const verifiedCount = transactions?.filter(t => t.status === 'verified').length || 0;
      const pendingCount = transactions?.filter(t => t.status === 'pending').length || 0;

      return {
        transactions: transactions || [],
        totalRevenue,
        pendingAmount,
        verifiedCount,
        pendingCount,
        totalTransactions: transactions?.length || 0,
      };
    },
  });

  const { data: dailyStats } = useQuery({
    queryKey: ['daily-payment-stats', timeRange],
    queryFn: async () => {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('created_at, amount, status')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('status', 'verified')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const grouped = data?.reduce((acc: any, transaction) => {
        const date = format(new Date(transaction.created_at), 'MMM dd');
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, count: 0 };
        }
        acc[date].revenue += Number(transaction.amount);
        acc[date].count += 1;
        return acc;
      }, {});

      return Object.values(grouped || {});
    },
  });

  const { data: subscriptionStats } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_requests')
        .select(`
          status,
          pricing_plan:pricing_plans(name)
        `);

      if (error) throw error;

      const statusCounts = data?.reduce((acc: any, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {});

      return {
        active: statusCounts?.active || 0,
        pending: statusCounts?.pending || 0,
        approved: statusCounts?.approved || 0,
        rejected: statusCounts?.rejected || 0,
        total: data?.length || 0,
      };
    },
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      verified: { variant: "default", label: "Verified" },
      pending: { variant: "secondary", label: "Pending" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const { variant, label } = config[status] || config.pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor payment transactions and revenue analytics
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ETB {paymentStats?.totalRevenue.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paymentStats?.verifiedCount || 0} verified payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ETB {paymentStats?.pendingAmount.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paymentStats?.pendingCount || 0} pending transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentStats?.totalTransactions || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All payment records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subscriptionStats?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {subscriptionStats?.pending || 0} pending approval
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Count</CardTitle>
                <CardDescription>Number of transactions per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>All payment transactions in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentStats?.transactions.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm">
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {transaction.subscription_request?.full_name || 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.subscription_request?.email || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction.subscription_request?.pricing_plan?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                        <TableCell className="font-medium">
                          ETB {Number(transaction.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-sm font-mono">
                          {transaction.transaction_reference || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Analytics</CardTitle>
              <CardDescription>Overview of subscription requests and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                  <p className="text-3xl font-bold">{subscriptionStats?.total || 0}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-3xl font-bold text-green-600">{subscriptionStats?.active || 0}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{subscriptionStats?.pending || 0}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">{subscriptionStats?.rejected || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentManagement;
