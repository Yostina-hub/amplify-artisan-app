import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, Target, Users } from "lucide-react";

const CampaignROI = () => {
  const campaigns = [
    {
      name: "Q4 Email Campaign",
      spent: 5000,
      revenue: 45000,
      roi: 800,
      leads: 320,
      conversions: 24,
      cpl: 15.63,
      status: "active"
    },
    {
      name: "LinkedIn Ads",
      spent: 8000,
      revenue: 62000,
      roi: 675,
      leads: 180,
      conversions: 18,
      cpl: 44.44,
      status: "active"
    },
    {
      name: "Google AdWords",
      spent: 12000,
      revenue: 89000,
      roi: 642,
      leads: 450,
      conversions: 32,
      cpl: 26.67,
      status: "active"
    },
    {
      name: "Trade Show",
      spent: 15000,
      revenue: 125000,
      roi: 733,
      leads: 240,
      conversions: 28,
      cpl: 62.50,
      status: "completed"
    }
  ];

  const monthlyTrend = [
    { month: "Jul", spend: 15000, revenue: 98000, roi: 553 },
    { month: "Aug", spend: 18000, revenue: 125000, roi: 594 },
    { month: "Sep", spend: 22000, revenue: 156000, roi: 609 },
    { month: "Oct", spend: 25000, revenue: 189000, roi: 656 },
    { month: "Nov", spend: 28000, revenue: 225000, roi: 704 },
    { month: "Dec", spend: 30000, revenue: 321000, roi: 970 }
  ];

  const channelPerformance = [
    { channel: "Email", roi: 800, spend: 5000, revenue: 45000 },
    { channel: "Social Media", roi: 650, spend: 10000, revenue: 75000 },
    { channel: "Search Ads", roi: 580, spend: 15000, revenue: 102000 },
    { channel: "Content", roi: 420, spend: 8000, revenue: 41600 },
    { channel: "Events", roi: 350, spend: 20000, revenue: 90000 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Campaign ROI Tracking</h1>
          <p className="text-muted-foreground">Measure and optimize marketing campaign returns</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="6months">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
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
              Total Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$40K</div>
            <p className="text-sm text-muted-foreground">Last 6 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$321K</div>
            <p className="text-sm text-muted-foreground">From campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Avg ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">702%</div>
            <p className="text-sm text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">102</div>
            <p className="text-sm text-muted-foreground">Closed deals</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaign Details</TabsTrigger>
          <TabsTrigger value="channels">Channel Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ROI by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channelPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="roi" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="spend" stroke="#ef4444" strokeWidth={2} name="Spend" />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>Performance metrics for each campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaigns.map((campaign, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{campaign.name}</h4>
                          <Badge className={campaign.status === "active" ? "bg-green-500" : "bg-gray-500"}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{campaign.roi}%</div>
                          <div className="text-sm text-muted-foreground">ROI</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Spent</div>
                          <div className="font-semibold">${(campaign.spent / 1000).toFixed(1)}K</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Revenue</div>
                          <div className="font-semibold">${(campaign.revenue / 1000).toFixed(0)}K</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Leads</div>
                          <div className="font-semibold">{campaign.leads}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Conversions</div>
                          <div className="font-semibold">{campaign.conversions}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">CPL</div>
                          <div className="font-semibold">${campaign.cpl.toFixed(2)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channelPerformance.map((channel, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{channel.channel}</div>
                        <div className="text-sm text-muted-foreground">
                          Spend: ${(channel.spend / 1000).toFixed(1)}K • Revenue: ${(channel.revenue / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">{channel.roi}%</div>
                        <div className="text-xs text-muted-foreground">ROI</div>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-green-500 rounded-full h-2"
                        style={{ width: `${Math.min((channel.roi / 10), 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ROI Trend Analysis</CardTitle>
              <CardDescription>6-month ROI performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="roi" stroke="#10b981" strokeWidth={3} name="ROI %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignROI;
