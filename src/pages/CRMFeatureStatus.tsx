import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Users, DollarSign, Target, Zap, Activity, ArrowUp, ArrowDown, Mic, MessageSquare, Clock, Award, AlertCircle, CheckCircle2, Phone, Mail, Calendar, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function CRMFeatureStatus() {
  const [isListening, setIsListening] = useState(false);
  const [aiInsight, setAiInsight] = useState("Analyzing real-time data...");
  const [realtimeMetrics, setRealtimeMetrics] = useState({
    revenue: 2847239,
    deals: 143,
    conversion: 67.8,
    engagement: 89.2
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeMetrics(prev => ({
        revenue: prev.revenue + Math.floor(Math.random() * 10000 - 5000),
        deals: prev.deals + Math.floor(Math.random() * 3 - 1),
        conversion: Math.min(100, Math.max(0, prev.conversion + (Math.random() * 2 - 1))),
        engagement: Math.min(100, Math.max(0, prev.engagement + (Math.random() * 1.5 - 0.75)))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Simulate AI insights rotation
  useEffect(() => {
    const insights = [
      "🎯 Top performer: Sarah J. closed 3 deals worth $245K today",
      "⚠️ 5 high-value opportunities need follow-up within 24 hours",
      "📈 Conversion rate up 12% this week - maintaining momentum",
      "🔥 New lead from Fortune 500 company - immediate attention recommended",
      "💡 Best time to contact prospects: 10 AM - 12 PM (87% success rate)",
      "🎨 Email template 'Modern Approach' has 94% open rate",
      "⏰ 8 meetings scheduled for tomorrow - preparation reminder sent"
    ];
    
    let index = 0;
    const insightInterval = setInterval(() => {
      index = (index + 1) % insights.length;
      setAiInsight(insights[index]);
    }, 5000);

    return () => clearInterval(insightInterval);
  }, []);

  const toggleVoice = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate voice activation
      setTimeout(() => setIsListening(false), 3000);
    }
  };

  const executiveMetrics = [
    {
      title: "Revenue Pipeline",
      value: `$${(realtimeMetrics.revenue / 1000000).toFixed(2)}M`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "from-emerald-500 to-green-600",
      glowColor: "emerald"
    },
    {
      title: "Active Deals",
      value: realtimeMetrics.deals,
      change: "+8",
      trend: "up",
      icon: Target,
      color: "from-blue-500 to-indigo-600",
      glowColor: "blue"
    },
    {
      title: "Win Rate",
      value: `${realtimeMetrics.conversion.toFixed(1)}%`,
      change: "+5.2%",
      trend: "up",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-600",
      glowColor: "purple"
    },
    {
      title: "Team Engagement",
      value: `${realtimeMetrics.engagement.toFixed(1)}%`,
      change: "+3.1%",
      trend: "up",
      icon: Users,
      color: "from-orange-500 to-red-600",
      glowColor: "orange"
    }
  ];

  const liveActivities = [
    { user: "Sarah J.", action: "closed deal with", client: "TechCorp Inc", value: "$125K", time: "2m ago", icon: CheckCircle2, color: "text-green-500" },
    { user: "Mike R.", action: "scheduled meeting with", client: "Global Systems", value: "Tomorrow", time: "5m ago", icon: Calendar, color: "text-blue-500" },
    { user: "Emma L.", action: "sent proposal to", client: "Innovation Labs", value: "$89K", time: "8m ago", icon: FileText, color: "text-purple-500" },
    { user: "David K.", action: "called prospect", client: "Future Dynamics", value: "Follow-up", time: "12m ago", icon: Phone, color: "text-orange-500" },
    { user: "Lisa M.", action: "emailed", client: "Smart Solutions", value: "Demo Request", time: "15m ago", icon: Mail, color: "text-pink-500" }
  ];

  const aiPredictions = [
    { title: "Hot Lead Alert", desc: "Enterprise Corp shows 94% conversion probability", priority: "critical", icon: Zap },
    { title: "Churn Risk", desc: "Client ABC may churn - proactive outreach suggested", priority: "high", icon: AlertCircle },
    { title: "Upsell Opportunity", desc: "5 accounts ready for premium upgrade", priority: "medium", icon: TrendingUp },
    { title: "Performance Insight", desc: "Q4 projected to exceed target by 23%", priority: "low", icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-purple-600/30 rounded-full blur-[150px] animate-glow-pulse" />
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/30 via-cyan-600/30 to-blue-600/30 rounded-full blur-[150px] animate-glow-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-gradient-to-r from-emerald-600/30 via-green-600/30 to-emerald-600/30 rounded-full blur-[150px] animate-glow-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-[600px] h-[600px] bg-gradient-to-r from-orange-600/25 via-red-600/25 to-orange-600/25 rounded-full blur-[150px] animate-glow-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto p-6 space-y-6">
        {/* Revolutionary Header */}
        <div className="relative overflow-hidden rounded-3xl p-12 bg-gradient-to-br from-purple-900/60 via-blue-900/60 to-emerald-900/60 backdrop-blur-2xl border-2 border-white/20 shadow-[0_0_80px_rgba(168,85,247,0.4)] animate-fade-in">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/50 via-pink-500/50 to-transparent rounded-full blur-3xl animate-glow-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/50 via-cyan-500/50 to-transparent rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '1s' }} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3 animate-slide-up">
                  <div className="relative">
                    <Brain className="h-12 w-12 text-purple-400 animate-float" />
                    <div className="absolute inset-0 bg-purple-500/50 blur-xl animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 animate-scale-in">
                      Executive Command Center
                    </h1>
                    <p className="text-white/70 text-lg mt-1">AI-Powered Real-Time Intelligence</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={toggleVoice}
                size="lg"
                className={`relative overflow-hidden transition-all duration-500 ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-110' 
                    : 'bg-gradient-to-r from-purple-500 to-blue-600 hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]'
                }`}
              >
                <Mic className={`mr-2 h-5 w-5 ${isListening ? 'animate-pulse' : ''}`} />
                {isListening ? 'Listening...' : 'Voice Command'}
                {isListening && (
                  <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                )}
              </Button>
            </div>

            {/* AI Insight Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/40 via-blue-600/40 to-emerald-600/40 backdrop-blur-xl border-2 border-white/30 p-5 animate-slide-up shadow-[0_0_40px_rgba(59,130,246,0.5)]">
              <div className="absolute inset-0 animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', backgroundSize: '200% 100%' }} />
              <div className="flex items-center gap-3 relative z-10">
                <Activity className="h-6 w-6 text-emerald-300 animate-pulse drop-shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
                <p className="text-white text-sm font-semibold drop-shadow-lg">{aiInsight}</p>
                <Badge className="ml-auto bg-emerald-500/40 text-emerald-100 border-2 border-emerald-300/50 font-bold shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-pulse">
                  LIVE
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {executiveMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="relative group animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-50 transition-opacity duration-500 blur-2xl`} />
                <Card className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border-2 border-white/30 hover:border-white/60 transition-all duration-500 hover:scale-105 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                  
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                    <CardTitle className="text-sm font-semibold text-white/90 drop-shadow-lg">{metric.title}</CardTitle>
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${metric.color} shadow-[0_0_30px_rgba(168,85,247,0.5)] group-hover:scale-125 group-hover:rotate-12 transition-all duration-500`}>
                      <Icon className="h-6 w-6 text-white animate-float drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                      {metric.value}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${metric.trend === 'up' ? 'bg-green-500/40 text-green-200 border-2 border-green-400/50 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-red-500/40 text-red-200 border-2 border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.6)]'} font-semibold`}>
                        {metric.trend === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                        {metric.change}
                      </Badge>
                      <span className="text-xs text-white/70 font-medium">vs last period</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Live Activity Feed */}
          <Card className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border-2 border-white/30 animate-fade-in shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-white drop-shadow-lg">
                <Activity className="h-6 w-6 text-blue-300 animate-pulse drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                <span className="font-bold">Live Activity Stream</span>
                <Badge className="ml-auto bg-red-500/50 text-white font-bold animate-pulse border-2 border-red-300/50 shadow-[0_0_20px_rgba(239,68,68,0.8)]">REAL-TIME</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              {liveActivities.map((activity, i) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border-2 border-white/20 hover:border-white/40 hover:bg-white/15 transition-all duration-500 group cursor-pointer animate-slide-up shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg`}>
                        <Icon className={`w-7 h-7 ${activity.color} drop-shadow-[0_0_8px_currentColor]`} />
                      </div>
                      <div className={`absolute inset-0 ${activity.color} opacity-60 blur-xl group-hover:blur-2xl transition-all duration-500`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white drop-shadow-lg">
                        <span className="text-blue-300">{activity.user}</span> {activity.action} <span className="text-purple-300">{activity.client}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-emerald-300 font-bold drop-shadow-[0_0_8px_rgba(110,231,183,0.6)]">{activity.value}</span>
                        <span className="text-xs text-white/50">•</span>
                        <span className="text-xs text-white/60 font-medium">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* AI Predictions Panel */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border-2 border-white/30 animate-fade-in shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-white drop-shadow-lg">
                <Brain className="h-6 w-6 text-purple-300 animate-float drop-shadow-[0_0_10px_rgba(216,180,254,0.8)]" />
                <span className="font-bold">AI Predictions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              {aiPredictions.map((pred, i) => {
                const Icon = pred.icon;
                const priorityColors = {
                  critical: 'from-red-600/40 to-pink-600/40 border-red-400/60 shadow-[0_0_25px_rgba(239,68,68,0.5)]',
                  high: 'from-orange-600/40 to-yellow-600/40 border-orange-400/60 shadow-[0_0_25px_rgba(249,115,22,0.5)]',
                  medium: 'from-blue-600/40 to-cyan-600/40 border-blue-400/60 shadow-[0_0_25px_rgba(59,130,246,0.5)]',
                  low: 'from-green-600/40 to-emerald-600/40 border-green-400/60 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                };
                const iconColors = {
                  critical: '#fca5a5',
                  high: '#fdba74',
                  medium: '#93c5fd',
                  low: '#6ee7b7'
                };
                return (
                  <div
                    key={i}
                    className={`p-5 rounded-2xl bg-gradient-to-br ${priorityColors[pred.priority as keyof typeof priorityColors]} backdrop-blur-xl border-2 hover:scale-105 transition-all duration-500 cursor-pointer group animate-scale-in`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-6 w-6 mt-0.5 group-hover:rotate-12 group-hover:scale-125 transition-transform duration-500 drop-shadow-[0_0_8px_currentColor]" style={{ color: iconColors[pred.priority as keyof typeof iconColors] }} />
                      <div>
                        <p className="text-sm font-bold text-white mb-1 drop-shadow-lg">{pred.title}</p>
                        <p className="text-xs text-white/80 font-medium">{pred.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border-2 border-white/30 animate-fade-in shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-white drop-shadow-lg">
              <BarChart3 className="h-6 w-6 text-emerald-300 drop-shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
              <span className="font-bold">Team Performance Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border-2 border-white/20 hover:border-emerald-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/90 font-semibold">Sales Target</span>
                  <span className="text-white font-bold drop-shadow-lg">$3.5M / $4M</span>
                </div>
                <Progress value={87.5} className="h-4 bg-white/10" />
                <p className="text-xs text-emerald-300 font-bold drop-shadow-[0_0_8px_rgba(110,231,183,0.6)]">87.5% achieved • On track to exceed</p>
              </div>
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border-2 border-white/20 hover:border-blue-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/90 font-semibold">Team Activity</span>
                  <span className="text-white font-bold drop-shadow-lg">892 / 1000</span>
                </div>
                <Progress value={89.2} className="h-4 bg-white/10" />
                <p className="text-xs text-blue-300 font-bold drop-shadow-[0_0_8px_rgba(147,197,253,0.6)]">89.2% of daily goal • Excellent pace</p>
              </div>
              <div className="space-y-3 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border-2 border-white/20 hover:border-purple-400/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/90 font-semibold">Customer Satisfaction</span>
                  <span className="text-white font-bold drop-shadow-lg">4.8 / 5.0</span>
                </div>
                <Progress value={96} className="h-4 bg-white/10" />
                <p className="text-xs text-purple-300 font-bold drop-shadow-[0_0_8px_rgba(216,180,254,0.6)]">96% satisfaction rate • Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Chat Assistant */}
        <div className="fixed bottom-6 right-6 z-50 animate-scale-in">
          <Button 
            size="lg"
            className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-600 via-blue-600 to-emerald-600 shadow-[0_0_60px_rgba(147,51,234,0.8)] hover:shadow-[0_0_80px_rgba(147,51,234,1)] hover:scale-125 transition-all duration-500 group relative overflow-hidden border-4 border-white/30"
          >
            <MessageSquare className="h-8 w-8 text-white group-hover:rotate-12 transition-transform duration-500 relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            <div className="absolute inset-0 bg-white/30 animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', backgroundSize: '200% 100%' }} />
            <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full border-4 border-white shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse" />
          </Button>
        </div>
      </div>
    </div>
  );
}
