import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: "up" | "down";
}

export function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;
  
  return (
    <Card className="group relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
          <Icon className="h-5 w-5 text-primary group-hover:text-accent transition-colors duration-500" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          {value}
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <TrendIcon className={`h-4 w-4 ${trend === 'up' ? 'text-success' : 'text-destructive'}`} />
          <p className={`text-sm font-medium ${trend === 'up' ? 'text-success' : 'text-destructive'}`}>
            {change}
          </p>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}
