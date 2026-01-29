import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  FileText, 
  Download,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    id: "executive-summary",
    label: "Executive Summary",
    description: "Complete business overview",
    icon: <FileText className="h-4 w-4" />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "sales-snapshot",
    label: "Sales Snapshot",
    description: "Revenue & deals today",
    icon: <Zap className="h-4 w-4" />,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "weekly-digest",
    label: "Weekly Digest",
    description: "7-day performance summary",
    icon: <Clock className="h-4 w-4" />,
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "ai-insights",
    label: "AI Insights",
    description: "Smart recommendations",
    icon: <Sparkles className="h-4 w-4" />,
    color: "from-amber-500 to-orange-500",
  },
];

export function QuickReportGenerator() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);

  const handleGenerate = async (actionId: string) => {
    setGenerating(actionId);
    setProgress(0);

    // Simulate report generation with progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 20 + 10;
      });
    }, 200);

    // Simulate completion
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setGenerating(null);
        setCompleted((prev) => [...prev, actionId]);
        toast.success("Report generated!", {
          description: "Your report is ready to download.",
          action: {
            label: "Download",
            onClick: () => toast.info("Downloading..."),
          },
        });
      }, 500);
    }, 1500);
  };

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Quick Reports</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generate instantly with one click
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            <Sparkles className="h-2.5 w-2.5 mr-1" />
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
                onClick={() => !isGenerating && handleGenerate(action.id)}
                disabled={isGenerating}
                className={cn(
                  "group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300",
                  "border border-border/50 hover:border-primary/30",
                  "bg-card/50 hover:bg-card",
                  "hover:shadow-lg hover:shadow-primary/5",
                  isGenerating && "pointer-events-none"
                )}
              >
                {/* Progress overlay */}
                {isGenerating && (
                  <div className="absolute inset-0 bg-primary/5">
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-300"
                      style={{ width: `${progress}%` }}
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
                    "shrink-0 p-2 rounded-lg text-white transition-transform duration-300 group-hover:scale-110",
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
                      <span className="font-medium text-sm truncate">
                        {action.label}
                      </span>
                      {isCompleted && (
                        <Badge variant="outline" className="text-[10px] text-green-600 border-green-200">
                          Ready
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {isGenerating ? `${Math.round(progress)}% complete` : action.description}
                    </p>
                  </div>

                  {!isGenerating && !isCompleted && (
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5" />
                  )}
                  
                  {isCompleted && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info("Downloading report...");
                      }}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
