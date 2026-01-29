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
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface RecentReport {
  id: string;
  name: string;
  type: string;
  format: "pdf" | "csv" | "xlsx" | "json";
  status: "completed" | "failed" | "processing";
  generatedAt: Date;
  size: string;
}

const recentReports: RecentReport[] = [
  {
    id: "1",
    name: "Q4 Sales Performance",
    type: "Sales",
    format: "pdf",
    status: "completed",
    generatedAt: new Date(Date.now() - 1000 * 60 * 5),
    size: "2.4 MB",
  },
  {
    id: "2",
    name: "Monthly Revenue Summary",
    type: "Finance",
    format: "xlsx",
    status: "completed",
    generatedAt: new Date(Date.now() - 1000 * 60 * 30),
    size: "1.8 MB",
  },
  {
    id: "3",
    name: "Customer Acquisition Report",
    type: "Marketing",
    format: "csv",
    status: "processing",
    generatedAt: new Date(Date.now() - 1000 * 60 * 2),
    size: "—",
  },
  {
    id: "4",
    name: "Lead Pipeline Analysis",
    type: "CRM",
    format: "pdf",
    status: "completed",
    generatedAt: new Date(Date.now() - 1000 * 60 * 60),
    size: "3.1 MB",
  },
  {
    id: "5",
    name: "Product Inventory Status",
    type: "Inventory",
    format: "json",
    status: "failed",
    generatedAt: new Date(Date.now() - 1000 * 60 * 45),
    size: "—",
  },
  {
    id: "6",
    name: "Team Activity Summary",
    type: "HR",
    format: "pdf",
    status: "completed",
    generatedAt: new Date(Date.now() - 1000 * 60 * 120),
    size: "1.2 MB",
  },
];

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

export function RecentReports() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">Recent Reports</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            View all
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[340px]">
          <div className="divide-y divide-border">
            {recentReports.map((report) => {
              const FormatIcon = formatIcons[report.format];
              const status = statusConfig[report.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={report.id}
                  className="group flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Format icon */}
                  <div className="shrink-0">
                    <FormatIcon className={cn("h-8 w-8", formatColors[report.format])} />
                  </div>

                  {/* Report info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">
                        {report.name}
                      </h4>
                      <StatusIcon 
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          status.color,
                          report.status === "processing" && "animate-spin"
                        )} 
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {report.type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(report.generatedAt, { addSuffix: true })}
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
                          className="h-8 w-8"
                          onClick={() => toast.info("Opening preview...")}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => toast.success("Downloading report...")}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    {report.status === "failed" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => toast.info("Retrying report generation...")}
                      >
                        Retry
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Share</DropdownMenuItem>
                        <DropdownMenuItem>Schedule</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
