import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { TrendingDown, AlertCircle, Target, DollarSign, Users, Lightbulb } from "lucide-react";

const LostReasonAnalysis = () => {
  const lostReasons = [
    { reason: "Price too high", count: 45, value: 450000, percentage: 32, color: "#ef4444" },
    { reason: "Competitor won", count: 28, value: 320000, percentage: 20, color: "#f59e0b" },
    { reason: "No budget", count: 35, value: 280000, percentage: 25, color: "#eab308" },
    { reason: "Timing not right", count: 18, value: 180000, percentage: 13, color: "#3b82f6" },
    { reason: "Missing features", count: 14, value: 140000, percentage: 10, color: "#8b5cf6" }
  ];

  const trendData = [
    { month: "Jul", price: 12, competitor: 8, budget: 10, timing: 5, features: 3 },
    { month: "Aug", price: 14, competitor: 7, budget: 12, timing: 6, features: 4 },
    { month: "Sep", price: 11, competitor: 9, budget: 11, timing: 4, features: 5 },
    { month: "Oct", price: 15, competitor: 10, budget: 13, timing: 7, features: 4 },
    { month: "Nov", price: 13, competitor: 6, budget: 9, timing: 5, features: 2 },
    { month: "Dec", price: 10, competitor: 8, budget: 8, timing: 6, features: 3 }
  ];

  const competitorAnalysis = [
    { competitor: "Salesforce", wins: 12, avgDealSize: 35000, commonReason: "Better brand recognition" },
    { competitor: "HubSpot", wins: 8, avgDealSize: 28000, commonReason: "Easier to use" },
    { competitor: "Zoho", wins: 5, avgDealSize: 18000, commonReason: "Lower price point" },
    { competitor: "Pipedrive", wins: 3, avgDealSize: 22000, commonReason: "Simpler interface" }
  ];

  const recommendations = [
    {
      issue: "Price Sensitivity",
      impact: "High",
      suggestion: "Create value-based pricing tiers with clear ROI calculators",
      implementation: "Product & Sales teams to develop pricing flexibility options"
    },
    {
      issue: "Competitive Positioning",
      impact: "Medium",
      suggestion: "Develop competitive battle cards highlighting unique differentiators",
      implementation: "Marketing to create comparison content and sales enablement materials"
    },
    {
      issue: "Feature Gaps",
      impact: "Medium",
      suggestion: "Prioritize top 3 missing features based on lost deal analysis",
      implementation: "Product roadmap to include: Advanced reporting, Mobile app, API integrations"
    },
    {
      issue: "Budget Constraints",
      impact: "High",
      suggestion: "Offer flexible payment terms and phased implementation options",
      implementation: "Finance to approve NET-60 terms and quarterly payment plans"
    }
  ];

  const dealsByStage = [
    { stage: "Discovery", lost: 8, avgDealSize: 25000 },
    { stage: "Demo", lost: 15, avgDealSize: 32000 },
    { stage: "Proposal", lost: 32, avgDealSize: 38000 },
    { stage: "Negotiation", lost: 28, avgDealSize: 42000 },
    { stage: "Contract", lost: 12, avgDealSize: 45000 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lost Reason Analysis</h1>
          <p className="text-muted-foreground">Understand why deals are lost and improve win rates</p>
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
              <TrendingDown className="h-4 w-4" />
              Total Lost Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">140</div>
            <p className="text-sm text-muted-foreground">Last 6 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Lost Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$1.37M</div>
            <p className="text-sm text-muted-foreground">Potential value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Top Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Price</div>
            <p className="text-sm text-muted-foreground">32% of lost deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Competitor Losses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">28</div>
            <p className="text-sm text-muted-foreground">20% of losses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Lost Deals by Reason</CardTitle>
                <CardDescription>Distribution of why deals were lost</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={lostReasons}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ reason, percentage }) => `${reason} (${percentage}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {lostReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lost Value by Reason</CardTitle>
                <CardDescription>Revenue impact of each lost reason</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lostReasons}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="reason" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lost Deals by Pipeline Stage</CardTitle>
              <CardDescription>Where in the sales process deals are typically lost</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dealsByStage.map((stage, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{stage.stage}</h4>
                      <p className="text-sm text-muted-foreground">{stage.lost} deals lost</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${(stage.avgDealSize / 1000).toFixed(0)}K</div>
                      <div className="text-sm text-muted-foreground">avg deal size</div>
                    </div>
                    <div className="ml-6 w-32">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-red-500 rounded-full h-2"
                          style={{ width: `${(stage.lost / 140) * 100}%` }}
                        />
                      </div>
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
              <CardTitle>Lost Reason Trends (6 Months)</CardTitle>
              <CardDescription>Track how lost reasons change over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="price" stroke="#ef4444" strokeWidth={2} name="Price" />
                  <Line type="monotone" dataKey="competitor" stroke="#f59e0b" strokeWidth={2} name="Competitor" />
                  <Line type="monotone" dataKey="budget" stroke="#eab308" strokeWidth={2} name="Budget" />
                  <Line type="monotone" dataKey="timing" stroke="#3b82f6" strokeWidth={2} name="Timing" />
                  <Line type="monotone" dataKey="features" stroke="#8b5cf6" strokeWidth={2} name="Features" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Improving Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Feature Gaps</span>
                    <Badge className="bg-green-500">-30%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Recent product updates addressing feedback</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Worsening Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Price Concerns</span>
                    <Badge className="bg-red-500">+15%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Increased price sensitivity in market</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Stable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Timing Issues</span>
                    <Badge variant="outline">±5%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Consistent seasonal pattern</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Win Analysis</CardTitle>
              <CardDescription>Where are we losing to competitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {competitorAnalysis.map((competitor, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{competitor.competitor}</h4>
                          <p className="text-sm text-muted-foreground">{competitor.commonReason}</p>
                        </div>
                        <Badge variant="outline" className="bg-red-50">
                          {competitor.wins} wins
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Avg Deal Size:</span>
                          <span className="font-semibold ml-2">${(competitor.avgDealSize / 1000).toFixed(0)}K</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Lost:</span>
                          <span className="font-semibold ml-2">${(competitor.wins * competitor.avgDealSize / 1000).toFixed(0)}K</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <CardTitle>Action Plan to Reduce Lost Deals</CardTitle>
              </div>
              <CardDescription>Strategic recommendations based on analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold">{rec.issue}</h4>
                        <Badge className={rec.impact === "High" ? "bg-red-500" : "bg-orange-500"}>
                          {rec.impact} Impact
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Recommendation:</p>
                          <p className="text-sm">{rec.suggestion}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Implementation:</p>
                          <p className="text-sm">{rec.implementation}</p>
                        </div>
                        <Button size="sm" variant="outline" className="mt-2">Assign Task</Button>
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

export default LostReasonAnalysis;
