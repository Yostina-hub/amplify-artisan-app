import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, DollarSign, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const SubscriptionManagement = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('telebirr');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['subscription-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_requests')
        .select(`
          *,
          pricing_plan:pricing_plans(name, price, billing_period)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('subscription_requests')
        .update({
          ...updates,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
      setShowApprovalDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
      toast.success('Request updated successfully');
    },
    onError: (error) => {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    },
  });

  const handleApprove = () => {
    if (!selectedRequest) return;
    
    const paymentInstructions = paymentMethod === 'telebirr' 
      ? 'Please send payment to Telebirr: 0912345678. Reference: ' + selectedRequest.id.substring(0, 8)
      : paymentMethod === 'cbe'
      ? 'Please send payment to CBE Birr: 0912345678. Reference: ' + selectedRequest.id.substring(0, 8)
      : 'Bank details will be sent via email';

    updateRequestMutation.mutate({
      id: selectedRequest.id,
      updates: {
        status: 'payment_pending',
        payment_method: paymentMethod,
        payment_instructions: paymentInstructions,
      },
    });
  };

  const handleReject = () => {
    if (!selectedRequest || !rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    updateRequestMutation.mutate({
      id: selectedRequest.id,
      updates: {
        status: 'rejected',
        rejection_reason: rejectionReason,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      payment_pending: { color: 'bg-blue-100 text-blue-800', label: 'Payment Pending' },
      active: { color: 'bg-emerald-100 text-emerald-800', label: 'Active' },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve subscription requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests?.filter(r => r.status === 'pending').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests?.filter(r => r.status === 'approved' || r.status === 'payment_pending').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests?.filter(r => r.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests?.filter(r => r.status === 'rejected').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-sm">
                      {format(new Date(request.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.full_name}</div>
                        <div className="text-sm text-muted-foreground">{request.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{request.company_name || '-'}</TableCell>
                    <TableCell>
                      <div className="font-medium">{request.pricing_plan?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ${request.pricing_plan?.price}/{request.pricing_plan?.billing_period}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{request.phone}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowApprovalDialog(true);
                            setActionType('approve');
                          }}
                          disabled={request.status !== 'pending'}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowApprovalDialog(true);
                            setActionType('reject');
                          }}
                          disabled={request.status !== 'pending'}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRequest && (
              <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
                <p><strong>Customer:</strong> {selectedRequest.full_name}</p>
                <p><strong>Email:</strong> {selectedRequest.email}</p>
                <p><strong>Plan:</strong> {selectedRequest.pricing_plan?.name}</p>
              </div>
            )}

            {actionType === 'approve' ? (
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="telebirr">Telebirr</SelectItem>
                    <SelectItem value="cbe">CBE Birr</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Customer will receive payment instructions via email
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={4}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApprovalDialog(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={actionType === 'approve' ? handleApprove : handleReject}
                disabled={updateRequestMutation.isPending}
                variant={actionType === 'approve' ? 'default' : 'destructive'}
              >
                {updateRequestMutation.isPending ? 'Processing...' : 
                  actionType === 'approve' ? 'Approve & Send Instructions' : 'Reject Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;