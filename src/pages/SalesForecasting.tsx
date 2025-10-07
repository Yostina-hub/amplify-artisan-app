import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, Sparkles, AlertCircle } from "lucide-react";

const SalesForecasting = () => {
  const monthlyForecast = [
    { month: "Oct", actual: 145000, predicted: 142000, confidence: 92 },
    { month: "Nov", actual: 168000, predicted: 165000, confidence: 91 },
    { month: "Dec", actual: 189000, predicted: 192000, confidence: 89 },
    { month: "Jan", actual: 0, predicted: 215000, confidence: 87, lower: 195000, upper: 235000 },
    { month: "Feb", actual: 0, predicted: 228000, confidence: 85, lower: 205000, upper: 251000 },
    { month: "Mar", actual: 0, predicted: 245000, confidence: 82, lower: 218000, upper: 272000 }
  ];

  const quarterlyData = [
    { quarter: "Q4 2024", revenue: 502000, target: 480000, forecast: 518000, confidence: 88 },
    { quarter: "Q1 2025", revenue: 0, target: 550000, forecast: 688000, confidence: 85 },
    { quarter: "Q2 2025", revenue: 0, target: 600000, forecast: 752000, confidence: 78 },
    { quarter: "Q3 2025", revenue: 0, target: 650000, forecast: 825000, confidence: 72 }
  ];

  const pipelineContribution = [
    { stage: "Closed Won", amount: 145000, probability: 100, deals: 12 },
    { stage: "Contract Sent", amount: 89000, probability: 90, deals: 5 },
    { stage: "Proposal", amount: 125000, probability: 70, deals: 8 },
    { stage: "Demo", amount: 210000, probability: 40, deals: 15 },
    { stage: "Qualified", amount: 340000, probability: 20, deals: 24 }
  ];

  const aiInsights = [
    {
      type: "positive",
      title: "Strong Q1 Momentum",
      description: "Pipeline velocity increased 23% in last 30 days, indicating Q1 forecast is conservative",
      confidence: 92
    },
    {
      type: "warning",
      title: "Deal Cycle Lengthening",
      description: "Average close time increased from 45 to 52 days, may impact Q2 numbers",
      confidence: 88
    },
    {
      type: "neutral",
      title: "Seasonal Pattern Detected",
      description: "Historical data shows 15% uplift in March, factored into Q1 forecast",
      confidence: 85
    }
  ];

  const topReps = [
    { name: "Sarah Johnson", quota: 100000, forecast: 125000, attainment: 125, deals: 8 },
    { name: "Mike Davis", quota: 100000, forecast: 112000, attainment: 112, deals: 7 },
    { name: "John Smith", quota: 100000, forecast: 98000, attainment: 98, deals: 6 },
    { name: "Lisa Brown", quota: 80000, forecast: 85000, attainment: 106, deals: 9 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Forecasting with AI</h1>
          <p className="text-muted-foreground">Predictive analytics and revenue forecasting powered by machine learning</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="monthly">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            Refresh Forecast
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Q1 Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$688K</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-green-50">
                <TrendingUp className="h-3 w-3 mr-1" />
                +25%
              </Badge>
              <span className="text-xs text-muted-foreground">85% confidence</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quota Attainment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125%</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-green-500">On Track</Badge>
              <span className="text-xs text-muted-foreground">vs 100% target</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$909K</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">3.3x coverage</Badge>
              <span className="text-xs text-muted-foreground">weighted</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Forecast Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-blue-500">Excellent</Badge>
              <span className="text-xs text-muted-foreground">last 3 months</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monthly" className="w-full">
        <TabsList>
          <TabsTrigger value="monthly">Monthly Forecast</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly View</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Analysis</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>6-Month Revenue Forecast</CardTitle>
              <CardDescription>Predicted revenue with confidence intervals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={monthlyForecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="upper" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Upper Bound" />
                  <Area type="monotone" dataKey="predicted" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Predicted" />
                  <Area type="monotone" dataKey="lower" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="Lower Bound" />
                  <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} name="Actual" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Insights & Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiInsights.map((insight, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          {insight.type === "positive" && <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />}
                          {insight.type === "warning" && <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />}
                          {insight.type === "neutral" && <Sparkles className="h-5 w-5 text-blue-500 mt-0.5" />}
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{insight.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                            <Badge variant="outline" className="text-xs">
                              {insight.confidence}% confidence
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forecast Accuracy Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyForecast.filter(m => m.actual > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual" />
                    <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} name="Predicted" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quarterly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Forecast Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="target" fill="#94a3b8" name="Target" />
                  <Bar dataKey="forecast" fill="#3b82f6" name="Forecast" />
                  <Bar dataKey="revenue" fill="#10b981" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {quarterlyData.map((quarter, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{quarter.quarter}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Forecast</div>
                      <div className="text-xl font-bold">${(quarter.forecast / 1000).toFixed(0)}K</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">vs Target</div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500">
                          +{Math.round((quarter.forecast / quarter.target - 1) * 100)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {quarter.confidence}% confidence
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Stage Analysis</CardTitle>
              <CardDescription>Weighted revenue by pipeline stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineContribution.map((stage, idx) => {
                  const weightedAmount = stage.amount * (stage.probability / 100);
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{stage.stage}</div>
                          <div className="text-sm text-muted-foreground">{stage.deals} deals</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${(weightedAmount / 1000).toFixed(0)}K</div>
                          <div className="text-sm text-muted-foreground">{stage.probability}% × ${(stage.amount / 1000).toFixed(0)}K</div>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${stage.probability}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Team Forecast</CardTitle>
              <CardDescription>Individual quota attainment and forecast</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topReps.map((rep, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{rep.name}</h4>
                          <p className="text-sm text-muted-foreground">{rep.deals} active deals</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">${(rep.forecast / 1000).toFixed(0)}K</div>
                          <Badge className={rep.attainment >= 100 ? "bg-green-500" : "bg-orange-500"}>
                            {rep.attainment}% quota
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className={`rounded-full h-2 ${rep.attainment >= 100 ? "bg-green-500" : "bg-orange-500"}`}
                            style={{ width: `${Math.min(rep.attainment, 100)}%` }}
                          />
                        </div>
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

export default SalesForecasting;
