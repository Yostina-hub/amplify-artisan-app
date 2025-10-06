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
import { useBranches } from "@/hooks/useBranches";

export default function Contacts() {
  const { accessibleBranches } = useBranches();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  const { data: contacts } = useQuery({
    queryKey: ["contacts", searchQuery, accessibleBranches],
    queryFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("branch_id").single();
      
      let query = supabase
        .from("contacts")
        .select("*, accounts(name)")
        .order("created_at", { ascending: false });

      // Apply branch filtering if user has branch restrictions
      if (accessibleBranches.length > 0 && profile?.branch_id) {
        const branchIds = accessibleBranches.map(b => b.id);
        // Filter by branches accessible to the user
        query = query.in('company_id', [profile.branch_id]);
      }

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: accessibleBranches !== undefined,
  });

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
      // Check for duplicate email
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

      // Validate account exists if provided
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

      const { data: profile } = await supabase.from("profiles").select("company_id").single();
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("contacts").insert({
        ...data,
        company_id: profile?.company_id,
        created_by: user.user?.id,
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

  const exportToCSV = () => {
    if (!contacts || contacts.length === 0) {
      toast.error("No contacts to export");
      return;
    }

    const headers = ["First Name", "Last Name", "Email", "Phone", "Mobile", "Title", "Department", "Account", "Lead Source", "Status"];
    const csvData = contacts.map(contact => [
      contact.first_name,
      contact.last_name,
      contact.email || "",
      contact.phone || "",
      contact.mobile || "",
      contact.title || "",
      contact.department || "",
      contact.accounts?.name || "",
      contact.lead_source || "",
      contact.status
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
    toast.success("Contacts exported successfully");
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

        const { data: profile } = await supabase.from("profiles").select("company_id").single();
        const { data: user } = await supabase.auth.getUser();
        
        let successCount = 0;
        let errorCount = 0;

        for (const contact of data) {
          if (!contact.first_name || !contact.last_name) {
            errorCount++;
            continue;
          }

          const { error } = await supabase.from("contacts").insert({
            ...contact,
            company_id: profile?.company_id,
            created_by: user.user?.id,
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
    </div>

      {/* Enhanced Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="relative overflow-hidden group animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl animate-glow-pulse" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent/10 to-primary/5 group-hover:scale-110 transition-transform">
                <User className="h-4 w-4 text-accent" />
              </div>
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {contacts?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">In database</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: "500ms" }} />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/5 group-hover:scale-110 transition-transform">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              With Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {contacts?.filter(c => c.email).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Reachable via email</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group animate-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success/20 to-transparent rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: "1s" }} />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-success/10 to-accent/5 group-hover:scale-110 transition-transform">
                <Phone className="h-4 w-4 text-success" />
              </div>
              With Phone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-success">
              {contacts?.filter(c => c.phone || c.mobile).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Call-ready contacts</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group animate-slide-up" style={{ animationDelay: "400ms" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 via-primary/20 to-success/20 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent/10 via-primary/5 to-success/5 group-hover:scale-110 transition-transform">
                <Building2 className="h-4 w-4 text-accent" />
              </div>
              With Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-to-r from-accent via-primary to-success bg-clip-text text-transparent">
              {contacts?.filter(c => c.account_id).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Linked to accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Table */}
      <Card className="animate-slide-up" style={{ animationDelay: "500ms" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent" />
                All Contacts
              </CardTitle>
              <CardDescription>Search and manage your contact database</CardDescription>
            </div>
            <div className="relative">
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm pl-10 backdrop-blur-sm bg-background/50"
              />
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contacts && contacts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact: any) => (
                  <TableRow key={contact.id} className="hover:bg-gradient-to-r hover:from-accent/5 hover:to-primary/5 transition-all group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="group-hover:scale-110 transition-transform">
                          <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-white">
                            {getInitials(contact.first_name, contact.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                          {contact.lead_source && (
                            <div className="text-xs text-muted-foreground">Source: {contact.lead_source}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{contact.title || "-"}</TableCell>
                    <TableCell>{contact.accounts?.name || "-"}</TableCell>
                    <TableCell>{contact.email || "-"}</TableCell>
                    <TableCell>{contact.phone || contact.mobile || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={contact.status === "active" ? "default" : "secondary"} className="animate-scale-in">
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(contact)} className="hover:scale-110 transition-transform">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteContactMutation.mutate(contact.id)}
                          className="hover:scale-110 transition-transform hover:text-destructive"
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
            <div className="flex flex-col items-center justify-center py-12">
              <User className="h-16 w-16 text-muted-foreground/50 mb-4 animate-float" />
              <p className="text-muted-foreground text-center">
                No contacts found. Create your first contact!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
