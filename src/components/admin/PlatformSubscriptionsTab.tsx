import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";

export default function PlatformSubscriptionsTab() {
  const queryClient = useQueryClient();
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('telebirr');

  // Fetch platform subscriptions with company and platform details
  const { data: platformSubs, isLoading } = useQuery({
    queryKey: ['platform-subscriptions-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_platform_subscriptions')
        .select(`
          *,
          company:companies(name, email),
          platform:social_platforms(display_name, pricing_info),
          subscription_request:subscription_requests(id, full_name, email, status)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Approve platform subscription mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: string; paymentMethod: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const subscription = platformSubs?.find(s => s.id === id);
      if (!subscription) throw new Error('Subscription not found');

      // Update platform subscription status
      const { error: subError } = await supabase
        .from('company_platform_subscriptions')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (subError) throw subError;

      // Create payment transaction
      if (subscription.monthly_fee && subscription.monthly_fee > 0) {
        const { error: paymentError } = await supabase
          .from('payment_transactions')
          .insert({
            subscription_request_id: subscription.subscription_request_id,
            amount: subscription.monthly_fee,
            currency: 'ETB',
            payment_method: paymentMethod,
            status: 'pending',
            transaction_reference: `PLAT-${Date.now()}`,
          });

        if (paymentError) throw paymentError;
      }

      // Update linked subscription request if exists
      if (subscription.subscription_request_id) {
        await supabase
          .from('subscription_requests')
          .update({
            status: 'approved',
            payment_method: paymentMethod,
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', subscription.subscription_request_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-subscriptions-admin'] });
      toast.success('Platform subscription approved and payment record created');
      setShowActionDialog(false);
    },
    onError: (error: any) => {
      toast.error('Failed to approve subscription: ' + error.message);
    },
  });

  // Reject platform subscription mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const subscription = platformSubs?.find(s => s.id === id);
      
      const { error } = await supabase
        .from('company_platform_subscriptions')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Update linked subscription request
      if (subscription?.subscription_request_id) {
        await supabase
          .from('subscription_requests')
          .update({
            status: 'rejected',
            rejection_reason: reason,
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', subscription.subscription_request_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-subscriptions-admin'] });
      toast.success('Platform subscription rejected');
      setShowActionDialog(false);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast.error('Failed to reject subscription: ' + error.message);
    },
  });

  const handleApprove = () => {
    if (selectedSubscription) {
      approveMutation.mutate({
        id: selectedSubscription.id,
        paymentMethod,
      });
    }
  };

  const handleReject = () => {
    if (selectedSubscription && rejectionReason.trim()) {
      rejectMutation.mutate({
        id: selectedSubscription.id,
        reason: rejectionReason,
      });
    } else {
      toast.error('Please provide a rejection reason');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = platformSubs?.filter(s => s.status === 'pending').length || 0;
  const activeCount = platformSubs?.filter(s => s.status === 'approved' && s.is_active).length || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Platform Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Platform Access</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Platforms</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformSubs?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Subscription Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !platformSubs || platformSubs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No platform subscriptions found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Monthly Fee</TableHead>
                  <TableHead>Billing Cycle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platformSubs.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell className="text-sm">
                      {format(new Date(sub.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sub.company?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{sub.company?.email || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{sub.platform?.display_name || 'N/A'}</TableCell>
                    <TableCell>ETB {Number(sub.monthly_fee || 0).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{sub.billing_cycle || 'monthly'}</TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell>
                      {sub.is_active ? (
                        <Badge variant="default">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setActionType('approve');
                              setShowActionDialog(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setActionType('reject');
                              setShowActionDialog(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Platform Subscription' : 'Reject Platform Subscription'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedSubscription && (
              <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
                <p><strong>Company:</strong> {selectedSubscription.company?.name}</p>
                <p><strong>Platform:</strong> {selectedSubscription.platform?.display_name}</p>
                <p><strong>Monthly Fee:</strong> ETB {selectedSubscription.monthly_fee || 0}</p>
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
                  A payment record will be created for this subscription
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason..."
                  rows={4}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowActionDialog(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={actionType === 'approve' ? handleApprove : handleReject}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                variant={actionType === 'approve' ? 'default' : 'destructive'}
              >
                {actionType === 'approve' ? 'Approve & Create Payment' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
