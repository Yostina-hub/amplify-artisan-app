import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Receipt, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

type Invoice = {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  invoice_date: string;
  due_date: string | null;
  created_at: string;
};

export default function Invoices() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_method: "bank_transfer",
    reference_number: "",
    notes: "",
  });

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("invoices" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("invoice_number", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Invoice[];
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: { invoiceId: string; payment: typeof paymentData }) => {
      const { error } = await supabase.from("payments" as any).insert({
        invoice_id: data.invoiceId,
        amount: parseFloat(data.payment.amount),
        payment_method: data.payment.payment_method,
        reference_number: data.payment.reference_number || null,
        notes: data.payment.notes || null,
        payment_number: "",
        company_id: profile?.company_id,
        created_by: session?.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Payment recorded successfully");
      setPaymentDialogOpen(false);
      setPaymentData({
        amount: "",
        payment_method: "bank_transfer",
        reference_number: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete invoice: ${error.message}`);
    },
  });

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      ...paymentData,
      amount: invoice.balance_due.toString(),
    });
    setPaymentDialogOpen(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInvoice) {
      recordPaymentMutation.mutate({
        invoiceId: selectedInvoice.id,
        payment: paymentData,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
    > = {
      draft: { variant: "outline", icon: Receipt },
      sent: { variant: "secondary", icon: Receipt },
      paid: { variant: "default", icon: CheckCircle },
      partially_paid: { variant: "secondary", icon: DollarSign },
      overdue: { variant: "destructive", icon: AlertCircle },
      cancelled: { variant: "destructive", icon: AlertCircle },
    };
    const config = variants[status] || variants.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const stats = {
    total: invoices.length,
    draft: invoices.filter((i) => i.status === "draft").length,
    sent: invoices.filter((i) => i.status === "sent").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    totalRevenue: invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.total_amount, 0),
    outstanding: invoices
      .filter((i) => ["sent", "partially_paid", "overdue"].includes(i.status))
      .reduce((sum, i) => sum + i.balance_due, 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Invoices & Payments</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.paid} paid • {stats.overdue} overdue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">From {stats.paid} paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.outstanding)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.sent + stats.overdue} unpaid
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                    <TableCell>{formatCurrency(invoice.amount_paid)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(invoice.balance_due)}
                    </TableCell>
                    <TableCell>{format(new Date(invoice.invoice_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      {invoice.due_date ? format(new Date(invoice.due_date), "MMM dd, yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.balance_due > 0 && invoice.status !== "cancelled" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPaymentDialog(invoice)}
                        >
                          Record Payment
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(invoice.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Invoice:</span>
                  <span className="font-medium">{selectedInvoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Amount Paid:</span>
                  <span className="font-medium">{formatCurrency(selectedInvoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-semibold">Balance Due:</span>
                  <span className="font-bold">{formatCurrency(selectedInvoice.balance_due)}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="payment_method">Payment Method *</Label>
                <select
                  id="payment_method"
                  value={paymentData.payment_method}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, payment_method: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={paymentData.reference_number}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, reference_number: e.target.value })
                  }
                  placeholder="Transaction ID, check number, etc."
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Record Payment</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
