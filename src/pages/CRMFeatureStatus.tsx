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
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-glow-pulse" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] animate-glow-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto p-6 space-y-6">
        {/* Revolutionary Header */}
        <div className="relative overflow-hidden rounded-3xl p-12 bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-emerald-900/40 backdrop-blur-xl border border-white/10 animate-fade-in">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-transparent rounded-full blur-3xl animate-glow-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/30 to-transparent rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '1s' }} />
          
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
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-emerald-500/20 backdrop-blur-sm border border-white/20 p-4 animate-slide-up">
              <div className="absolute inset-0 animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', backgroundSize: '200% 100%' }} />
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
                <p className="text-white text-sm font-medium">{aiInsight}</p>
                <Badge className="ml-auto bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
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
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" 
                     style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-from), var(--tw-gradient-to))` }} 
                />
                <Card className="relative overflow-hidden bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 hover:border-white/40 transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                  <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-10 group-hover:opacity-20 transition-opacity duration-500`} />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">{metric.title}</CardTitle>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                      <Icon className="h-5 w-5 text-white animate-float" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">
                      {metric.value}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${metric.trend === 'up' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'} border-0`}>
                        {metric.trend === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                        {metric.change}
                      </Badge>
                      <span className="text-xs text-white/50">vs last period</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Live Activity Feed */}
          <Card className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-blue-400 animate-pulse" />
                Live Activity Stream
                <Badge className="ml-auto bg-red-500 text-white animate-pulse">REAL-TIME</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {liveActivities.map((activity, i) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all duration-500 group cursor-pointer animate-slide-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center group-hover:scale-125 transition-all duration-500`}>
                        <Icon className={`w-5 h-5 ${activity.color}`} />
                      </div>
                      <div className={`absolute inset-0 ${activity.color} opacity-50 blur-lg group-hover:blur-xl transition-all duration-500`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        <span className="text-blue-300">{activity.user}</span> {activity.action} <span className="text-purple-300">{activity.client}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-emerald-300 font-semibold">{activity.value}</span>
                        <span className="text-xs text-white/40">•</span>
                        <span className="text-xs text-white/40">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* AI Predictions Panel */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Brain className="h-5 w-5 text-purple-400 animate-float" />
                AI Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiPredictions.map((pred, i) => {
                const Icon = pred.icon;
                const priorityColors = {
                  critical: 'from-red-500/20 to-pink-500/20 border-red-500/50',
                  high: 'from-orange-500/20 to-yellow-500/20 border-orange-500/50',
                  medium: 'from-blue-500/20 to-cyan-500/20 border-blue-500/50',
                  low: 'from-green-500/20 to-emerald-500/20 border-green-500/50'
                };
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-xl bg-gradient-to-br ${priorityColors[pred.priority as keyof typeof priorityColors]} backdrop-blur-sm border hover:scale-105 transition-all duration-500 cursor-pointer group animate-scale-in`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-0.5 group-hover:rotate-12 transition-transform duration-500" style={{ color: pred.priority === 'critical' ? '#ef4444' : pred.priority === 'high' ? '#f97316' : pred.priority === 'medium' ? '#3b82f6' : '#10b981' }} />
                      <div>
                        <p className="text-sm font-medium text-white mb-1">{pred.title}</p>
                        <p className="text-xs text-white/60">{pred.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/20 animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
              Team Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Sales Target</span>
                  <span className="text-white font-semibold">$3.5M / $4M</span>
                </div>
                <Progress value={87.5} className="h-3 bg-white/10" />
                <p className="text-xs text-emerald-300">87.5% achieved • On track to exceed</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Team Activity</span>
                  <span className="text-white font-semibold">892 / 1000</span>
                </div>
                <Progress value={89.2} className="h-3 bg-white/10" />
                <p className="text-xs text-blue-300">89.2% of daily goal • Excellent pace</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70">Customer Satisfaction</span>
                  <span className="text-white font-semibold">4.8 / 5.0</span>
                </div>
                <Progress value={96} className="h-3 bg-white/10" />
                <p className="text-xs text-purple-300">96% satisfaction rate • Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Chat Assistant */}
        <div className="fixed bottom-6 right-6 z-50 animate-scale-in">
          <Button 
            size="lg"
            className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-emerald-500 shadow-[0_0_40px_rgba(147,51,234,0.6)] hover:shadow-[0_0_60px_rgba(147,51,234,0.8)] hover:scale-110 transition-all duration-500 group relative overflow-hidden"
          >
            <MessageSquare className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-500 relative z-10" />
            <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', backgroundSize: '200% 100%' }} />
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-black animate-pulse" />
          </Button>
        </div>
      </div>
    </div>
  );
}
