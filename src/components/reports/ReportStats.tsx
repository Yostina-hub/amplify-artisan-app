import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  FileText,
  Clock,
  Download,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stat {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
}

const stats: Stat[] = [
  {
    label: "Reports Generated",
    value: "1,247",
    change: "+12%",
    trend: "up",
    icon: <FileText className="h-4 w-4" />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    label: "Time Saved",
    value: "156hrs",
    change: "+28%",
    trend: "up",
    icon: <Clock className="h-4 w-4" />,
    color: "from-green-500 to-emerald-500",
  },
  {
    label: "Downloads",
    value: "3,892",
    change: "+8%",
    trend: "up",
    icon: <Download className="h-4 w-4" />,
    color: "from-violet-500 to-purple-500",
  },
  {
    label: "Active Users",
    value: "89",
    change: "-3%",
    trend: "down",
    icon: <Users className="h-4 w-4" />,
    color: "from-amber-500 to-orange-500",
  },
];

export function ReportStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={stat.label}
          className="group relative overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
        >
          {/* Gradient overlay on hover */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300",
            stat.color
          )} />

          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={cn(
                "p-2 rounded-lg text-white transition-transform duration-300 group-hover:scale-110",
                `bg-gradient-to-br ${stat.color}`
              )}>
                {stat.icon}
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                stat.trend === "up" 
                  ? "text-green-600 bg-green-500/10" 
                  : stat.trend === "down"
                  ? "text-red-600 bg-red-500/10"
                  : "text-muted-foreground bg-muted"
              )}>
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : stat.trend === "down" ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {stat.change}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">
                {stat.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
