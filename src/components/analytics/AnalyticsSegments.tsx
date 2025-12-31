import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, ChevronRight, Users, TrendingUp, Filter, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

interface Segment {
  id: string;
  name: string;
  description?: string | null;
  segment_type: string;
  member_count: number | null;
  value_metrics?: any;
  rules?: any;
}

interface AnalyticsSegmentsProps {
  segments: Segment[];
}

export function AnalyticsSegments({ segments }: AnalyticsSegmentsProps) {
  const navigate = useNavigate();

  // Mock data if no segments
  const displaySegments = segments.length > 0 ? segments : [
    {
      id: '1',
      name: 'High-Value Customers',
      description: 'Customers with lifetime value > $1000',
      segment_type: 'rule_based',
      member_count: 234,
      value_metrics: { avg_order: 150, total_revenue: 35100 }
    },
    {
      id: '2',
      name: 'Active Engagers',
      description: 'Users who engaged 5+ times in last 30 days',
      segment_type: 'rule_based',
      member_count: 1256,
      value_metrics: { engagement_rate: 8.5, avg_session: 12 }
    },
    {
      id: '3',
      name: 'At-Risk Leads',
      description: 'Leads with no activity in 14+ days',
      segment_type: 'rule_based',
      member_count: 89,
      value_metrics: { churn_risk: 75, last_contact_days: 18 }
    },
    {
      id: '4',
      name: 'Newsletter Subscribers',
      description: 'Opted-in for email communications',
      segment_type: 'rule_based',
      member_count: 5678,
      value_metrics: { open_rate: 22, click_rate: 3.5 }
    }
  ];

  const totalMembers = displaySegments.reduce((sum, s) => sum + s.member_count, 0);

  return (
    <Card className="border-2 hover:shadow-lg transition-all">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Customer Segments
          </CardTitle>
          <CardDescription>
            {displaySegments.length} segments • {totalMembers.toLocaleString()} total members
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/analytics/segments')}>
            <Filter className="h-4 w-4 mr-2" />
            Manage
          </Button>
          <Button size="sm" onClick={() => navigate('/analytics/segments/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Segment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {displaySegments.map((segment) => {
            const percentage = totalMembers > 0 ? (segment.member_count / totalMembers) * 100 : 0;
            
            return (
              <div 
                key={segment.id} 
                className="p-4 rounded-lg border bg-card hover:bg-accent/5 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/analytics/segments/${segment.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {segment.name}
                    </h4>
                    {segment.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {segment.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {segment.segment_type === 'rule_based' ? 'Rules' : 'ML'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      Members
                    </span>
                    <span className="font-medium">{segment.member_count.toLocaleString()}</span>
                  </div>
                  
                  <Progress value={percentage} className="h-1.5" />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(1)}% of total</span>
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {displaySegments.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No segments created yet</p>
            <p className="text-sm mb-4">Create segments to group and analyze your audience</p>
            <Button onClick={() => navigate('/analytics/segments/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Segment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
