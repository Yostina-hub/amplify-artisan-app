import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Insight {
  type: "success" | "warning" | "info" | "danger";
  title: string;
  description: string;
  confidence: number;
  metric?: string;
  trend?: "up" | "down" | "stable";
}

interface PredictiveInsightsProps {
  insights: Insight[];
  title?: string;
}

export function PredictiveInsights({ insights, title = "AI Insights" }: PredictiveInsightsProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case "danger":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Brain className="h-5 w-5 text-primary" />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />;
    return null;
  };

  const getVariant = (type: string) => {
    switch (type) {
      case "success":
        return "default";
      case "warning":
        return "secondary";
      case "danger":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-mesh opacity-5" />
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 space-y-4">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-300 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {getIcon(insight.type)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    {insight.trend && getTrendIcon(insight.trend)}
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  {insight.metric && (
                    <p className="text-xs font-mono text-primary">{insight.metric}</p>
                  )}
                </div>
              </div>
              <Badge variant={getVariant(insight.type)} className="shrink-0">
                {Math.round(insight.confidence * 100)}%
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Confidence</span>
                <span>{Math.round(insight.confidence * 100)}%</span>
              </div>
              <Progress value={insight.confidence * 100} className="h-1" />
            </div>
          </div>
        ))}
        {insights.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Analyzing data to generate insights...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
