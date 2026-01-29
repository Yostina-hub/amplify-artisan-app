import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Eye, 
  Zap, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  FileText,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReportCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  lastGenerated?: string;
  isPopular?: boolean;
  isNew?: boolean;
  onGenerate: () => void;
  onPreview?: () => void;
  gradient: string;
}

export function ReportCard({
  id,
  title,
  description,
  icon,
  category,
  trend,
  trendValue,
  lastGenerated,
  isPopular,
  isNew,
  onGenerate,
  onPreview,
  gradient,
}: ReportCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate();
      toast.success(`${title} generated successfully!`, {
        description: "Your report is ready to download.",
        action: {
          label: "Download",
          onClick: () => toast.info("Downloading report..."),
        },
      });
    } catch (error) {
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden border-border/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1",
        isHovered && "ring-2 ring-primary/20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient background overlay */}
      <div 
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          gradient
        )} 
      />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-[-2px] rounded-xl bg-gradient-to-r from-primary/50 via-primary/20 to-primary/50 blur-sm animate-pulse" />
      </div>

      <CardContent className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl transition-all duration-300",
            "bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110"
          )}>
            {icon}
          </div>
          
          <div className="flex items-center gap-1.5">
            {isNew && (
              <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 text-[10px] px-2 py-0.5">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                NEW
              </Badge>
            )}
            {isPopular && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                <Zap className="h-2.5 w-2.5 mr-1" />
                Popular
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
              {title}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <Badge variant="outline" className="text-[10px] font-normal">
            {category}
          </Badge>
          {trend && trendValue && (
            <div className={cn("flex items-center gap-1", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span className="font-medium">{trendValue}</span>
            </div>
          )}
        </div>

        {/* Last generated */}
        {lastGenerated && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-4">
            <Clock className="h-3 w-3" />
            <span>Last generated: {lastGenerated}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              "flex-1 h-9 text-xs font-medium transition-all duration-300",
              "bg-primary hover:bg-primary/90",
              isGenerating && "animate-pulse"
            )}
          >
            {isGenerating ? (
              <>
                <div className="h-3 w-3 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-3 w-3 mr-1.5" />
                One-Click Generate
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 shrink-0"
            onClick={onPreview}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
