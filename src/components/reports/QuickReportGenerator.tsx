import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  FileText, 
  Download,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  type: string;
}

const quickActions: QuickAction[] = [
  {
    id: "executive-summary",
    label: "Executive Summary",
    description: "Complete business overview",
    icon: <FileText className="h-4 w-4" />,
    color: "from-blue-500 to-cyan-500",
    type: "Executive",
  },
  {
    id: "sales-snapshot",
    label: "Sales Snapshot",
    description: "Revenue & deals today",
    icon: <Zap className="h-4 w-4" />,
    color: "from-green-500 to-emerald-500",
    type: "Sales",
  },
  {
    id: "weekly-digest",
    label: "Weekly Digest",
    description: "7-day performance summary",
    icon: <Clock className="h-4 w-4" />,
    color: "from-violet-500 to-purple-500",
    type: "Summary",
  },
  {
    id: "ai-insights",
    label: "AI Insights",
    description: "Smart recommendations",
    icon: <Sparkles className="h-4 w-4" />,
    color: "from-amber-500 to-orange-500",
    type: "AI",
  },
];

interface QuickReportGeneratorProps {
  onGenerate?: (
    templateId: string,
    name: string,
    type: string,
    format: "pdf" | "csv" | "xlsx" | "json"
  ) => Promise<any>;
}

export function QuickReportGenerator({ onGenerate }: QuickReportGeneratorProps) {
  const [generating, setGenerating] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);

  const handleGenerate = async (action: QuickAction) => {
    if (generating) return;
    
    setGenerating(action.id);
    setProgress(0);

    // Animate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 20 + 10;
      });
    }, 200);

    try {
      if (onGenerate) {
        await onGenerate(action.id, action.label, action.type, "pdf");
      } else {
        // Fallback simulation
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      clearInterval(interval);
      setProgress(100);
      
      setTimeout(() => {
        setGenerating(null);
        setCompleted((prev) => [...prev, action.id]);
        toast.success(`${action.label} generated!`, {
          description: "Your report is ready to download.",
          action: {
            label: "Download",
            onClick: () => toast.info("Downloading..."),
          },
        });
      }, 300);
    } catch (error) {
      clearInterval(interval);
      setGenerating(null);
      toast.error("Failed to generate report");
    }
  };

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Quick Reports</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate instantly with one click
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Sparkles className="h-2.5 w-2.5" />
            AI-Powered
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative pt-4">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const isGenerating = generating === action.id;
            const isCompleted = completed.includes(action.id);

            return (
              <button
                key={action.id}
                onClick={() => !isGenerating && handleGenerate(action)}
                disabled={isGenerating}
                className={cn(
                  "group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300",
                  "border border-border/50 hover:border-primary/30",
                  "bg-card/50 hover:bg-card",
                  "hover:shadow-lg hover:shadow-primary/5",
                  "hover:-translate-y-0.5",
                  isGenerating && "pointer-events-none"
                )}
              >
                {/* Progress overlay */}
                {isGenerating && (
                  <div className="absolute inset-0 bg-primary/5">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/20 to-primary/10 transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                )}

                {/* Gradient hover effect */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                  action.color
                )} />

                <div className="relative flex items-start gap-3">
                  <div className={cn(
                    "shrink-0 p-2.5 rounded-xl text-white transition-all duration-300 group-hover:scale-110 shadow-lg",
                    `bg-gradient-to-br ${action.color}`
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isGenerating ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      action.icon
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">
                        {action.label}
                      </span>
                  {isCompleted && (
                        <Badge variant="outline" className="text-[10px] border-primary/30 bg-primary/5 text-primary">
                          Ready
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {isGenerating ? `${Math.round(Math.min(progress, 100))}% complete` : action.description}
                    </p>
                  </div>

                  {!isGenerating && !isCompleted && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 mt-1" />
                  )}
                  
                  {isCompleted && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 shrink-0 hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info("Downloading report...");
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Additional actions */}
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs gap-2">
            <BarChart3 className="h-3.5 w-3.5" />
            Custom Report
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            Scheduled
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
