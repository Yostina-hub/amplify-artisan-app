import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  Eye, 
  Clock,
  FileText,
  FileSpreadsheet,
  FileJson,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Share2,
  Copy,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { GeneratedReport } from "@/hooks/useReports";

interface RecentReportsProps {
  reports: GeneratedReport[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const formatIcons = {
  pdf: FileText,
  csv: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  json: FileJson,
};

const formatColors = {
  pdf: "text-red-500",
  csv: "text-green-500",
  xlsx: "text-green-600",
  json: "text-amber-500",
};

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-500/10",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    label: "Failed",
  },
  processing: {
    icon: Loader2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    label: "Processing",
  },
};

export function RecentReports({ reports, onRetry, onDelete, isLoading }: RecentReportsProps) {
  const handleDownload = (report: GeneratedReport) => {
    toast.success(`Downloading ${report.name}...`, {
      description: `Format: ${report.format.toUpperCase()} • Size: ${report.size}`,
    });
  };

  const handlePreview = (report: GeneratedReport) => {
    toast.info(`Opening preview for ${report.name}...`);
  };

  const handleShare = (report: GeneratedReport) => {
    toast.success("Share link copied to clipboard!");
  };

  const handleDuplicate = (report: GeneratedReport) => {
    toast.success(`Duplicating ${report.name}...`);
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/50">
      <CardHeader className="pb-3 bg-gradient-to-r from-muted/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Recent Reports</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {reports.length} report{reports.length !== 1 ? "s" : ""} generated
              </p>
            </div>
          </div>
          {reports.length > 0 && (
            <Button variant="outline" size="sm" className="text-xs gap-2">
              <Download className="h-3.5 w-3.5" />
              Export All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No reports yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Generate your first report using the templates above. One-click generation makes it easy!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[380px]">
            <div className="divide-y divide-border">
              {reports.map((report, index) => {
                const FormatIcon = formatIcons[report.format];
                const status = statusConfig[report.status];
                const StatusIcon = status.icon;

                return (
                  <div
                    key={report.id}
                    className={cn(
                      "group flex items-center gap-4 p-4 hover:bg-muted/50 transition-all duration-200",
                      index === 0 && "bg-primary/5"
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {/* Format icon with gradient background */}
                    <div className="shrink-0 relative">
                      <div className={cn(
                        "p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-110",
                        report.format === "pdf" && "bg-destructive/10",
                        report.format === "csv" && "bg-primary/10",
                        report.format === "xlsx" && "bg-primary/10",
                        report.format === "json" && "bg-accent"
                      )}>
                        <FormatIcon className={cn("h-5 w-5", formatColors[report.format])} />
                      </div>
                      {report.status === "processing" && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                      )}
                    </div>

                    {/* Report info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">
                          {report.name}
                        </h4>
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                          status.bg,
                          status.color
                        )}>
                          <StatusIcon 
                            className={cn(
                              "h-3 w-3",
                              report.status === "processing" && "animate-spin"
                            )} 
                          />
                          {status.label}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] font-normal h-5">
                          {report.type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(report.generatedAt), { addSuffix: true })}
                        </span>
                        {report.size !== "—" && (
                          <span className="text-[10px] text-muted-foreground">
                            • {report.size}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {report.status === "completed" && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handlePreview(report)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleDownload(report)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {report.status === "failed" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs gap-1.5"
                          onClick={() => onRetry(report.id)}
                        >
                          <Loader2 className="h-3 w-3" />
                          Retry
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleShare(report)}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(report)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete(report.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
