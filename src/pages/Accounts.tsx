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
import { Plus, Edit, Trash2, Building2, DollarSign, Users2 } from "lucide-react";

export default function Accounts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  const { data: accounts } = useQuery({
    queryKey: ["accounts", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: profile } = await supabase.from("profiles").select("company_id").single();
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("accounts").insert({
        ...data,
        annual_revenue: data.annual_revenue ? parseFloat(data.annual_revenue) : null,
        number_of_employees: data.number_of_employees ? parseInt(data.number_of_employees) : null,
        company_id: profile?.company_id,
        created_by: user.user?.id,
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your customer accounts</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(accounts?.reduce((sum, acc) => sum + (acc.annual_revenue || 0), 0) || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              Active Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts?.filter(a => a.status === "active").length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Accounts</CardTitle>
              <CardDescription>Search and manage your accounts</CardDescription>
            </div>
            <Input
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {accounts && accounts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account: any) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="font-medium">{account.name}</div>
                      {account.website && (
                        <div className="text-xs text-muted-foreground">{account.website}</div>
                      )}
                    </TableCell>
                    <TableCell>{account.account_type || "-"}</TableCell>
                    <TableCell>{account.industry || "-"}</TableCell>
                    <TableCell>{account.annual_revenue ? formatCurrency(account.annual_revenue) : "-"}</TableCell>
                    <TableCell>{account.number_of_employees || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={account.status === "active" ? "default" : "secondary"}>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
