import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ExternalLink, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface IntegrationLog {
  id: string;
  integration_id: string;
  request_method: string | null;
  request_url: string | null;
  request_headers: any;
  request_body: any;
  response_status: number | null;
  response_body: any;
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

interface IntegrationLogsProps {
  integrationId: string;
}

export function IntegrationLogs({ integrationId }: IntegrationLogsProps) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['integration-logs', integrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_integration_logs')
        .select('*')
        .eq('integration_id', integrationId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as IntegrationLog[];
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const getStatusBadge = (status: number | null) => {
    if (!status) return <Badge variant="secondary">N/A</Badge>;
    
    if (status >= 200 && status < 300) {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      );
    }
    if (status >= 400) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          {status}
        </Badge>
      );
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Activity Logs</h3>
        <p className="text-sm text-muted-foreground">
          Recent API calls and responses (last 100 entries)
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : !logs || logs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No activity logs yet
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">
                  {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{log.request_method || 'N/A'}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate" title={log.request_url || ''}>
                  {log.request_url || 'N/A'}
                </TableCell>
                <TableCell>{getStatusBadge(log.response_status)}</TableCell>
                <TableCell>
                  {log.execution_time_ms ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {log.execution_time_ms}ms
                    </div>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Request Details</DialogTitle>
                        <DialogDescription>
                          {format(new Date(log.created_at), 'PPpp')}
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-[60vh]">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Request</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Method:</span>{' '}
                                <Badge variant="outline">{log.request_method}</Badge>
                              </div>
                              <div>
                                <span className="font-medium">URL:</span>{' '}
                                <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                                  {log.request_url}
                                </code>
                              </div>
                              {log.request_headers && (
                                <div>
                                  <span className="font-medium">Headers:</span>
                                  <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
                                    {JSON.stringify(log.request_headers, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.request_body && (
                                <div>
                                  <span className="font-medium">Body:</span>
                                  <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
                                    {JSON.stringify(log.request_body, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Response</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Status:</span>{' '}
                                {getStatusBadge(log.response_status)}
                              </div>
                              {log.execution_time_ms && (
                                <div>
                                  <span className="font-medium">Execution Time:</span>{' '}
                                  {log.execution_time_ms}ms
                                </div>
                              )}
                              {log.error_message && (
                                <div>
                                  <span className="font-medium text-destructive">Error:</span>
                                  <pre className="bg-destructive/10 text-destructive p-2 rounded text-xs mt-1">
                                    {log.error_message}
                                  </pre>
                                </div>
                              )}
                              {log.response_body && (
                                <div>
                                  <span className="font-medium">Body:</span>
                                  <pre className="bg-muted p-2 rounded text-xs mt-1 overflow-x-auto">
                                    {JSON.stringify(log.response_body, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
