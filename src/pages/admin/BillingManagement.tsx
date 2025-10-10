import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, DollarSign, CreditCard, FileText, TrendingUp, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import PricingPlansTab from "@/components/admin/PricingPlansTab";
import PlatformSubscriptionsTab from "@/components/admin/PlatformSubscriptionsTab";

const BillingManagement = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('telebirr');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Fetch subscription requests
  const { data: subscriptions, isLoading: subsLoading } = useQuery({
    queryKey: ['subscription-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_requests')
        .select(`
          *,
          pricing_plan:pricing_plans(name, price, billing_period, currency)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch payment transactions
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payment-transactions', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          subscription_request:subscription_requests(
            full_name,
            email,
            company_name,
            pricing_plan:pricing_plans(name, price, currency)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const stats = {
    pendingSubscriptions: subscriptions?.filter(s => s.status === 'pending').length || 0,
    activeSubscriptions: subscriptions?.filter(s => s.status === 'active').length || 0,
    totalRevenue: payments?.reduce((sum, p) => sum + (p.status === 'verified' ? Number(p.amount) : 0), 0) || 0,
    pendingPayments: payments?.filter(p => p.status === 'pending').length || 0,
  };

  // Approve subscription mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: string; paymentMethod: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const paymentInstructions = paymentMethod === 'telebirr' 
        ? 'Send payment to Telebirr: 0912345678. Reference: ' + id.substring(0, 8)
        : paymentMethod === 'cbe'
        ? 'Send payment to CBE Birr: 0912345678. Reference: ' + id.substring(0, 8)
        : 'Bank transfer details will be sent via email';

      // Update subscription request
      const { error: subError } = await supabase
        .from('subscription_requests')
        .update({
          status: 'approved',
          payment_method: paymentMethod,
          payment_instructions: paymentInstructions,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (subError) throw subError;

      // Get subscription details to create payment record
      const { data: subscription } = await supabase
        .from('subscription_requests')
        .select('*, pricing_plan:pricing_plans(*)')
        .eq('id', id)
        .single();

      if (subscription?.pricing_plan) {
        // Create payment transaction
        await supabase
          .from('payment_transactions')
          .insert({
            subscription_request_id: id,
            amount: subscription.pricing_plan.price,
            currency: subscription.pricing_plan.currency || 'ETB',
            payment_method: paymentMethod,
            status: 'pending',
            transaction_reference: `PAY-${id.substring(0, 8)}-${Date.now()}`,
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
      setShowActionDialog(false);
      setSelectedRequest(null);
      toast.success('Subscription approved and payment record created');
    },
    onError: (error) => {
      console.error('Error approving subscription:', error);
      toast.error('Failed to approve subscription');
    },
  });

  // Reject subscription mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('subscription_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
      setShowActionDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
      toast.success('Subscription rejected');
    },
    onError: (error) => {
      console.error('Error rejecting subscription:', error);
      toast.error('Failed to reject subscription');
    },
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error: payError } = await supabase
        .from('payment_transactions')
        .update({
          status: 'verified',
          payment_date: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (payError) throw payError;

      // Get payment details
      const { data: payment } = await supabase
        .from('payment_transactions')
        .select('subscription_request_id')
        .eq('id', paymentId)
        .single();

      if (payment?.subscription_request_id) {
        // Activate subscription
        await supabase
          .from('subscription_requests')
          .update({ status: 'active' })
          .eq('id', payment.subscription_request_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-requests'] });
      toast.success('Payment verified and subscription activated');
    },
    onError: (error) => {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    },
  });

  const handleApprove = () => {
    if (!selectedRequest) return;
    approveMutation.mutate({
      id: selectedRequest.id,
      paymentMethod,
    });
  };

  const handleReject = () => {
    if (!selectedRequest || !rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate({
      id: selectedRequest.id,
      reason: rejectionReason,
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800', label: 'Approved' },
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      verified: { color: 'bg-emerald-100 text-emerald-800', label: 'Verified' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
    };
    const { color, label } = config[status] || config.pending;
    return <Badge className={color}>{label}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription & Billing Management</h1>
        <p className="text-muted-foreground mt-2">
          Unified dashboard for managing subscriptions, payments, and pricing
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ETB {stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscriptions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="platforms">Platform Access</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Plans</TabsTrigger>
        </TabsList>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Requests</CardTitle>
              <CardDescription>Review and manage subscription requests</CardDescription>
            </CardHeader>
            <CardContent>
              {subsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions?.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="text-sm">
                          {format(new Date(sub.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sub.full_name}</div>
                            <div className="text-sm text-muted-foreground">{sub.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{sub.company_name || '-'}</TableCell>
                        <TableCell>
                          <div className="font-medium">{sub.pricing_plan?.name}</div>
                        </TableCell>
                        <TableCell>
                          {sub.pricing_plan?.currency} {sub.pricing_plan?.price}/{sub.pricing_plan?.billing_period}
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {sub.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedRequest(sub);
                                    setActionType('approve');
                                    setShowActionDialog(true);
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedRequest(sub);
                                    setActionType('reject');
                                    setShowActionDialog(true);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Subscriptions Tab */}
        <TabsContent value="platforms">
          <PlatformSubscriptionsTab />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions</CardTitle>
              <CardDescription>Monitor and verify payment transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-sm">
                          {format(new Date(payment.created_at), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {payment.subscription_request?.full_name || 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {payment.subscription_request?.email || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {payment.subscription_request?.pricing_plan?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="capitalize">{payment.payment_method}</TableCell>
                        <TableCell className="font-medium">
                          {payment.currency} {Number(payment.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {payment.transaction_reference || 'N/A'}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {payment.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => verifyPaymentMutation.mutate(payment.id)}
                              disabled={verifyPaymentMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Plans Tab */}
        <TabsContent value="pricing">
          <PricingPlansTab />
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Subscription' : 'Reject Subscription'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRequest && (
              <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
                <p><strong>Customer:</strong> {selectedRequest.full_name}</p>
                <p><strong>Email:</strong> {selectedRequest.email}</p>
                <p><strong>Plan:</strong> {selectedRequest.pricing_plan?.name}</p>
                <p><strong>Amount:</strong> {selectedRequest.pricing_plan?.currency} {selectedRequest.pricing_plan?.price}</p>
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
                  A payment record will be created automatically
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
                {actionType === 'approve' ? 'Approve & Create Invoice' : 'Reject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingManagement;