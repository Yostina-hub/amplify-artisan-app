import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageHelp } from "@/components/PageHelp";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, FileText, Trash2, DollarSign, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useRateLimiting } from "@/hooks/useRateLimiting";

type Quote = {
  id: string;
  quote_number: string;
  quote_name: string;
  status: string;
  total_amount: number;
  valid_until: string | null;
  created_at: string;
};

type QuoteItem = {
  id?: string;
  product_id?: string;
  item_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  tax_percentage: number;
  line_total: number;
};

export default function Quotes() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Rate limiting for quote operations
  const quoteRateLimiter = useRateLimiting('quote_create');
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lineItems, setLineItems] = useState<QuoteItem[]>([]);
  const [formData, setFormData] = useState({
    quote_name: "",
    status: "draft",
    valid_until: "",
    terms_and_conditions: "",
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

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`quote_name.ilike.%${searchQuery}%,quote_number.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Quote[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, product_name, unit_price")
        .eq("is_active", true)
        .order("product_name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { quote: typeof formData; items: QuoteItem[] }) => {
      // Rate limiting check
      if (!quoteRateLimiter.checkRateLimit()) {
        throw new Error('Rate limit exceeded. Please wait before creating more quotes.');
      }
      
      const totals = calculateTotals(data.items);
      
      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          ...data.quote,
          company_id: profile?.company_id,
          created_by: session?.user?.id,
          quote_number: "",
          valid_until: data.quote.valid_until || null,
          ...totals,
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      if (data.items.length > 0) {
        const { error: itemsError } = await supabase.from("quote_items").insert(
          data.items.map((item, index) => ({
            quote_id: quote.id,
            ...item,
            sort_order: index,
          }))
        );
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Quote created successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create quote: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Quote deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete quote: ${error.message}`);
    },
  });

  const calculateTotals = (items: QuoteItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
    const taxAmount = items.reduce(
      (sum, item) => sum + (item.line_total * item.tax_percentage) / 100,
      0
    );
    const discountAmount = items.reduce(
      (sum, item) => sum + (item.unit_price * item.quantity * item.discount_percentage) / 100,
      0
    );
    const totalAmount = subtotal + taxAmount - discountAmount;

    return { subtotal, tax_amount: taxAmount, discount_amount: discountAmount, total_amount: totalAmount };
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        item_name: "",
        description: "",
        quantity: 1,
        unit_price: 0,
        discount_percentage: 0,
        tax_percentage: 0,
        line_total: 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    const quantity = updated[index].quantity;
    const unitPrice = updated[index].unit_price;
    const discountPct = updated[index].discount_percentage;
    
    updated[index].line_total = quantity * unitPrice * (1 - discountPct / 100);
    
    setLineItems(updated);
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      updateLineItem(index, "product_id", productId);
      updateLineItem(index, "item_name", product.product_name);
      updateLineItem(index, "unit_price", product.unit_price);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }
    createMutation.mutate({ quote: formData, items: lineItems });
  };

  const resetForm = () => {
    setFormData({
      quote_name: "",
      status: "draft",
      valid_until: "",
      terms_and_conditions: "",
      notes: "",
    });
    setLineItems([]);
    setEditingQuote(null);
    setDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      draft: { variant: "outline", icon: FileText },
      sent: { variant: "secondary", icon: FileText },
      accepted: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle },
      expired: { variant: "destructive", icon: XCircle },
    };
    const config = variants[status] || variants.draft;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
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
    total: quotes.length,
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
    totalValue: quotes.reduce((sum, q) => sum + q.total_amount, 0),
  };

  const totals = calculateTotals(lineItems);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHelp
        title="Quotes & Proposals"
        description="Create and manage professional quotes and proposals for your customers. Track quotes through their lifecycle from draft to acceptance."
        features={[
          "Create detailed quotes with multiple line items",
          "Link products to quote items for quick pricing",
          "Apply discounts and taxes at line item level",
          "Track quote status (Draft, Sent, Accepted, Rejected)",
          "Set validity periods for quotes",
          "Add terms and conditions and internal notes"
        ]}
        tips={[
          "Use product templates to speed up quote creation",
          "Set appropriate validity dates to encourage timely decisions",
          "Add clear terms and conditions to avoid misunderstandings",
          "Review quote analytics to improve acceptance rates"
        ]}
      />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quotes & Proposals</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              New Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Quote</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quote_name">Quote Name *</Label>
                  <Input
                    id="quote_name"
                    value={formData.quote_name}
                    onChange={(e) => setFormData({ ...formData, quote_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label>Line Items *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {lineItems.map((item, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="grid grid-cols-2 gap-3 flex-1">
                            <div>
                              <Label>Product</Label>
                              <Select onValueChange={(value) => selectProduct(index, value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.product_name} - {formatCurrency(product.unit_price)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Item Name *</Label>
                              <Input
                                value={item.item_name}
                                onChange={(e) => updateLineItem(index, "item_name", e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            className="ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) =>
                                updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                          <div>
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateLineItem(index, "unit_price", parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                          <div>
                            <Label>Discount %</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.discount_percentage}
                              onChange={(e) =>
                                updateLineItem(index, "discount_percentage", parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                          <div>
                            <Label>Tax %</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.tax_percentage}
                              onChange={(e) =>
                                updateLineItem(index, "tax_percentage", parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                        </div>
                        <div className="text-right font-semibold">
                          Line Total: {formatCurrency(item.line_total)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {lineItems.length > 0 && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(totals.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{formatCurrency(totals.tax_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-{formatCurrency(totals.discount_amount)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(totals.total_amount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
                <Textarea
                  id="terms_and_conditions"
                  value={formData.terms_and_conditions}
                  onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">Create Quote</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
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
                <TableHead>Quote #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No quotes found
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.quote_number}</TableCell>
                    <TableCell>{quote.quote_name}</TableCell>
                    <TableCell>{getStatusBadge(quote.status)}</TableCell>
                    <TableCell>{formatCurrency(quote.total_amount)}</TableCell>
                    <TableCell>
                      {quote.valid_until ? format(new Date(quote.valid_until), "MMM dd, yyyy") : "-"}
                    </TableCell>
                    <TableCell>{format(new Date(quote.created_at), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(quote.id)}>
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
    </div>
  );
}
