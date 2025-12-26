import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target,
  ExternalLink,
  MapPin,
  Building2,
  User,
  Tag,
  Clock,
  Zap,
  Activity,
  RefreshCw,
  Sparkles,
  Globe,
  BarChart3,
  X,
  Settings2
} from "lucide-react";

interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  trend: "up" | "down" | "stable";
  category: "opportunity" | "risk" | "neutral";
  timeframe: string;
  impact: "high" | "medium" | "low";
}

interface IntelligenceItem {
  id: string;
  title: string;
  description: string;
  sourceUrl: string;
  sourceDomain: string;
  category: string;
  entities: {
    organizations: string[];
    people: string[];
    locations: string[];
    topics: string[];
  };
  sentiment: "positive" | "negative" | "neutral";
  relevanceScore: number;
  publishedAt: string;
  region: string;
  language: string;
}

interface NeuralAIEngineProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NeuralAIEngine({ isOpen, onClose }: NeuralAIEngineProps) {
  const [activeTab, setActiveTab] = useState("predictions");
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [filterType, setFilterType] = useState("all");

  // Generate animated waveform data
  useEffect(() => {
    const generateWaveform = () => {
      const data = Array.from({ length: 60 }, () => Math.random() * 100);
      setWaveformData(data);
    };
    
    generateWaveform();
    const interval = setInterval(generateWaveform, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsProcessing(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Mock predictive insights
  const predictiveInsights: PredictiveInsight[] = [
    {
      id: "1",
      title: "High-value opportunity detected",
      description: "Market sentiment shifting positively in tech sector - 78% probability of growth",
      confidence: 94,
      trend: "up",
      category: "opportunity",
      timeframe: "Next 7 days",
      impact: "high"
    },
    {
      id: "2",
      title: "Competitor activity surge",
      description: "Increased media presence from key competitors in your market segment",
      confidence: 87,
      trend: "up",
      category: "risk",
      timeframe: "Ongoing",
      impact: "medium"
    },
    {
      id: "3",
      title: "Emerging trend identified",
      description: "AI-powered automation gaining traction in East African markets",
      confidence: 76,
      trend: "up",
      category: "opportunity",
      timeframe: "Next 30 days",
      impact: "high"
    },
    {
      id: "4",
      title: "Regulatory change predicted",
      description: "Policy shifts expected in digital services sector based on government signals",
      confidence: 68,
      trend: "stable",
      category: "neutral",
      timeframe: "Q1 2026",
      impact: "medium"
    }
  ];

  // Mock intelligence items with full data
  const intelligenceItems: IntelligenceItem[] = [
    {
      id: "1",
      title: "Adama Science and Technology University Launches New AI Research Center",
      description: "Welcome to Adama Science and Technology University's new state-of-the-art AI research facility focusing on agricultural technology.",
      sourceUrl: "https://www.astu.edu.et/news/ai-center-launch",
      sourceDomain: "astu.edu.et",
      category: "competitor",
      entities: {
        organizations: ["Adama Science and Technology University", "Ministry of Education"],
        people: ["Dr. Tekle Hagos", "Prof. Meron Bekele"],
        locations: ["Adama", "Oromia Region", "Ethiopia"],
        topics: ["AI Research", "Agricultural Technology", "Higher Education"]
      },
      sentiment: "positive",
      relevanceScore: 92,
      publishedAt: "2025-12-12T10:30:00Z",
      region: "East Africa",
      language: "English"
    },
    {
      id: "2",
      title: "Ethiopian Chamber of Commerce Announces Digital Transformation Initiative",
      description: "The Ethiopian Chamber of Commerce and Sectoral Associations unveils comprehensive digital strategy for SMEs.",
      sourceUrl: "https://www.ethiopianchamber.com/digital-initiative",
      sourceDomain: "ethiopianchamber.com",
      category: "industry",
      entities: {
        organizations: ["Ethiopian Chamber of Commerce", "World Bank", "AfDB"],
        people: ["Ato Melaku Ezezew", "Dr. Yohannes Ayalew"],
        locations: ["Addis Ababa", "Ethiopia", "East Africa"],
        topics: ["Digital Transformation", "SME Development", "E-Commerce"]
      },
      sentiment: "positive",
      relevanceScore: 88,
      publishedAt: "2025-12-11T14:00:00Z",
      region: "East Africa",
      language: "English"
    },
    {
      id: "3",
      title: "Tech Startup Ecosystem Report: Q4 2025",
      description: "Comprehensive analysis of venture funding and startup growth in Sub-Saharan Africa tech sector.",
      sourceUrl: "https://techcrunch.com/africa-startup-report-q4-2025",
      sourceDomain: "techcrunch.com",
      category: "market",
      entities: {
        organizations: ["Safaricom", "Flutterwave", "Andela", "Y Combinator"],
        people: ["Iyinoluwa Aboyeji", "Juliet Ehimuan"],
        locations: ["Kenya", "Nigeria", "Ethiopia", "South Africa"],
        topics: ["Venture Capital", "Fintech", "Startup Funding"]
      },
      sentiment: "positive",
      relevanceScore: 85,
      publishedAt: "2025-12-10T09:00:00Z",
      region: "Sub-Saharan Africa",
      language: "English"
    },
    {
      id: "4",
      title: "Government Policy Update: New Digital Services Tax Framework",
      description: "Ministry of Finance releases guidelines on digital services taxation affecting tech companies.",
      sourceUrl: "https://www.mof.gov.et/digital-tax-framework",
      sourceDomain: "mof.gov.et",
      category: "regulatory",
      entities: {
        organizations: ["Ministry of Finance", "Ethiopian Revenue Authority"],
        people: ["Minister Ahmed Shide"],
        locations: ["Ethiopia", "Addis Ababa"],
        topics: ["Digital Tax", "Regulatory Compliance", "Tech Policy"]
      },
      sentiment: "neutral",
      relevanceScore: 95,
      publishedAt: "2025-12-09T11:00:00Z",
      region: "Ethiopia",
      language: "English"
    }
  ];

  const filteredIntel = filterType === "all" 
    ? intelligenceItems 
    : intelligenceItems.filter(item => item.category === filterType);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      competitor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      industry: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      market: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      regulatory: "bg-amber-500/20 text-amber-400 border-amber-500/30"
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const getSentimentColor = (sentiment: string) => {
    const colors: Record<string, string> = {
      positive: "text-emerald-400",
      negative: "text-red-400",
      neutral: "text-muted-foreground"
    };
    return colors[sentiment] || "text-muted-foreground";
  };

  const getImpactBadge = (impact: string) => {
    const styles: Record<string, string> = {
      high: "bg-red-500/20 text-red-400 border-red-500/30",
      medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
    };
    return styles[impact] || "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-background via-background to-purple-950/20 border-purple-500/30 shadow-2xl shadow-purple-500/10">
        {/* Header */}
        <CardHeader className="border-b border-purple-500/20 bg-gradient-to-r from-purple-950/50 to-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center animate-pulse">
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Neural AI Engine
                </CardTitle>
                <p className="text-sm text-purple-400/80 flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  Quantum predictive analysis active
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Neural Waveform Visualization */}
          <div className="mt-4 p-4 rounded-xl bg-purple-950/30 border border-purple-500/20">
            <div className="flex items-end gap-0.5 h-16 justify-center">
              {waveformData.map((value, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full transition-all duration-300"
                  style={{
                    height: `${value}%`,
                    background: `linear-gradient(to top, hsl(280, 80%, 60%), hsl(320, 80%, 60%))`,
                    opacity: 0.6 + (value / 250)
                  }}
                />
              ))}
            </div>
            {isProcessing && (
              <div className="text-center mt-2 text-xs text-purple-400 animate-pulse">
                Processing neural patterns...
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border/50 px-4">
              <TabsList className="bg-transparent h-12 gap-2">
                <TabsTrigger 
                  value="predictions" 
                  className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 rounded-lg px-6"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Predictions
                </TabsTrigger>
                <TabsTrigger 
                  value="market-intel"
                  className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 rounded-lg px-6"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Market Intel
                </TabsTrigger>
                <TabsTrigger 
                  value="settings"
                  className="data-[state=active]:bg-muted rounded-lg px-4"
                >
                  <Settings2 className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[50vh]">
              {/* Predictions Tab */}
              <TabsContent value="predictions" className="p-4 space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    Predictive Insights
                  </h3>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                    {predictiveInsights.length} Active
                  </Badge>
                </div>

                <div className="space-y-3">
                  {predictiveInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className="p-4 rounded-xl border bg-card/50 hover:bg-card/80 transition-all duration-300 hover:border-purple-500/30"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          insight.category === "opportunity" 
                            ? "bg-emerald-500/20 text-emerald-400"
                            : insight.category === "risk"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {insight.trend === "up" ? (
                            <TrendingUp className="h-5 w-5" />
                          ) : insight.trend === "down" ? (
                            <TrendingDown className="h-5 w-5" />
                          ) : (
                            <Target className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <span className="text-2xl font-bold text-purple-400">{insight.confidence}%</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {insight.timeframe}
                            </Badge>
                            <Badge className={`text-xs ${getImpactBadge(insight.impact)}`}>
                              {insight.impact.toUpperCase()} IMPACT
                            </Badge>
                          </div>
                          <Progress 
                            value={insight.confidence} 
                            className="h-1.5 bg-purple-950/50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Market Intel Tab */}
              <TabsContent value="market-intel" className="p-4 space-y-4 mt-0">
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 to-fuchsia-950/30 border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Brain className="h-6 w-6 text-purple-400" />
                    <h3 className="text-lg font-semibold">AI Market Insights</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Real-time intelligence feed with entity extraction, sentiment analysis, and geographic mapping.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-muted-foreground">Intelligence Feed</h3>
                  <div className="flex items-center gap-2">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="competitor">Competitor</SelectItem>
                        <SelectItem value="industry">Industry</SelectItem>
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="regulatory">Regulatory</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh All
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredIntel.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border bg-card hover:shadow-lg transition-all duration-300"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${getSentimentColor(item.sentiment)} bg-current/10`}>
                            <TrendingUp className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold line-clamp-2">{item.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          </div>
                        </div>
                        <a 
                          href={item.sourceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="h-5 w-5 text-muted-foreground" />
                        </a>
                      </div>

                      {/* Source & Meta */}
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <Badge variant="outline" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          {item.sourceDomain}
                        </Badge>
                        <Badge className={`text-xs border ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getImpactBadge(item.relevanceScore > 90 ? "high" : item.relevanceScore > 80 ? "medium" : "low")}`}>
                          {item.relevanceScore}% Relevance
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(item.publishedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Entities Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/30">
                        {/* Organizations */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            Organizations
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.entities.organizations.slice(0, 2).map((org, i) => (
                              <Badge key={i} variant="secondary" className="text-xs truncate max-w-[120px]">
                                {org}
                              </Badge>
                            ))}
                            {item.entities.organizations.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.entities.organizations.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* People */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            People
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.entities.people.slice(0, 2).map((person, i) => (
                              <Badge key={i} variant="secondary" className="text-xs truncate max-w-[100px]">
                                {person}
                              </Badge>
                            ))}
                            {item.entities.people.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.entities.people.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Locations */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            Locations
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.entities.locations.slice(0, 2).map((loc, i) => (
                              <Badge key={i} variant="secondary" className="text-xs truncate max-w-[80px]">
                                {loc}
                              </Badge>
                            ))}
                            {item.entities.locations.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.entities.locations.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Topics */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Tag className="h-3 w-3" />
                            Topics
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.entities.topics.slice(0, 2).map((topic, i) => (
                              <Badge key={i} variant="secondary" className="text-xs truncate max-w-[80px]">
                                {topic}
                              </Badge>
                            ))}
                            {item.entities.topics.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{item.entities.topics.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {item.region}
                          <span className="mx-1">•</span>
                          {item.language}
                        </div>
                        <a 
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View Source
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="p-4 space-y-4 mt-0">
                <div className="text-center py-8 text-muted-foreground">
                  <Settings2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Neural engine configuration coming soon</p>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
