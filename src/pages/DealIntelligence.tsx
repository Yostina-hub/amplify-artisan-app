import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from "recharts";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Activity,
  Brain,
  Sparkles
} from "lucide-react";
import { PageHelp } from "@/components/PageHelp";

interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: string;
  winProbability: number;
  aiConfidence: number;
  daysInStage: number;
  expectedCloseDate: string;
  signals: Signal[];
  recommendations: string[];
  riskFactors: string[];
}

interface Signal {
  type: "positive" | "negative" | "neutral";
  message: string;
  impact: "high" | "medium" | "low";
}

const mockDeals: Deal[] = [
  {
    id: "1",
    name: "Enterprise CRM Deal",
    company: "Acme Corp",
    value: 85000,
    stage: "Negotiation",
    winProbability: 85,
    aiConfidence: 92,
    daysInStage: 12,
    expectedCloseDate: "2025-10-15",
    signals: [
      { type: "positive", message: "Decision maker actively engaged in last 3 days", impact: "high" },
      { type: "positive", message: "Budget approved last week", impact: "high" },
      { type: "neutral", message: "Comparing with one competitor", impact: "medium" }
    ],
    recommendations: [
      "Send comparison guide highlighting your advantages",
      "Schedule final stakeholder call this week",
      "Prepare contract for signature"
    ],
    riskFactors: []
  },
  {
    id: "2",
    name: "Sales Automation Project",
    company: "TechStart Inc",
    value: 45000,
    stage: "Proposal",
    winProbability: 62,
    aiConfidence: 88,
    daysInStage: 18,
    expectedCloseDate: "2025-10-25",
    signals: [
      { type: "positive", message: "Opened proposal 5 times", impact: "medium" },
      { type: "negative", message: "No response to follow-up emails in 10 days", impact: "high" },
      { type: "negative", message: "Deal stagnant for 18 days", impact: "medium" }
    ],
    recommendations: [
      "Make urgency call to understand blockers",
      "Offer limited-time discount to create urgency",
      "Share customer success story from similar company"
    ],
    riskFactors: ["Long silence period", "Stagnant in stage"]
  },
  {
    id: "3",
    name: "Global Implementation",
    company: "Global Systems",
    value: 120000,
    stage: "Qualification",
    winProbability: 45,
    aiConfidence: 75,
    daysInStage: 35,
    expectedCloseDate: "2025-11-15",
    signals: [
      { type: "negative", message: "Multiple decision makers not aligned", impact: "high" },
      { type: "negative", message: "Budget concerns raised in last meeting", impact: "high" },
      { type: "positive", message: "Technical team loves the product", impact: "medium" }
    ],
    recommendations: [
      "Request executive sponsor alignment meeting",
      "Create ROI calculator showing payback period",
      "Offer phased implementation to reduce initial cost"
    ],
    riskFactors: ["Stakeholder misalignment", "Budget constraints", "Long sales cycle"]
  }
];

const scatterData = mockDeals.map(d => ({
  x: d.value / 1000,
  y: d.winProbability,
  z: d.aiConfidence,
  name: d.company
}));

const stageAnalysis = [
  { stage: "Prospecting", avgWin: 15, deals: 12, value: 250000 },
  { stage: "Qualification", avgWin: 25, deals: 8, value: 320000 },
  { stage: "Proposal", avgWin: 50, deals: 6, value: 380000 },
  { stage: "Negotiation", avgWin: 75, deals: 4, value: 425000 }
];

