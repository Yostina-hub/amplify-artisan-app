import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Users, Award, Zap, Target, ArrowUpRight, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface MetricData {
  label: string;
  value: string;
  increase: string;
  icon: any;
  color: string;
  progress: number;
}

const metrics: MetricData[] = [
  { label: "Revenue", value: "$45,231", increase: "+125%", icon: DollarSign, color: "from-green-500 to-emerald-600", progress: 85 },
  { label: "Followers", value: "125K", increase: "+85%", icon: Users, color: "from-blue-500 to-cyan-600", progress: 92 },
  { label: "Engagement", value: "18.5%", increase: "+45%", icon: TrendingUp, color: "from-purple-500 to-pink-600", progress: 78 },
  { label: "Market Rank", value: "#3", increase: "+12 spots", icon: Award, color: "from-orange-500 to-red-600", progress: 95 },
];

const journeySteps = [
  { stage: "Starting Out", status: "completed", icon: Target },
  { stage: "Growing Fast", status: "completed", icon: TrendingUp },
  { stage: "Market Leader", status: "current", icon: Award },
  { stage: "Industry Pioneer", status: "upcoming", icon: Zap },
];

export function CompanyGrowthShowcase() {
  const [activeMetric, setActiveMetric] = useState(0);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMetric((prev) => (prev + 1) % metrics.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Growth Metrics Visualization */}
      <Card className="relative overflow-hidden border-2 hover:shadow-2xl transition-all duration-500 animate-in fade-in-50 scale-in duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5" />
        
        {/* Animated background waves */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent" style={{ animation: 'wave 3s ease-in-out 0s infinite' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary" style={{ animation: 'wave 3s ease-in-out 1s infinite' }} />
        </div>

        <CardContent className="relative z-10 p-8">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-in slide-in-from-top-4 duration-500">
              Your Success Story 📈
            </h3>
            <p className="text-muted-foreground mt-2 animate-in fade-in-50 duration-500 delay-100">
              Watch your empire grow in real-time
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, idx) => {
              const Icon = metric.icon;
              const isActive = idx === activeMetric;
              
              return (
                <div
                  key={metric.label}
                  className={`relative group cursor-pointer transition-all duration-500 hover:scale-110 animate-in fade-in-50 duration-500`}
                  style={{ animationDelay: `${idx * 150}ms` }}
                  onClick={() => setActiveMetric(idx)}
                >
                  <div
                    className={`p-6 rounded-2xl bg-gradient-to-br ${metric.color} shadow-xl transition-all duration-500 ${
                      isActive ? 'scale-110 shadow-2xl ring-4 ring-primary/50' : 'scale-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Icon className="w-8 h-8 text-white" />
                      <div className={`text-white text-right ${isActive ? 'animate-pulse' : ''}`}>
                        <div className="text-xs opacity-90">{metric.label}</div>
                        <div className="text-2xl font-bold">{metric.value}</div>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-white/20 rounded-full h-2 mb-2 overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${isActive ? metric.progress : 0}%`,
                          transition: isActive ? 'width 1s ease-out' : 'none'
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-1 text-white text-sm font-semibold">
                      <ArrowUpRight className="w-4 h-4" />
                      {metric.increase} this month
                    </div>
                  </div>

                  {/* Glow effect */}
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-2xl blur-2xl opacity-50 animate-pulse -z-10"
                      style={{
                        background: `linear-gradient(to bottom right, ${metric.color.split(' ')[0].replace('from-', '')}, ${metric.color.split(' ')[1].replace('to-', '')})`
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Journey Path */}
          <div className="relative py-8">
            <h4 className="text-xl font-bold text-center mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Your Journey to Success
            </h4>
            
            <div className="relative flex items-center justify-between">
              {/* Progress line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-success via-primary to-muted -translate-y-1/2 rounded-full" />
              
              {journeySteps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';
                
                return (
                  <div
                    key={step.stage}
                    className="relative flex flex-col items-center z-10 animate-in fade-in-50 duration-500"
                    style={{ animationDelay: `${idx * 200}ms` }}
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isCompleted
                          ? 'bg-gradient-to-br from-success to-green-600 shadow-lg shadow-success/50'
                          : isCurrent
                          ? 'bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/50 animate-pulse ring-4 ring-primary/30 scale-125'
                          : 'bg-muted border-2 border-muted-foreground/30'
                      }`}
                    >
                      <Icon className={`w-8 h-8 ${isCompleted || isCurrent ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    
                    <div className={`mt-4 text-center transition-all duration-500 ${isCurrent ? 'scale-110' : ''}`}>
                      <div className={`text-sm font-semibold ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                        {step.stage}
                      </div>
                      {isCurrent && (
                        <div className="text-xs text-primary mt-1 animate-pulse">
                          You are here!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How to Use Guide */}
          <div className="mt-8 text-center">
            <Button
              onClick={() => setShowGuide(!showGuide)}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              {showGuide ? 'Hide' : 'Show'} Platform Guide
            </Button>
          </div>
        </CardContent>

        <style>{`
          @keyframes wave {
            0% {
              transform: translateX(-100%) skewX(-15deg);
            }
            100% {
              transform: translateX(100%) skewX(-15deg);
            }
          }

          .animate-wave {
            animation: wave 3s ease-in-out infinite;
          }
        `}</style>
      </Card>

      {/* Interactive Guide */}
      {showGuide && (
        <Card className="border-primary animate-in fade-in-50 slide-in-from-top-4 duration-500 shadow-xl">
          <CardContent className="p-8">
            <h4 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Master Your Platform
            </h4>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="composer" className="border-b border-primary/20">
                <AccordionTrigger className="hover:text-primary">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                      1
                    </div>
                    <span className="text-lg font-semibold">Create Amazing Content</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6 text-muted-foreground">
                  <p className="mb-3">Use the <span className="font-semibold text-primary">Composer</span> to craft engaging posts across all your social platforms simultaneously.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Schedule posts for optimal engagement times</li>
                    <li>Add media, hashtags, and mentions</li>
                    <li>Preview how your content looks on each platform</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="analytics" className="border-b border-primary/20">
                <AccordionTrigger className="hover:text-primary">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
                      2
                    </div>
                    <span className="text-lg font-semibold">Track Your Growth</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6 text-muted-foreground">
                  <p className="mb-3">Monitor your success with <span className="font-semibold text-primary">Analytics</span> and see real-time metrics.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>View follower growth trends</li>
                    <li>Analyze engagement rates per post</li>
                    <li>Compare performance across platforms</li>
                    <li>Export reports for stakeholders</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="campaigns" className="border-b border-primary/20">
                <AccordionTrigger className="hover:text-primary">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold">
                      3
                    </div>
                    <span className="text-lg font-semibold">Launch Campaigns</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6 text-muted-foreground">
                  <p className="mb-3">Create powerful <span className="font-semibold text-primary">Ad Campaigns</span> to reach your target audience.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Set campaign budgets and timelines</li>
                    <li>Define precise target demographics</li>
                    <li>A/B test different ad creatives</li>
                    <li>Track ROI and conversion rates</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="engage">
                <AccordionTrigger className="hover:text-primary">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-sm font-bold">
                      4
                    </div>
                    <span className="text-lg font-semibold">Engage Your Audience</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-6 text-muted-foreground">
                  <p className="mb-3">Use <span className="font-semibold text-primary">Brand Monitoring</span> and <span className="font-semibold text-primary">Social Listening</span> to stay connected.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Respond to comments and messages instantly</li>
                    <li>Monitor brand mentions across platforms</li>
                    <li>Track competitor activities</li>
                    <li>Identify trending topics in your industry</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
