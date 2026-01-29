import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Target,
  Users,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  type: "opportunity" | "warning" | "success" | "info";
  title: string;
  description: string;
  metric?: string;
  action?: string;
  priority: "high" | "medium" | "low";
}

const insights: Insight[] = [
  {
    id: "1",
    type: "opportunity",
    title: "Revenue spike potential",
    description: "Q4 patterns suggest 23% revenue increase opportunity in the next 30 days.",
    metric: "+23%",
    action: "View forecast",
    priority: "high",
  },
  {
    id: "2",
    type: "warning",
    title: "Lead response time declining",
    description: "Average response time increased by 2.5 hours compared to last week.",
    metric: "+2.5h",
    action: "Investigate",
    priority: "high",
  },
  {
    id: "3",
    type: "success",
    title: "Conversion rate improved",
    description: "Lead-to-customer conversion is up 15% this month.",
    metric: "+15%",
    action: "See details",
    priority: "medium",
  },
  {
    id: "4",
    type: "info",
    title: "Top performer identified",
    description: "Sales rep Sarah exceeded quota by 140% this quarter.",
    metric: "140%",
    action: "View profile",
    priority: "low",
  },
];

const insightConfig = {
  opportunity: {
    icon: Lightbulb,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    gradient: "from-amber-500/10 to-orange-500/5",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    gradient: "from-red-500/10 to-rose-500/5",
  },
  success: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    gradient: "from-green-500/10 to-emerald-500/5",
  },
  info: {
    icon: Target,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    gradient: "from-blue-500/10 to-cyan-500/5",
  },
};

export function ReportInsights() {
  return (
    <Card className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5 animate-pulse" />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Insights</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time business intelligence
              </p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0">
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        {insights.map((insight) => {
          const config = insightConfig[insight.type];
          const Icon = config.icon;

          return (
            <div
              key={insight.id}
              className={cn(
                "group relative overflow-hidden rounded-xl p-4 transition-all duration-300",
                "border hover:shadow-md cursor-pointer",
                config.border,
                "bg-gradient-to-r",
                config.gradient
              )}
            >
              {/* Priority indicator */}
              <div className={cn(
                "absolute top-0 right-0 w-12 h-12",
                insight.priority === "high" && "bg-gradient-to-bl from-red-500/20",
                insight.priority === "medium" && "bg-gradient-to-bl from-amber-500/20",
                insight.priority === "low" && "bg-gradient-to-bl from-green-500/20"
              )} />

              <div className="flex items-start gap-3">
                <div className={cn(
                  "shrink-0 p-2 rounded-lg transition-transform duration-300 group-hover:scale-110",
                  config.bg
                )}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">
                      {insight.title}
                    </h4>
                    {insight.metric && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] font-semibold shrink-0",
                          insight.type === "warning" ? "text-red-600 border-red-200" :
                          insight.type === "success" ? "text-green-600 border-green-200" :
                          "text-primary border-primary/20"
                        )}
                      >
                        {insight.metric}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {insight.description}
                  </p>
                </div>

                {insight.action && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="shrink-0 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {insight.action}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <Button variant="outline" className="w-full mt-2" size="sm">
          <Sparkles className="h-3.5 w-3.5 mr-2" />
          Generate Full AI Analysis
        </Button>
      </CardContent>
    </Card>
  );
}