export default function DealIntelligence() {
  const [selectedDeal, setSelectedDeal] = useState<Deal>(mockDeals[0]);
  const [filterStage, setFilterStage] = useState("all");

  const getProbabilityColor = (prob: number) => {
    if (prob >= 75) return "text-green-600 bg-green-100";
    if (prob >= 50) return "text-blue-600 bg-blue-100";
    if (prob >= 30) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getSignalIcon = (type: string) => {
    if (type === "positive") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (type === "negative") return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-blue-600" />;
  };

  const getSignalBg = (type: string) => {
    if (type === "positive") return "bg-green-50 border-green-200";
    if (type === "negative") return "bg-red-50 border-red-200";
    return "bg-blue-50 border-blue-200";
  };

  return (
    <div className="space-y-6">
      <PageHelp
        title="Deal Intelligence"
        description="AI-powered predictions and insights to help you close more deals."
        features={[
          "Win probability prediction",
          "Deal health monitoring",
          "Risk factor identification",
          "Automated recommendations",
          "Buying signal detection",
          "Competitor intelligence"
        ]}
        tips={[
          "Update deal information regularly for accurate predictions",
          "Act on AI recommendations quickly",
          "Focus on deals with high value and high probability",
          "Address risk factors immediately",
          "Use insights in sales conversations"
        ]}
      />

      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          Deal Intelligence
        </h2>
        <p className="text-muted-foreground">
          AI-powered predictions to close more deals
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Probability</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">1</div>
            <p className="text-xs text-muted-foreground mt-1">75%+ win probability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">1</div>
            <p className="text-xs text-muted-foreground mt-1">Risk factors present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$250K</div>
            <p className="text-xs text-muted-foreground mt-1">Active opportunities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weighted Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$155K</div>
            <p className="text-xs text-muted-foreground mt-1">Probability-adjusted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Deal List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Active Deals</CardTitle>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="qualification">Qualification</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="negotiation">Negotiation</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockDeals.map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => setSelectedDeal(deal)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedDeal.id === deal.id ? "border-primary bg-accent" : "hover:bg-accent"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{deal.company}</h4>
                        <p className="text-xs text-muted-foreground truncate">{deal.name}</p>
                      </div>
                      <Badge variant="outline" className="ml-2 shrink-0">
                        {deal.stage}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Win Probability</span>
                        <span className={`font-bold ${getProbabilityColor(deal.winProbability).split(' ')[0]}`}>
                          {deal.winProbability}%
                        </span>
                      </div>
                      <Progress value={deal.winProbability} className="h-1.5" />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Value</span>
                      <span className="font-bold">${(deal.value / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deal Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedDeal.company}</CardTitle>
                <CardDescription>{selectedDeal.name}</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${(selectedDeal.value / 1000).toFixed(0)}K</div>
                <Badge variant="outline" className="mt-1">{selectedDeal.stage}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="prediction" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="prediction">Prediction</TabsTrigger>
                <TabsTrigger value="signals">Signals</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="prediction" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Win Probability</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-center">
                          <div className="relative">
                            <div className={`text-5xl font-bold ${getProbabilityColor(selectedDeal.winProbability).split(' ')[0]}`}>
                              {selectedDeal.winProbability}%
                            </div>
                            <div className="text-xs text-center text-muted-foreground mt-1">
                              AI Confidence: {selectedDeal.aiConfidence}%
                            </div>
                          </div>
                        </div>
                        <Progress value={selectedDeal.winProbability} className="h-3" />
                        <div className="grid grid-cols-3 gap-2 text-xs text-center">
                          <div>
                            <div className="text-red-600 font-semibold">0-30%</div>
                            <div className="text-muted-foreground">Low</div>
                          </div>
                          <div>
                            <div className="text-yellow-600 font-semibold">30-70%</div>
                            <div className="text-muted-foreground">Medium</div>
                          </div>
                          <div>
                            <div className="text-green-600 font-semibold">70-100%</div>
                            <div className="text-muted-foreground">High</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Deal Health Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-accent rounded">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Days in Stage</span>
                          </div>
                          <span className="font-bold">{selectedDeal.daysInStage}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-accent rounded">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Expected Close</span>
                          </div>
                          <span className="font-bold">{new Date(selectedDeal.expectedCloseDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-accent rounded">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Weighted Value</span>
                          </div>
                          <span className="font-bold">
                            ${((selectedDeal.value * selectedDeal.winProbability) / 100000).toFixed(0)}K
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <h4 className="font-semibold text-blue-900 mb-1">Deal Momentum</h4>
                        <p className="text-sm text-blue-800">
                          {selectedDeal.winProbability >= 75
                            ? "Strong positive momentum. Deal is likely to close within expected timeframe."
                            : selectedDeal.winProbability >= 50
                            ? "Moderate momentum. Focus on addressing key concerns to improve close probability."
                            : "Weak momentum. Significant intervention needed to save this deal."}
                        </p>
                      </div>

                      {selectedDeal.riskFactors.length > 0 && (
                        <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                          <h4 className="font-semibold text-red-900 mb-1">Risk Factors</h4>
                          <ul className="space-y-1">
                            {selectedDeal.riskFactors.map((risk, i) => (
                              <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                        <h4 className="font-semibold text-green-900 mb-1">Success Factors</h4>
                        <p className="text-sm text-green-800">
                          Deals in {selectedDeal.stage} with similar characteristics close at a {selectedDeal.winProbability}% rate.
                          Average deal size: ${(selectedDeal.value / 1000).toFixed(0)}K.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signals" className="space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Buying Signals</CardTitle>
                    <CardDescription>
                      Real-time signals detected by AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedDeal.signals.map((signal, i) => (
                        <div key={i} className={`p-3 border-l-4 rounded flex items-start gap-3 ${getSignalBg(signal.type)}`}>
                          {getSignalIcon(signal.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold">{signal.message}</span>
                              <Badge variant="outline" className="text-xs">
                                {signal.impact} impact
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="space-y-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recommended Actions</CardTitle>
                    <CardDescription>
                      AI-powered next steps to improve win probability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedDeal.recommendations.map((rec, i) => (
                        <div key={i} className="p-4 border rounded-lg flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Zap className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm mb-2">{rec}</p>
                            <Button size="sm" variant="outline">
                              Take Action
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Deal Position Analysis</CardTitle>
                    <CardDescription>
                      Value vs Win Probability (bubble size = AI confidence)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="x" name="Value ($K)" />
                        <YAxis dataKey="y" name="Win Probability (%)" />
                        <ZAxis dataKey="z" range={[100, 1000]} />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                        <Scatter data={scatterData} fill="#8884d8" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Pipeline Analysis by Stage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stageAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="stage" />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="avgWin" fill="#82ca9d" name="Avg Win Rate (%)" />
                        <Bar yAxisId="right" dataKey="deals" fill="#8884d8" name="Deal Count" />
                      </BarChart>
                    </ResponsiveContainer>
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
