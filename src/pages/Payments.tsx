import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Search,
  Plus,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Download,
  RefreshCw,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHelp } from "@/components/PageHelp";
import { pageHelpContent } from "@/lib/pageHelpContent";
import { useToast } from "@/hooks/use-toast";

const Payments = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [methodDialogOpen, setMethodDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);

  // Mock data
  const stats = [
    { label: "Total Revenue", value: "$245,680", change: "+12.5%", icon: DollarSign },
    { label: "Active Subscriptions", value: "89", change: "+8", icon: RefreshCw },
    { label: "Pending Payments", value: "$15,240", change: "5 items", icon: Clock },
    { label: "Success Rate", value: "98.2%", change: "+2.1%", icon: TrendingUp },
  ];

  const paymentMethods = [
    {
      id: "1",
      type: "credit_card",
      brand: "Visa",
      last_four: "4242",
      exp_month: 12,
      exp_year: 2025,
      billing_name: "John Doe",
      is_default: true,
      is_active: true,
    },
    {
      id: "2",
      type: "paypal",
      paypal_email: "john@example.com",
      billing_name: "John Doe",
      is_default: false,
      is_active: true,
    },
  ];

  const transactions = [
    {
      id: "1",
      transaction_id: "TXN-2025-001",
      customer_name: "Acme Corp",
      amount: 5000,
      currency: "USD",
      status: "completed",
      payment_date: "2025-09-28T10:30:00Z",
      payment_gateway: "stripe",
      transaction_type: "payment",
    },
    {
      id: "2",
      transaction_id: "TXN-2025-002",
      customer_name: "Tech Solutions",
      amount: 3500,
      currency: "USD",
      status: "pending",
      payment_date: "2025-09-29T14:20:00Z",
      payment_gateway: "paypal",
      transaction_type: "payment",
    },
    {
      id: "3",
      transaction_id: "TXN-2025-003",
      customer_name: "Global Industries",
      amount: 500,
      currency: "USD",
      status: "refunded",
      payment_date: "2025-09-25T09:15:00Z",
      payment_gateway: "stripe",
      transaction_type: "refund",
    },
  ];

  const subscriptions = [
    {
      id: "1",
      customer_name: "Acme Corp",
      subscription_name: "Premium Plan",
      amount: 999,
      billing_cycle: "monthly",
      status: "active",
      next_billing_date: "2025-10-28",
      start_date: "2025-01-15",
      auto_renew: true,
      total_paid: 9990,
    },
    {
      id: "2",
      customer_name: "Tech Solutions",
      subscription_name: "Enterprise Plan",
      amount: 2499,
      billing_cycle: "monthly",
      status: "active",
      next_billing_date: "2025-10-30",
      start_date: "2025-03-10",
      auto_renew: true,
      total_paid: 17493,
    },
    {
      id: "3",
      customer_name: "Startup Inc",
      subscription_name: "Basic Plan",
      amount: 299,
      billing_cycle: "monthly",
      status: "trial",
      next_billing_date: "2025-10-15",
      start_date: "2025-09-15",
      auto_renew: true,
      total_paid: 0,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
      case "trial":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
      case "cancelled":
      case "refunded":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      completed: "default",
      active: "default",
      pending: "secondary",
      trial: "secondary",
      failed: "destructive",
      cancelled: "destructive",
      refunded: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const handleAddMethod = () => {
    toast({ title: "Payment method added", description: "New payment method added successfully" });
    setMethodDialogOpen(false);
  };

  const handleAddTransaction = () => {
    toast({ title: "Transaction recorded", description: "Payment transaction recorded successfully" });
    setTransactionDialogOpen(false);
  };

  const handleAddSubscription = () => {
    toast({ title: "Subscription created", description: "New subscription created successfully" });
    setSubscriptionDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHelp
          title={pageHelpContent.payments.title}
          description={pageHelpContent.payments.description}
          features={pageHelpContent.payments.features}
          tips={pageHelpContent.payments.tips}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payment Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage payment methods, transactions, and subscriptions
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-green-500 mt-1">{stat.change}</p>
                </div>
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card className="p-4">
              <div className="flex gap-4 items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Record Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Record New Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Transaction Type</Label>
                          <Select defaultValue="payment">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="payment">Payment</SelectItem>
                              <SelectItem value="refund">Refund</SelectItem>
                              <SelectItem value="chargeback">Chargeback</SelectItem>
                              <SelectItem value="adjustment">Adjustment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Gateway</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gateway" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="stripe">Stripe</SelectItem>
                              <SelectItem value="paypal">PayPal</SelectItem>
                              <SelectItem value="square">Square</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Customer</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Acme Corp</SelectItem>
                            <SelectItem value="2">Tech Solutions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <Input type="number" placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                          <Label>Currency</Label>
                          <Select defaultValue="USD">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Transaction ID</Label>
                        <Input placeholder="External transaction ID (optional)" />
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea placeholder="Additional notes..." />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setTransactionDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddTransaction}>Record Payment</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-medium">{txn.transaction_id}</TableCell>
                      <TableCell>{txn.customer_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{txn.transaction_type}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${txn.amount.toFixed(2)} {txn.currency}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{txn.payment_gateway}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(txn.status)}
                          {getStatusBadge(txn.status)}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(txn.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            {txn.status === "completed" && (
                              <DropdownMenuItem className="text-destructive">
                                Issue Refund
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card className="p-4">
              <div className="flex gap-4 items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search subscriptions..." className="pl-10" />
                </div>
                <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Subscription</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Customer</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Acme Corp</SelectItem>
                            <SelectItem value="2">Tech Solutions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Subscription Name</Label>
                        <Input placeholder="e.g., Premium Plan" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Subscription details..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <Input type="number" placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                          <Label>Billing Cycle</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cycle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input type="date" />
                        </div>
                        <div className="space-y-2">
                          <Label>Trial Ends (Optional)</Label>
                          <Input type="date" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="autorenew" className="rounded" defaultChecked />
                        <Label htmlFor="autorenew">Auto-renew subscription</Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSubscriptionDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddSubscription}>Create Subscription</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Billing</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.customer_name}</TableCell>
                      <TableCell>{sub.subscription_name}</TableCell>
                      <TableCell className="font-semibold">${sub.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{sub.billing_cycle}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(sub.status)}
                          {getStatusBadge(sub.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(sub.next_billing_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ${sub.total_paid.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Subscription</DropdownMenuItem>
                            {sub.status === "active" && (
                              <DropdownMenuItem>Pause Subscription</DropdownMenuItem>
                            )}
                            {sub.status === "paused" && (
                              <DropdownMenuItem>Resume Subscription</DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive">
                              Cancel Subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="methods" className="space-y-4">
            <Card className="p-4">
              <div className="flex justify-end">
                <Dialog open={methodDialogOpen} onOpenChange={setMethodDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payment Method
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Payment Method</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Payment Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="debit_card">Debit Card</SelectItem>
                            <SelectItem value="bank_account">Bank Account</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Billing Name</Label>
                        <Input placeholder="Name on card/account" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" placeholder="billing@example.com" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="default" className="rounded" />
                        <Label htmlFor="default">Set as default payment method</Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setMethodDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddMethod}>Add Method</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{method.billing_name}</p>
                        {method.type === "credit_card" && (
                          <p className="text-sm text-muted-foreground">
                            {method.brand} •••• {method.last_four}
                          </p>
                        )}
                        {method.type === "paypal" && (
                          <p className="text-sm text-muted-foreground">{method.paypal_email}</p>
                        )}
                      </div>
                    </div>
                    {method.is_default && (
                      <Badge variant="default">Default</Badge>
                    )}
                  </div>
                  {method.type === "credit_card" && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Expires {method.exp_month}/{method.exp_year}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Payments;
