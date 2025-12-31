import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Target, MessageSquare, HeadphonesIcon, BarChart3 } from "lucide-react";

interface AnalyticsKPICardProps {
  title: string;
  value: number;
  changePercent: number;
  trend: 'up' | 'down';
  category?: string;
  format?: string;
  unit?: string | null;
}

const categoryIcons: Record<string, any> = {
  users: Users,
  sales: Target,
  social: MessageSquare,
  support: HeadphonesIcon,
  marketing: BarChart3,
  general: BarChart3,
};

const categoryColors: Record<string, string> = {
  users: 'from-blue-500 to-cyan-500',
  sales: 'from-green-500 to-emerald-500',
  social: 'from-purple-500 to-violet-500',
  support: 'from-orange-500 to-amber-500',
  marketing: 'from-pink-500 to-rose-500',
  general: 'from-primary to-accent',
};

export function AnalyticsKPICard({ 
  title, 
  value, 
  changePercent, 
  trend, 
  category = 'general',
  format = 'number',
  unit
}: AnalyticsKPICardProps) {
  const Icon = categoryIcons[category] || BarChart3;
  const colorClass = categoryColors[category] || categoryColors.general;
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

  const formatValue = () => {
    if (format === 'percentage') {
      return `${value.toFixed(1)}${unit || '%'}`;
    }
    if (format === 'currency') {
      return `${unit || '$'}${value.toLocaleString()}`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  return (
    <Card className="group relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Category indicator */}
      <div className={`absolute top-0 right-0 h-1 w-16 bg-gradient-to-r ${colorClass} opacity-60`} />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center group-hover:scale-110 transition-all shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold group-hover:scale-105 transition-transform origin-left">
          {formatValue()}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            trend === 'up' 
              ? 'bg-success/10 text-success' 
              : 'bg-destructive/10 text-destructive'
          }`}>
            <TrendIcon className="h-3 w-3" />
            {Math.abs(changePercent)}%
          </div>
          <span className="text-xs text-muted-foreground">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
}
