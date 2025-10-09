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
import {
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, CheckCircle, XCircle, Pause, Mail, Eye, Trash2, UserCog, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";

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
  is_active: boolean;
  pricing_plan_id: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export default function CompanyManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isManageAdminOpen, setIsManageAdminOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [companyAdmin, setCompanyAdmin] = useState<any>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  
  const pagination = usePagination(25);
  
  useEffect(() => {
    fetchCompanies();
  }, []);
  
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      pagination.goToPage(1);
      fetchCompanies();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);
  
  useEffect(() => {
    fetchCompanies();
  }, [pagination.currentPage, pagination.pageSize]);

  const fetchCompanies = async () => {
    try {
      let query = supabase
        .from("companies")
        .select("*", { count: 'exact' });
      
      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(pagination.getRangeStart(), pagination.getRangeEnd());

      if (error) throw error;
      setCompanies(data || []);
      pagination.setTotalItems(count || 0);
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
          is_active: true,
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
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("companies")
        .update({
          status: "rejected",
          is_active: false,
          approved_by: user?.id,
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
        .update({
          status: "rejected",
          is_active: false
        })
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

  const handleDelete = async () => {
    if (!selectedCompany) return;

    try {
      // Delete the company
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", selectedCompany.id);

      if (error) throw error;

      toast.success(`${selectedCompany.name} has been deleted`);
      setIsDeleteDialogOpen(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast.error("Failed to delete company");
    }
  };

  const fetchCompanyAdmin = async (companyId: string) => {
    setLoadingAdmin(true);
    try {
      // Find profiles with this company_id
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyId);

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        setCompanyAdmin(null);
        return;
      }

      // Get roles for these users scoped to this company
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .in('user_id', profiles.map(p => p.id))
        .eq('role', 'admin')
        .eq('company_id', companyId);

      if (rolesError) throw rolesError;

      // Find the admin user
      const adminProfile = profiles.find(p => 
        roles?.some(r => r.user_id === p.id)
      );

      if (adminProfile) {
        const adminRoles = roles?.filter(r => r.user_id === adminProfile.id);
        setCompanyAdmin({
          ...adminProfile,
          roles: adminRoles?.map(r => r.role) || []
        });
      } else {
        setCompanyAdmin(null);
      }
    } catch (error) {
      console.error('Error fetching company admin:', error);
      toast.error('Failed to load company admin');
    } finally {
      setLoadingAdmin(false);
    }
  };

  const handleViewAdmin = async (company: Company) => {
    setSelectedCompany(company);
    setIsManageAdminOpen(true);
    await fetchCompanyAdmin(company.id);
  };

  const handleResetAdminPassword = async () => {
    if (!companyAdmin) return;

    try {
      const { error } = await supabase.functions.invoke('send-password-reset-email', {
        body: { 
          email: companyAdmin.email,
          userId: companyAdmin.id
        }
      });

      if (error) throw error;

      toast.success(`Password reset email sent to ${companyAdmin.email}`);
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      toast.error(error.message || 'Failed to send password reset email');
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
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No companies found
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>{company.industry || "—"}</TableCell>
                    <TableCell>{company.company_size || "—"}</TableCell>
                    <TableCell>{getStatusBadge(company.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(company.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCompany(company);
                              setIsViewDetailsOpen(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
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
                            <>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleSuspend(company)}
                              >
                                <Pause className="mr-2 h-4 w-4" />
                                Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleViewAdmin(company)}
                              >
                                <UserCog className="mr-2 h-4 w-4" />
                                Manage Admin
                              </DropdownMenuItem>
                            </>
                          )}
                          {(company.status === "approved" || company.status === "rejected") && (
                            <DropdownMenuItem
                              onClick={() => handleResendEmail(company)}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Resend Email
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedCompany(company);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Company
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            onPageChange={pagination.goToPage}
            onPageSizeChange={pagination.setPageSize}
          />
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

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {selectedCompany?.name}? This action cannot be undone and will remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedCompany(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Company Details</DialogTitle>
            <DialogDescription>
              Full information about {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Company Name</Label>
                  <p className="font-medium">{selectedCompany.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedCompany.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedCompany.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedCompany.phone || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Website</Label>
                  <p className="font-medium">
                    {selectedCompany.website ? (
                      <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {selectedCompany.website}
                      </a>
                    ) : "—"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Industry</Label>
                  <p className="font-medium">{selectedCompany.industry || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Company Size</Label>
                  <p className="font-medium">{selectedCompany.company_size || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Applied Date</Label>
                  <p className="font-medium">
                    {new Date(selectedCompany.created_at).toLocaleDateString()}
                  </p>
                </div>
                {selectedCompany.approved_at && (
                  <div>
                    <Label className="text-muted-foreground">Approved Date</Label>
                    <p className="font-medium">
                      {new Date(selectedCompany.approved_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {selectedCompany.address && (
                <div>
                  <Label className="text-muted-foreground">Address</Label>
                  <p className="font-medium">{selectedCompany.address}</p>
                </div>
              )}
              {selectedCompany.rejection_reason && (
                <div>
                  <Label className="text-muted-foreground">Rejection Reason</Label>
                  <p className="font-medium text-destructive">{selectedCompany.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>
              Close
            </Button>
            {selectedCompany?.status === "pending" && (
              <>
                <Button
                  onClick={() => {
                    setIsViewDetailsOpen(false);
                    setIsApproveDialogOpen(true);
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewDetailsOpen(false);
                    setIsRejectDialogOpen(true);
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Company Admin Dialog */}
      <Dialog open={isManageAdminOpen} onOpenChange={setIsManageAdminOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Company Admin Account</DialogTitle>
            <DialogDescription>
              Manage the admin account for {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>
          {loadingAdmin ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading admin details...
            </div>
          ) : companyAdmin ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{companyAdmin.full_name || 'Not set'}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{companyAdmin.email}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Roles</Label>
                <div className="flex gap-2">
                  {companyAdmin.roles?.map((role: string) => (
                    <Badge key={role} variant="default">{role}</Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Created</Label>
                <p className="text-sm">{new Date(companyAdmin.created_at).toLocaleString()}</p>
              </div>
              <div className="pt-4">
                <Button 
                  onClick={handleResetAdminPassword}
                  variant="outline"
                  className="w-full"
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Send Password Reset
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No admin account found for this company.
              </p>
              <p className="text-sm text-muted-foreground">
                The admin account is created when you approve the company. 
                Try re-approving or using the "Resend Email" option.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageAdminOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
