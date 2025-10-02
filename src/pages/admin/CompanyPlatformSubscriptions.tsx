import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, X, Clock, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import * as Icons from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Company {
  id: string;
  name: string;
}

interface Platform {
  id: string;
  name: string;
  display_name: string;
  icon_name: string | null;
}

interface Subscription {
  id: string;
  platform_id: string;
  company_id: string;
  is_active: boolean;
  status: string;
  subscribed_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  companies?: { name: string };
  social_platforms?: { display_name: string; icon_name: string | null };
}

export default function CompanyPlatformSubscriptions() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Subscription | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    fetchPendingRequests();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchSubscriptions(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const fetchData = async () => {
    try {
      const [companiesRes, platformsRes] = await Promise.all([
        supabase.from("companies").select("id, name").eq("status", "approved").order("name"),
        supabase.from("social_platforms").select("*").eq("is_active", true).order("display_name"),
      ]);

      if (companiesRes.error) throw companiesRes.error;
      if (platformsRes.error) throw platformsRes.error;

      setCompanies(companiesRes.data || []);
      setPlatforms(platformsRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("company_platform_subscriptions")
        .select(`
          *,
          companies(name),
          social_platforms(display_name, icon_name)
        `)
        .eq("status", "pending")
        .order("subscribed_at", { ascending: false });

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error: any) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const fetchSubscriptions = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from("company_platform_subscriptions")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "approved");

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading subscriptions",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (request: Subscription) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("company_platform_subscriptions")
        .update({
          status: "approved",
          is_active: true,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      toast({ title: "Subscription approved" });
      fetchPendingRequests();
      if (selectedCompanyId) fetchSubscriptions(selectedCompanyId);
    } catch (error: any) {
      toast({
        title: "Error approving subscription",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast({ title: "Please provide a rejection reason", variant: "destructive" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("company_platform_subscriptions")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast({ title: "Subscription rejected" });
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedRequest(null);
      fetchPendingRequests();
    } catch (error: any) {
      toast({
        title: "Error rejecting subscription",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isSubscribed = (platformId: string) => {
    return subscriptions.find((s) => s.platform_id === platformId && s.is_active);
  };

  const handleToggleSubscription = async (platformId: string, subscribe: boolean) => {
    if (!selectedCompanyId) return;

    try {
      const existing = subscriptions.find((s) => s.platform_id === platformId);

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("company_platform_subscriptions")
          .update({ is_active: subscribe })
          .eq("id", existing.id);

        if (error) throw error;
      } else if (subscribe) {
        // Insert new
        const { error } = await supabase
          .from("company_platform_subscriptions")
          .insert([{
            company_id: selectedCompanyId,
            platform_id: platformId,
            is_active: true,
          }]);

        if (error) throw error;
      }

      toast({
        title: subscribe ? "Platform activated" : "Platform deactivated",
        description: `Successfully ${subscribe ? "added" : "removed"} platform access`,
      });

      fetchSubscriptions(selectedCompanyId);
    } catch (error: any) {
      toast({
        title: "Error updating subscription",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPlatformIcon = (iconName: string | null) => {
    if (!iconName) return Icons.Circle;
    const Icon = (Icons as any)[iconName];
    return Icon || Icons.Circle;
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8 space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold">Company Platform Subscriptions</h1>
        <p className="text-muted-foreground mt-2">
          Review subscription requests and manage platform access for companies
        </p>
      </div>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              <CardTitle>Pending Subscription Requests ({pendingRequests.length})</CardTitle>
            </div>
            <CardDescription>Review and approve or reject company platform subscription requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => {
                  const Icon = getPlatformIcon(request.social_platforms?.icon_name || null);
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.companies?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {request.social_platforms?.display_name || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(request.subscribed_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(request)}
                          className="gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsRejectDialogOpen(true);
                          }}
                          className="gap-1"
                        >
                          <X className="h-3 w-3" />
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {pendingRequests.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No pending subscription requests at the moment.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select Company</CardTitle>
          <CardDescription>Choose a company to manage their platform subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCompanyId && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => {
            const subscribed = isSubscribed(platform.id);
            const Icon = getPlatformIcon(platform.icon_name);

            return (
              <Card key={platform.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6" />
                      <div>
                        <CardTitle className="text-lg">{platform.display_name}</CardTitle>
                        <CardDescription className="text-xs">
                          {subscribed ? "Active" : "Not subscribed"}
                        </CardDescription>
                      </div>
                    </div>
                    {subscribed ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {subscribed ? "Subscribed" : "Not subscribed"}
                    </span>
                    <Switch
                      checked={!!subscribed}
                      onCheckedChange={(checked) =>
                        handleToggleSubscription(platform.id, checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!selectedCompanyId && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Select a company above to manage their platform subscriptions
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Subscription Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this subscription request
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={4}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason("");
                setSelectedRequest(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
