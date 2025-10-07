import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, Users, AlertCircle, Calendar, Repeat } from "lucide-react";

const RecurringRevenue = () => {
  const mrrData = [
    { month: "Jul", mrr: 145000, newMrr: 25000, churnedMrr: 8000, expansion: 12000 },
    { month: "Aug", mrr: 168000, newMrr: 32000, churnedMrr: 9000, expansion: 15000 },
    { month: "Sep", mrr: 189000, newMrr: 28000, churnedMrr: 7000, expansion: 18000 },
    { month: "Oct", mrr: 215000, newMrr: 35000, churnedMrr: 9000, expansion: 22000 },
    { month: "Nov", mrr: 242000, newMrr: 38000, churnedMrr: 11000, expansion: 25000 },
    { month: "Dec", mrr: 278000, newMrr: 45000, churnedMrr: 9000, expansion: 28000 }
  ];

  const subscriptionBreakdown = [
    { tier: "Enterprise", subscribers: 45, mrr: 112500, avgValue: 2500, churnRate: 2.1 },
    { tier: "Professional", subscribers: 180, mrr: 108000, avgValue: 600, churnRate: 4.5 },
    { tier: "Starter", subscribers: 420, mrr: 42000, avgValue: 100, churnRate: 8.2 }
  ];

  const cohortAnalysis = [
    { cohort: "Jan 2024", month0: 100, month1: 94, month2: 89, month3: 85, month4: 82, month5: 79, month6: 76 },
    { cohort: "Feb 2024", month0: 100, month1: 96, month2: 92, month3: 88, month4: 85, month5: 82, month6: 0 },
    { cohort: "Mar 2024", month0: 100, month1: 95, month2: 91, month3: 87, month4: 84, month5: 0, month6: 0 }
  ];

  const upcomingRenewals = [
    { customer: "Acme Corp", mrr: 5000, renewalDate: "2025-01-15", health: "green", probability: 95 },
    { customer: "TechStart Inc", mrr: 1200, renewalDate: "2025-01-18", health: "yellow", probability: 70 },
    { customer: "Global Solutions", mrr: 8500, renewalDate: "2025-01-22", health: "green", probability: 98 },
    { customer: "Local Business", mrr: 300, renewalDate: "2025-01-25", health: "red", probability: 45 }
  ];

  const getHealthBadge = (health: string) => {
    switch (health) {
      case "green":
        return <Badge className="bg-green-500">Healthy</Badge>;
      case "yellow":
        return <Badge className="bg-orange-500">At Risk</Badge>;
      case "red":
        return <Badge className="bg-red-500">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recurring Revenue Tracking</h1>
          <p className="text-muted-foreground">Monitor MRR, ARR, churn, and subscription health</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="6months">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button>Export Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Current MRR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$278K</div>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">+15% MoM</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              ARR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$3.34M</div>
            <p className="text-sm text-muted-foreground">Annual run rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">645</div>
            <p className="text-sm text-muted-foreground">+38 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3.2%</div>
            <p className="text-sm text-muted-foreground">Below 5% target</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">MRR Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Subscription Breakdown</TabsTrigger>
          <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
          <TabsTrigger value="renewals">Upcoming Renewals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Recurring Revenue Trend</CardTitle>
              <CardDescription>MRR growth with breakdown by type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={mrrData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="mrr" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Total MRR" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>MRR Movement</CardTitle>
                <CardDescription>New, expansion, and churned MRR</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mrrData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newMrr" fill="#10b981" name="New MRR" />
                    <Bar dataKey="expansion" fill="#3b82f6" name="Expansion" />
                    <Bar dataKey="churnedMrr" fill="#ef4444" name="Churned MRR" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Net New MRR</span>
                    <span className="font-semibold text-green-600">+$36K</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">MRR Growth Rate</span>
                    <span className="font-semibold">14.9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Customer LTV</span>
                    <span className="font-semibold">$12,450</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">CAC Payback Period</span>
                    <span className="font-semibold">8.2 months</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">LTV:CAC Ratio</span>
                    <span className="font-semibold">3.8:1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Tier Performance</CardTitle>
              <CardDescription>MRR and churn by subscription tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscriptionBreakdown.map((tier, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{tier.tier}</h4>
                          <p className="text-sm text-muted-foreground">{tier.subscribers} active subscriptions</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">${(tier.mrr / 1000).toFixed(0)}K</div>
                          <div className="text-sm text-muted-foreground">MRR</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Avg Value</div>
                          <div className="font-semibold">${tier.avgValue}/mo</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Churn Rate</div>
                          <div className="font-semibold">{tier.churnRate}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">% of Total</div>
                          <div className="font-semibold">{Math.round((tier.mrr / 278000) * 100)}%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Analysis</CardTitle>
              <CardDescription>Customer retention by signup cohort</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cohortAnalysis.map((cohort, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="font-semibold">{cohort.cohort}</div>
                    <div className="grid grid-cols-7 gap-2">
                      {[cohort.month0, cohort.month1, cohort.month2, cohort.month3, cohort.month4, cohort.month5, cohort.month6].map((value, monthIdx) => (
                        value > 0 ? (
                          <div
                            key={monthIdx}
                            className="p-3 rounded text-center font-semibold"
                            style={{
                              backgroundColor: `rgba(59, 130, 246, ${value / 100})`,
                              color: value > 70 ? 'white' : 'black'
                            }}
                          >
                            {value}%
                          </div>
                        ) : (
                          <div key={monthIdx} className="p-3 rounded bg-gray-100 text-center text-gray-400">
                            -
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renewals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle>Upcoming Renewals (Next 30 Days)</CardTitle>
              </div>
              <CardDescription>Proactively manage subscription renewals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingRenewals.map((renewal, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{renewal.customer}</h4>
                            {getHealthBadge(renewal.health)}
                          </div>
                          <div className="text-sm space-y-1">
                            <div>
                              <span className="text-muted-foreground">MRR: </span>
                              <span className="font-semibold">${renewal.mrr.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Renewal Date: </span>
                              <span>{renewal.renewalDate}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Probability: </span>
                              <span className={renewal.probability >= 80 ? "text-green-600 font-semibold" : renewal.probability >= 60 ? "text-orange-600 font-semibold" : "text-red-600 font-semibold"}>
                                {renewal.probability}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant={renewal.health === "red" ? "default" : "outline"}>
                          {renewal.health === "red" ? "Urgent Action" : "Contact"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecurringRevenue;
