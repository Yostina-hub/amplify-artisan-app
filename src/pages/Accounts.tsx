import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Building2, DollarSign, Users2, Phone } from "lucide-react";
import { PageHelp } from "@/components/PageHelp";
import { useBranches } from "@/hooks/useBranches";
import { ClickToCall } from "@/components/ClickToCall";

export default function Accounts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [exportFilters, setExportFilters] = useState({
    dateFrom: "",
    dateTo: "",
    status: "",
  });
  const [formData, setFormData] = useState({
    name: "",
    account_type: "",
    industry: "",
    website: "",
    phone: "",
    email: "",
    annual_revenue: "",
    number_of_employees: "",
    status: "active",
  });
  const queryClient = useQueryClient();
  const itemsPerPage = 20;

  const { data: accountsData } = useQuery({
    queryKey: ["accounts", searchQuery, currentPage],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      let companyId: string | undefined;
      if (userId) {
        const { data: cid, error: cidError } = await supabase.rpc('get_user_company_id', { _user_id: userId });
        if (cidError) throw cidError;
        companyId = cid as string | undefined;
      }
      
      let query = supabase
        .from("accounts")
        .select("*", { count: "exact" })
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    },
  });

  const accounts = accountsData?.data || [];
  const totalPages = Math.ceil((accountsData?.count || 0) / itemsPerPage);

  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      // Check for duplicate account by name
      const { data: existingAccount } = await supabase
        .from("accounts")
        .select("id, name, email")
        .ilike("name", data.name)
        .maybeSingle();
      
      if (existingAccount) {
        throw new Error(`Account with similar name already exists: ${existingAccount.name}`);
      }

      // Check for duplicate email if provided
      if (data.email) {
        const { data: existingEmailAccount } = await supabase
          .from("accounts")
          .select("id, name, email")
          .eq("email", data.email)
          .maybeSingle();
        
        if (existingEmailAccount) {
          throw new Error(`Account with email ${data.email} already exists: ${existingEmailAccount.name}`);
        }
      }

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      let companyId: string | undefined;
      if (userId) {
        const { data: cid, error: cidError } = await supabase.rpc('get_user_company_id', { _user_id: userId });
        if (cidError) throw cidError;
        companyId = cid as string | undefined;
      }
      const { error } = await supabase.from("accounts").insert({
        ...data,
        annual_revenue: data.annual_revenue ? parseFloat(data.annual_revenue) : null,
        number_of_employees: data.number_of_employees ? parseInt(data.number_of_employees) : null,
        company_id: companyId,
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account created successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from("accounts")
        .update({
          ...data,
          annual_revenue: data.annual_revenue ? parseFloat(data.annual_revenue) : null,
          number_of_employees: data.number_of_employees ? parseInt(data.number_of_employees) : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account updated successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      account_type: "",
      industry: "",
      website: "",
      phone: "",
      email: "",
      annual_revenue: "",
      number_of_employees: "",
      status: "active",
    });
    setEditingAccount(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      updateAccountMutation.mutate({ id: editingAccount.id, ...formData });
    } else {
      createAccountMutation.mutate(formData);
    }
  };

  const openEditDialog = (account: any) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      account_type: account.account_type || "",
      industry: account.industry || "",
      website: account.website || "",
      phone: account.phone || "",
      email: account.email || "",
      annual_revenue: account.annual_revenue?.toString() || "",
      number_of_employees: account.number_of_employees?.toString() || "",
      status: account.status,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <PageHelp
        title="Account Management"
        description="Manage your organizational accounts including customers, prospects, partners, and vendors. Track account relationships, revenue, and organizational hierarchies."
        features={[
          "Create and manage company/organization accounts",
          "Track account types (Customer, Prospect, Partner, Vendor)",
          "Monitor annual revenue and company size metrics",
          "Link contacts to their respective accounts",
          "Branch-based access control for distributed teams",
        ]}
        tips={[
          "Maintain accurate account information for better segmentation",
          "Use account types to categorize and report on different relationships",
          "Track revenue and employee count for targeting and analysis",
          "Link related contacts to accounts for complete relationship view",
        ]}
      />

      {/* Revolutionary Header */}
      <div className="relative overflow-hidden rounded-3xl p-12 shadow-[var(--shadow-xl)] animate-scale-in" style={{ background: 'var(--gradient-mesh)' }}>
        <div className="absolute inset-0 animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, hsl(var(--primary-glow) / 0.2), transparent)', backgroundSize: '200% 100%' }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl animate-float" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-glow-pulse">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/70">Accounts</h1>
            </div>
            <p className="text-muted-foreground text-lg">Manage your customer accounts with advanced analytics</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} size="lg" className="shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] group">
                <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                New Account
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAccount ? "Edit" : "Create"} Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Account Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select value={formData.account_type} onValueChange={(value) => setFormData({ ...formData, account_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Revenue</Label>
                  <Input
                    type="number"
                    value={formData.annual_revenue}
                    onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Number of Employees</Label>
                  <Input
                    type="number"
                    value={formData.number_of_employees}
                    onChange={(e) => setFormData({ ...formData, number_of_employees: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingAccount ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              Total Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">{accounts?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active organizations</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success/20 to-accent/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-success to-accent">
              {formatCurrency(accounts?.reduce((sum, acc) => sum + (acc.annual_revenue || 0), 0) || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Annual revenue total</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
                <Users2 className="h-4 w-4 text-primary" />
              </div>
              Active Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-glow">{accounts?.filter(a => a.status === "active").length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently active</p>
          </CardContent>
        </Card>
      </div>

      <Card className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-mesh opacity-10" />
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">All Accounts</CardTitle>
              <CardDescription>Search and manage your customer accounts</CardDescription>
            </div>
            <div className="relative">
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm shadow-inner"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          {accounts && accounts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account: any) => (
                  <TableRow key={account.id} className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-300">
                    <TableCell>
                      <div className="font-medium">{account.name}</div>
                      {account.website && (
                        <div className="text-xs text-muted-foreground">{account.website}</div>
                      )}
                    </TableCell>
                    <TableCell>{account.account_type || "-"}</TableCell>
                    <TableCell>{account.industry || "-"}</TableCell>
                    <TableCell>
                      {account.phone ? (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {account.phone}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{account.annual_revenue ? formatCurrency(account.annual_revenue) : "-"}</TableCell>
                    <TableCell>{account.number_of_employees || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={account.status === "active" ? "default" : "secondary"}>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {account.phone && (
                          <ClickToCall
                            phoneNumber={account.phone}
                            contactName={account.name}
                            variant="ghost"
                            size="icon"
                            className="text-success"
                          />
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(account)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAccountMutation.mutate(account.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No accounts found. Create your first account!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
