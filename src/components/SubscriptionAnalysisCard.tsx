import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Users, Clock, CheckCircle2 } from "lucide-react";

interface AnalysisData {
  usage_limits?: Record<string, any>;
  feature_config?: Record<string, any>;
  best_practices?: string[];
  monitoring_recommendations?: string[];
  initial_report?: string;
}

interface SubscriptionAnalysisCardProps {
  analysis?: AnalysisData;
  analyzedAt?: string;
  onRefresh?: () => void;
}

export const SubscriptionAnalysisCard = ({
  analysis,
  analyzedAt,
  onRefresh,
}: SubscriptionAnalysisCardProps) => {
  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Subscription Analysis
          </CardTitle>
          <CardDescription>
            No analysis available yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRefresh} variant="outline">
            Generate Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Subscription Analysis
          </CardTitle>
          {analyzedAt && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(analyzedAt).toLocaleDateString()}
            </Badge>
          )}
        </div>
        <CardDescription>
          Powered by AI - Automatic feature and usage recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysis.initial_report && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Executive Summary
            </h3>
            <p className="text-sm text-muted-foreground">{analysis.initial_report}</p>
          </div>
        )}

        {analysis.usage_limits && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usage Limits
            </h3>
            <div className="grid gap-2">
              {Object.entries(analysis.usage_limits).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-center p-2 bg-muted rounded-md text-sm"
                >
                  <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                  <Badge variant="outline">{String(value)}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.best_practices && analysis.best_practices.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Best Practices
            </h3>
            <ul className="space-y-2">
              {analysis.best_practices.map((practice, index) => (
                <li key={index} className="flex gap-2 text-sm">
                  <span className="text-primary mt-1">•</span>
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.monitoring_recommendations && analysis.monitoring_recommendations.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Monitoring Recommendations</h3>
            <ul className="space-y-2">
              {analysis.monitoring_recommendations.map((rec, index) => (
                <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm" className="w-full">
            Refresh Analysis
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
