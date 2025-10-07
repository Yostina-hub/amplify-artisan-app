import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Users,
  DollarSign,
  Clock,
  MessageSquare,
  Target,
  Zap,
  Search
} from "lucide-react";
import { PageHelp } from "@/components/PageHelp";

interface HealthScore {
  overall: number;
  trend: "up" | "down" | "stable";
  factors: HealthFactor[];
  alerts: Alert[];
}

interface HealthFactor {
  name: string;
  score: number;
  weight: number;
  trend: "up" | "down" | "stable";
  details: string;
}

interface Alert {
  type: "critical" | "warning" | "info";
  message: string;
  action: string;
}

interface Customer {
  id: string;
  name: string;
  mrr: number;
  healthScore: number;
  trend: "up" | "down" | "stable";
  riskLevel: "low" | "medium" | "high" | "critical";
  lastContact: string;
  daysToRenewal: number;
}

const mockCustomers: Customer[] = [
  { id: "1", name: "Acme Corp", mrr: 5000, healthScore: 25, trend: "down", riskLevel: "critical", lastContact: "45 days ago", daysToRenewal: 30 },
  { id: "2", name: "TechStart Inc", mrr: 2500, healthScore: 45, trend: "down", riskLevel: "high", lastContact: "30 days ago", daysToRenewal: 60 },
  { id: "3", name: "Global Systems", mrr: 8000, healthScore: 62, trend: "stable", riskLevel: "medium", lastContact: "15 days ago", daysToRenewal: 90 },
  { id: "4", name: "Innovation Labs", mrr: 3500, healthScore: 85, trend: "up", riskLevel: "low", lastContact: "5 days ago", daysToRenewal: 120 },
  { id: "5", name: "Enterprise Solutions", mrr: 12000, healthScore: 92, trend: "up", riskLevel: "low", lastContact: "3 days ago", daysToRenewal: 180 },
];

const healthFactors: HealthFactor[] = [
  { name: "Product Usage", score: 45, weight: 30, trend: "down", details: "Login frequency decreased by 40% in last 30 days" },
  { name: "Feature Adoption", score: 60, weight: 20, trend: "stable", details: "Using 6 out of 10 available features" },
  { name: "Support Tickets", score: 70, weight: 15, trend: "down", details: "3 tickets opened in last week, avg response time 8 hours" },
  { name: "Payment History", score: 85, weight: 15, trend: "up", details: "All invoices paid on time, no payment issues" },
  { name: "Engagement Score", score: 40, trend: "down", weight: 10, details: "No email opens in 2 weeks, declined last meeting invite" },
  { name: "NPS/Satisfaction", score: 50, weight: 10, trend: "down", details: "Last NPS score: 6/10 (Passive)" },
];

const radarData = healthFactors.map(f => ({
  factor: f.name.split(' ')[0],
  score: f.score,
  fullMark: 100
}));

const trendData = [
  { month: "Jan", score: 85 },
  { month: "Feb", score: 82 },
  { month: "Mar", score: 78 },
  { month: "Apr", score: 70 },
  { month: "May", score: 62 },
  { month: "Jun", score: 55 },
];

