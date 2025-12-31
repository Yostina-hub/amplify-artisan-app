import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ChevronRight, CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  current_value?: number;
  threshold_value?: number;
  status: string;
  created_at: string;
}

interface AnalyticsAlertsProps {
  alerts: Alert[];
}

const severityConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  critical: { icon: AlertCircle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  warning: { icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/10' },
  info: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
};

export function AnalyticsAlerts({ alerts }: AnalyticsAlertsProps) {
  const queryClient = useQueryClient();

  const handleAcknowledge = async (id: string) => {
    const { error } = await supabase
      .from('analytics_alerts')
      .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to acknowledge alert');
      return;
    }
    
    toast.success('Alert acknowledged');
    queryClient.invalidateQueries({ queryKey: ['analytics-alerts'] });
  };

  const handleResolve = async (id: string) => {
    const { error } = await supabase
      .from('analytics_alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to resolve alert');
      return;
    }
    
    toast.success('Alert resolved');
    queryClient.invalidateQueries({ queryKey: ['analytics-alerts'] });
  };

  // Mock data if no alerts
  const displayAlerts = alerts.length > 0 ? alerts : [
    {
      id: '1',
      title: 'Engagement Rate Drop',
      message: 'Social media engagement rate dropped below 3% threshold',
      severity: 'warning',
      current_value: 2.1,
      threshold_value: 3.0,
      status: 'active',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      title: 'Support Ticket Spike',
      message: 'Unusual increase in support tickets detected (150% above average)',
      severity: 'critical',
      current_value: 45,
      threshold_value: 18,
      status: 'active',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      title: 'Campaign Budget Alert',
      message: 'Ad campaign "Summer Sale" reached 80% of budget',
      severity: 'info',
      current_value: 800,
      threshold_value: 1000,
      status: 'active',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    }
  ];

  return (
    <Card className="border-2 hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Active Alerts
            {displayAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">{displayAlerts.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Threshold-based notifications</CardDescription>
        </div>
        <Button variant="ghost" size="sm">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayAlerts.map((alert) => {
          const config = severityConfig[alert.severity] || severityConfig.info;
          const Icon = config.icon;
          
          return (
            <div 
              key={alert.id} 
              className={`p-4 rounded-lg border ${config.bgColor} group transition-colors`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${config.bgColor}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-sm truncate">{alert.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                  {alert.current_value !== undefined && alert.threshold_value !== undefined && (
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className={config.color}>Current: {alert.current_value}</span>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-muted-foreground">Threshold: {alert.threshold_value}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleAcknowledge(alert.id)}
                >
                  Acknowledge
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleResolve(alert.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Resolve
                </Button>
              </div>
            </div>
          );
        })}
        
        {displayAlerts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success opacity-40" />
            <p>All clear!</p>
            <p className="text-sm">No active alerts at this time</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
