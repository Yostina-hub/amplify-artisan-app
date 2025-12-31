import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ChevronRight, CheckCircle2, X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  reason?: string;
  suggested_action?: string;
  expected_impact?: string;
  priority: string;
  category: string;
}

interface AnalyticsRecommendationsProps {
  recommendations: Recommendation[];
}

const priorityColors: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-success/10 text-success border-success/20',
};

export function AnalyticsRecommendations({ recommendations }: AnalyticsRecommendationsProps) {
  const queryClient = useQueryClient();

  const handleAction = async (id: string) => {
    const { error } = await supabase
      .from('analytics_recommendations')
      .update({ status: 'actioned', actioned_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to mark as actioned');
      return;
    }
    
    toast.success('Recommendation marked as actioned');
    queryClient.invalidateQueries({ queryKey: ['analytics-recommendations'] });
  };

  const handleDismiss = async (id: string) => {
    const { error } = await supabase
      .from('analytics_recommendations')
      .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to dismiss');
      return;
    }
    
    toast.success('Recommendation dismissed');
    queryClient.invalidateQueries({ queryKey: ['analytics-recommendations'] });
  };

  // Mock data if no recommendations
  const displayRecommendations = recommendations.length > 0 ? recommendations : [
    {
      id: '1',
      title: 'Increase email engagement',
      description: 'Email open rates have dropped 15% this week. Consider A/B testing subject lines.',
      reason: 'Open rate decreased from 25% to 21%',
      suggested_action: 'Run A/B test on next 3 campaigns',
      expected_impact: '+10-15% open rate improvement',
      priority: 'high',
      category: 'marketing'
    },
    {
      id: '2',
      title: 'Follow up on stale leads',
      description: '23 leads have not been contacted in over 7 days.',
      reason: 'Lead response time affects conversion',
      suggested_action: 'Assign leads to sales team for immediate follow-up',
      expected_impact: '+5-8% conversion rate',
      priority: 'medium',
      category: 'sales'
    },
    {
      id: '3',
      title: 'Optimize peak posting times',
      description: 'Social engagement is highest between 10-11 AM. Schedule more posts during this window.',
      reason: 'Analysis of 30-day engagement data',
      suggested_action: 'Reschedule 5 upcoming posts',
      expected_impact: '+20% engagement',
      priority: 'low',
      category: 'social'
    }
  ];

  return (
    <Card className="border-2 hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Actionable insights based on your data</CardDescription>
        </div>
        <Button variant="ghost" size="sm">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayRecommendations.map((rec) => (
          <div 
            key={rec.id} 
            className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {rec.title}
                  </h4>
                  <Badge variant="outline" className={priorityColors[rec.priority]}>
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
                {rec.expected_impact && (
                  <div className="flex items-center gap-1 text-xs text-success">
                    <ArrowRight className="h-3 w-3" />
                    Expected: {rec.expected_impact}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-success"
                  onClick={() => handleAction(rec.id)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDismiss(rec.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {displayRecommendations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No recommendations at this time</p>
            <p className="text-sm">Check back later for insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
