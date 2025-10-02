import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, CheckCircle, XCircle, Pause, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  address: string | null;
  status: string;
  rejection_reason: string | null;
  applied_at: string;
  approved_at: string | null;
  created_at: string;
}

export default function CompanyManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("applied_at", { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedCompany) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("companies")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq("id", selectedCompany.id);

      if (error) throw error;

      // Send approval email
      await supabase.functions.invoke('send-company-status-email', {
        body: { companyId: selectedCompany.id, status: 'approved' }
      });

      toast.success(`${selectedCompany.name} has been approved and email sent`);
      setIsApproveDialogOpen(false);
      fetchCompanies();
    } catch (error) {
      console.error("Error approving company:", error);
      toast.error("Failed to approve company");
    }
  };

  const handleReject = async () => {
    if (!selectedCompany || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const { error } = await supabase
        .from("companies")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedCompany.id);

      if (error) throw error;

      // Send rejection email
      await supabase.functions.invoke('send-company-status-email', {
        body: { companyId: selectedCompany.id, status: 'rejected', rejectionReason }
      });

      toast.success(`${selectedCompany.name} has been rejected and email sent`);
      setIsRejectDialogOpen(false);
      setRejectionReason("");
      fetchCompanies();
    } catch (error) {
      console.error("Error rejecting company:", error);
      toast.error("Failed to reject company");
    }
  };

  const handleSuspend = async (company: Company) => {
    if (!confirm(`Are you sure you want to suspend ${company.name}?`)) return;

    try {
      const { error } = await supabase
        .from("companies")
        .update({ status: "suspended" })
        .eq("id", company.id);

      if (error) throw error;

      toast.success(`${company.name} has been suspended`);
      fetchCompanies();
    } catch (error) {
      console.error("Error suspending company:", error);
      toast.error("Failed to suspend company");
    }
  };

  const handleResendEmail = async (company: Company) => {
    if (company.status === 'pending') {
      toast.error("Cannot resend email for pending companies. Please approve or reject first.");
      return;
    }

    try {
      const body: any = {
        companyId: company.id,
        status: company.status === 'approved' ? 'approved' : 'rejected'
      };

      if (company.status === 'rejected' && company.rejection_reason) {
        body.rejectionReason = company.rejection_reason;
      }

      await supabase.functions.invoke('send-company-status-email', { body });

      toast.success(`Email resent to ${company.name}`);
    } catch (error) {
      console.error("Error resending email:", error);
      toast.error("Failed to resend email");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon?: any }> = {
      pending: { variant: "secondary" },
      approved: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle },
      suspended: { variant: "outline", icon: Pause },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Management</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage company applications
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading companies...
                  </TableCell>
                </TableRow>
              ) : filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No companies found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>{company.industry || "—"}</TableCell>
                    <TableCell>{company.company_size || "—"}</TableCell>
                    <TableCell>{getStatusBadge(company.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(company.applied_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {company.status === "pending" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCompany(company);
                                  setIsApproveDialogOpen(true);
                                }}
                              >
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedCompany(company);
                                  setIsRejectDialogOpen(true);
                                }}
                              >
                                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {company.status === "approved" && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleSuspend(company)}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {(company.status === "approved" || company.status === "rejected") && (
                            <DropdownMenuItem
                              onClick={() => handleResendEmail(company)}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Email
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve {selectedCompany?.name}? They will be able to
              create user accounts and access the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove}>Approve Company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Company</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedCompany?.name}
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
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