export default function CustomerHealthScore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(mockCustomers[0]);
  const [filterRisk, setFilterRisk] = useState<string>("all");

  const filteredCustomers = mockCustomers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRisk === "all" || c.riskLevel === filterRisk;
    return matchesSearch && matchesFilter;
  });

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100 border-green-300";
    if (score >= 60) return "text-blue-600 bg-blue-100 border-blue-300";
    if (score >= 40) return "text-yellow-600 bg-yellow-100 border-yellow-300";
    if (score >= 20) return "text-orange-600 bg-orange-100 border-orange-300";
    return "text-red-600 bg-red-100 border-red-300";
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return "Healthy";
    if (score >= 60) return "At Risk";
    if (score >= 40) return "Unhealthy";
    return "Critical";
  };

  const getRiskBadge = (level: string) => {
    const colors = {
      low: "bg-green-100 text-green-800 border-green-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      high: "bg-orange-100 text-orange-800 border-orange-300",
      critical: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[level as keyof typeof colors] || colors.low;
  };

  const overallScore = selectedCustomer ? selectedCustomer.healthScore : 62;

  return (
    <div className="space-y-6">
      <PageHelp
        title="Customer Health Score"
        description="Monitor customer health and predict churn risk with AI-powered insights."
        features={[
          "Real-time health scoring",
          "Multi-factor analysis",
          "Churn risk prediction",
          "Automated alerts and recommendations",
          "Trend analysis over time",
          "Renewal forecasting"
        ]}
        tips={[
          "Review critical accounts daily",
          "Set up automated health check workflows",
          "Track engagement metrics closely",
          "Reach out proactively to at-risk customers",
          "Celebrate wins with healthy customers"
        ]}
      />

      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Heart className="h-8 w-8 text-red-600" />
          Customer Health Score
        </h2>
        <p className="text-muted-foreground">
          Monitor customer health and prevent churn
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy Accounts</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">2</div>
            <p className="text-xs text-muted-foreground mt-1">80+ health score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">2</div>
            <p className="text-xs text-muted-foreground mt-1">40-60 health score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">1</div>
            <p className="text-xs text-muted-foreground mt-1">Below 40 score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">62</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingDown className="h-3 w-3 text-red-600" />
              <p className="text-xs text-red-600 font-medium">-8 vs last month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Customers</CardTitle>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedCustomer?.id === customer.id ? "border-primary bg-accent" : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{customer.name}</div>
                    <Badge variant="outline" className={getRiskBadge(customer.riskLevel)}>
                      {customer.riskLevel}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Health Score</span>
                      <span className={`font-bold ${getHealthColor(customer.healthScore).split(' ')[0]}`}>
                        {customer.healthScore}
                      </span>
                    </div>
                    <Progress value={customer.healthScore} className="h-1.5" />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>${customer.mrr}/mo</span>
                    <span>{customer.daysToRenewal}d to renewal</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedCustomer?.name}</CardTitle>
                <CardDescription>Health Score Analysis</CardDescription>
              </div>
              <Badge
                variant="outline"
                className={`${getHealthColor(overallScore)} text-lg px-4 py-2 border-2`}
              >
                <Heart className="mr-2 h-4 w-4" />
                {overallScore}
                <span className="ml-2 text-sm">/ 100</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="factors">Factors</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Health Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="factor" />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} />
                          <Radar name="Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Key Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-accent rounded">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">MRR</span>
                          </div>
                          <span className="font-bold">${selectedCustomer?.mrr}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-accent rounded">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Last Contact</span>
                          </div>
                          <span className="font-bold">{selectedCustomer?.lastContact}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-accent rounded">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Renewal</span>
                          </div>
                          <span className="font-bold">{selectedCustomer?.daysToRenewal} days</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-accent rounded">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Status</span>
                          </div>
                          <Badge variant="outline" className={getRiskBadge(selectedCustomer?.riskLevel || "low")}>
                            {selectedCustomer?.riskLevel}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Automated Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900">Critical: Low Product Usage</h4>
                          <p className="text-sm text-red-800 mt-1">Login frequency dropped 40% in last 30 days</p>
                          <Button size="sm" className="mt-2" variant="outline">
                            Schedule Check-in Call
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-orange-900">Warning: No Recent Engagement</h4>
                          <p className="text-sm text-orange-800 mt-1">No email opens in 2 weeks, declined meeting</p>
                          <Button size="sm" className="mt-2" variant="outline">
                            Send Re-engagement Campaign
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                        <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-yellow-900">Info: Renewal Approaching</h4>
                          <p className="text-sm text-yellow-800 mt-1">Contract renews in 30 days</p>
                          <Button size="sm" className="mt-2" variant="outline">
                            Start Renewal Process
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="factors" className="space-y-3">
                {healthFactors.map((factor, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{factor.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {factor.weight}% weight
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-bold ${getHealthColor(factor.score).split(' ')[0]}`}>
                            {factor.score}
                          </span>
                          {factor.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                          {factor.trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Progress value={factor.score} className="h-2 mb-2" />
                      <p className="text-sm text-muted-foreground">{factor.details}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="trends" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Health Score Over Time</CardTitle>
                    <CardDescription>6-month trend analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#ef4444"
                          strokeWidth={3}
                          name="Health Score"
                          dot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Trend Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="font-semibold text-red-900">Declining Health</span>
                        </div>
                        <p className="text-sm text-red-800">
                          Score dropped 30 points over 6 months. Main factors: decreased usage and engagement.
                        </p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold text-orange-900">Churn Risk: 65%</span>
                        </div>
                        <p className="text-sm text-orange-800">
                          Based on historical data, accounts with this profile have a 65% probability of churning within 90 days.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recommended Actions</CardTitle>
                    <CardDescription>AI-powered intervention strategies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          priority: "High",
                          action: "Schedule Executive Business Review",
                          reason: "No senior stakeholder contact in 45 days",
                          impact: "75% success rate in similar situations"
                        },
                        {
                          priority: "High",
                          action: "Product Training Session",
                          reason: "Low feature adoption (60%)",
                          impact: "Typically increases usage by 40%"
                        },
                        {
                          priority: "Medium",
                          action: "Share Success Stories",
                          reason: "May not see full value",
                          impact: "Demonstrates ROI and best practices"
                        },
                        {
                          priority: "Medium",
                          action: "Offer Premium Support",
                          reason: "3 support tickets last week",
                          impact: "Reduces friction and shows commitment"
                        }
                      ].map((item, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={item.priority === "High" ? "destructive" : "secondary"}>
                                  {item.priority} Priority
                                </Badge>
                              </div>
                              <h4 className="font-semibold">{item.action}</h4>
                            </div>
                            <Button size="sm">Take Action</Button>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            <strong>Reason:</strong> {item.reason}
                          </p>
                          <p className="text-sm text-green-700">
                            <strong>Impact:</strong> {item.impact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
