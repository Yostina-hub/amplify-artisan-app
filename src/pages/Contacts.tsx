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
import { Plus, Edit, Trash2, User, Mail, Phone, Building2, Users, Sparkles, Download, Upload } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHelp } from "@/components/PageHelp";
import { ClickToCall } from "@/components/ClickToCall";

export default function Contacts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [exportFilters, setExportFilters] = useState({
    dateFrom: "",
    dateTo: "",
    status: "all",
  });
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    mobile: "",
    title: "",
    department: "",
    account_id: "",
    lead_source: "",
    status: "active",
  });
  const queryClient = useQueryClient();
  const itemsPerPage = 20;

  const { data: contactsData } = useQuery({
    queryKey: ["contacts", searchQuery, currentPage],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      let companyId: string | null = null;
      if (userId) {
        const { data: cid } = await supabase.rpc('get_user_company_id', { _user_id: userId });
        companyId = (cid as any) ?? null;
      }
      
      let query = supabase
        .from("contacts")
        .select("*, accounts(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    },
  });

  const contacts = contactsData?.data || [];
  const totalPages = Math.ceil((contactsData?.count || 0) / itemsPerPage);

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.email) {
        const { data: existingContact } = await supabase
          .from("contacts")
          .select("id, first_name, last_name, email")
          .eq("email", data.email)
          .maybeSingle();
        
        if (existingContact) {
          throw new Error(`Contact with email ${data.email} already exists: ${existingContact.first_name} ${existingContact.last_name}`);
        }
      }

      if (data.account_id) {
        const { data: account } = await supabase
          .from("accounts")
          .select("id")
          .eq("id", data.account_id)
          .maybeSingle();
        
        if (!account) {
          throw new Error("Selected account does not exist");
        }
      }

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      let companyId: string | undefined;
      if (userId) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", userId)
          .maybeSingle();
        companyId = prof?.company_id as string | undefined;
        if (!companyId) {
          const { data: role } = await supabase
            .from("user_roles")
            .select("company_id")
            .eq("user_id", userId)
            .maybeSingle();
          companyId = (role as any)?.company_id as string | undefined;
        }
      }
      const { error } = await supabase.from("contacts").insert({
        ...data,
        company_id: companyId,
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact created successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from("contacts")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact updated successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error} = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      mobile: "",
      title: "",
      department: "",
      account_id: "",
      lead_source: "",
      status: "active",
    });
    setEditingContact(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact) {
      updateContactMutation.mutate({ id: editingContact.id, ...formData });
    } else {
      createContactMutation.mutate(formData);
    }
  };

  const openEditDialog = (contact: any) => {
    setEditingContact(contact);
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || "",
      phone: contact.phone || "",
      mobile: contact.mobile || "",
      title: contact.title || "",
      department: contact.department || "",
      account_id: contact.account_id || "",
      lead_source: contact.lead_source || "",
      status: contact.status,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const exportToCSV = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      let companyId: string | undefined;
      if (userId) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", userId)
          .maybeSingle();
        companyId = prof?.company_id as string | undefined;
        if (!companyId) {
          const { data: role } = await supabase
            .from("user_roles")
            .select("company_id")
            .eq("user_id", userId)
            .maybeSingle();
          companyId = (role as any)?.company_id as string | undefined;
        }
      }
      
      let query = supabase
        .from("contacts")
        .select("*, accounts(name)")
        .order("created_at", { ascending: false });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      if (exportFilters.dateFrom) {
        query = query.gte("created_at", exportFilters.dateFrom);
      }
      if (exportFilters.dateTo) {
        query = query.lte("created_at", exportFilters.dateTo);
      }
      if (exportFilters.status && exportFilters.status !== "all") {
        query = query.eq("status", exportFilters.status);
      }

      const { data: exportData, error } = await query;
      if (error) throw error;

      if (!exportData || exportData.length === 0) {
        toast.error("No contacts to export");
        return;
      }

      const headers = ["First Name", "Last Name", "Email", "Phone", "Mobile", "Title", "Department", "Account", "Lead Source", "Status", "Created At"];
      const csvData = exportData.map(contact => [
        contact.first_name,
        contact.last_name,
        contact.email || "",
        contact.phone || "",
        contact.mobile || "",
        contact.title || "",
        contact.department || "",
        contact.accounts?.name || "",
        contact.lead_source || "",
        contact.status,
        new Date(contact.created_at).toLocaleDateString()
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `contacts_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${exportData.length} contacts successfully`);
    } catch (error) {
      toast.error("Failed to export contacts");
    }
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        
        if (lines.length < 2) {
          toast.error("CSV file is empty or invalid");
          return;
        }

        const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
        const data = lines.slice(1).map(line => {
          const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, "")) || [];
          return {
            first_name: values[0] || "",
            last_name: values[1] || "",
            email: values[2] || "",
            phone: values[3] || "",
            mobile: values[4] || "",
            title: values[5] || "",
            department: values[6] || "",
            lead_source: values[8] || "",
            status: values[9] || "active",
          };
        });

        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        let companyId: string | undefined;
        if (userId) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("company_id")
            .eq("id", userId)
            .maybeSingle();
          companyId = prof?.company_id as string | undefined;
          if (!companyId) {
            const { data: role } = await supabase
              .from("user_roles")
              .select("company_id")
              .eq("user_id", userId)
              .maybeSingle();
            companyId = (role as any)?.company_id as string | undefined;
          }
        }
        
        let successCount = 0;
        let errorCount = 0;

        for (const contact of data) {
          if (!contact.first_name || !contact.last_name) {
            errorCount++;
            continue;
          }

          const { error } = await supabase.from("contacts").insert({
            ...contact,
            company_id: companyId,
            created_by: userId,
          });

          if (error) {
            errorCount++;
          } else {
            successCount++;
          }
        }

        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        toast.success(`Imported ${successCount} contacts${errorCount > 0 ? `, ${errorCount} failed` : ""}`);
      } catch (error) {
        toast.error("Failed to import CSV file");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <PageHelp
        title="Contact Management"
        description="Manage all your customer and prospect contacts in one centralized location. Track communication history, link contacts to accounts, and maintain detailed relationship records."
        features={[
          "Create and manage contact records with complete details",
          "Link contacts to accounts for organizational tracking",
          "Track contact sources and lead attribution",
          "Search and filter contacts efficiently",
          "Branch-based access control for multi-location organizations",
        ]}
        tips={[
          "Keep contact information up-to-date for effective communication",
          "Use tags and status fields to categorize and segment contacts",
          "Link contacts to accounts to see organizational relationships",
          "Track lead sources to understand your best acquisition channels",
        ]}
      />

      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/10 via-primary/5 to-background p-10 backdrop-blur-sm border border-accent/10">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full blur-3xl animate-glow-pulse" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 backdrop-blur-sm border border-accent/20 animate-scale-in">
              <Users className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Relationship Management</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-accent via-primary to-success bg-clip-text text-transparent animate-slide-up">
              Contacts
            </h1>
            <p className="text-muted-foreground text-lg animate-slide-up" style={{ animationDelay: "100ms" }}>
              Manage your customer relationships and contact database
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} size="lg" className="shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-r from-accent to-primary animate-glow-pulse">
                <Plus className="mr-2 h-5 w-5" />
                New Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto backdrop-blur-xl bg-card/95">
              <DialogHeader>
                <DialogTitle className="text-2xl">{editingContact ? "Edit" : "Create"} Contact</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name *</Label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name *</Label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mobile</Label>
                    <Input
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account</Label>
                    <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lead Source</Label>
                    <Select value={formData.lead_source} onValueChange={(value) => setFormData({ ...formData, lead_source: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="cold_call">Cold Call</SelectItem>
                        <SelectItem value="email">Email Campaign</SelectItem>
                      </SelectContent>
                    </Select>
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
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingContact ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Action Bar with Export Filters */}
      <Card className="backdrop-blur-sm bg-card/50 border-primary/10">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Button onClick={exportToCSV} size="lg" variant="outline" className="shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Download className="mr-2 h-5 w-5" />
                  Export CSV
                </Button>
                <Button asChild size="lg" variant="outline" className="shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <label className="cursor-pointer flex items-center">
                    <Upload className="mr-2 h-5 w-5" />
                    Import CSV
                    <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                  </label>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={exportFilters.dateFrom}
                  onChange={(e) => setExportFilters({ ...exportFilters, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={exportFilters.dateTo}
                  onChange={(e) => setExportFilters({ ...exportFilters, dateTo: e.target.value })}
                />
              </div>
              <div>
                <Label>Status Filter</Label>
                <Select value={exportFilters.status} onValueChange={(value) => setExportFilters({ ...exportFilters, status: value === "all" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => setExportFilters({ dateFrom: "", dateTo: "", status: "all" })} 
                  variant="outline"
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 animate-slide-up" style={{ animationDelay: "200ms" }}>
        <Card className="backdrop-blur-sm bg-card/50 hover:bg-card/80 transition-all hover:scale-105 hover:shadow-xl border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{contactsData?.count || 0}</div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-card/50 hover:bg-card/80 transition-all hover:scale-105 hover:shadow-xl border-accent/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
            <Sparkles className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{contacts.filter(c => c.status === "active").length}</div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-card/50 hover:bg-card/80 transition-all hover:scale-105 hover:shadow-xl border-success/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">With Accounts</CardTitle>
            <Building2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{contacts.filter(c => c.account_id).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="backdrop-blur-sm bg-card/50 border-primary/10 animate-slide-up" style={{ animationDelay: "300ms" }}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search contacts by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-background/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card className="backdrop-blur-sm bg-card/50 border-primary/10 animate-slide-up" style={{ animationDelay: "400ms" }}>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No contacts found. Create your first contact to get started.
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow key={contact.id} className="hover:bg-accent/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground">
                            {getInitials(contact.first_name, contact.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                          {contact.title && <div className="text-sm text-muted-foreground">{contact.title}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {contact.email || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {contact.phone || contact.mobile || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {contact.accounts?.name ? (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {contact.accounts.name}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={contact.status === "active" ? "default" : "secondary"}>
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(contact.phone || contact.mobile) && (
                          <ClickToCall
                            phoneNumber={contact.phone || contact.mobile}
                            contactName={`${contact.first_name} ${contact.last_name}`}
                            variant="ghost"
                            size="icon"
                            className="text-success"
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(contact)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this contact?")) {
                              deleteContactMutation.mutate(contact.id);
                            }
                          }}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="backdrop-blur-sm bg-card/50 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({contactsData?.count || 0} total contacts)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
