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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Edit, Trash2, UserPlus, TrendingUp, CheckCircle2, Sparkles, Download, Upload, ArrowRight } from "lucide-react";
import { PageHelp } from "@/components/PageHelp";
import { useBranches } from "@/hooks/useBranches";
import { ClickToCall } from "@/components/ClickToCall";

export default function Leads() {
  const { accessibleBranches } = useBranches();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    title: "",
    lead_source: "",
    lead_status: "new",
    lead_score: "0",
    description: "",
  });
  const queryClient = useQueryClient();

  const { data: leads } = useQuery({
    queryKey: ["leads", searchQuery, accessibleBranches],
    queryFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("branch_id").single();
      
      let query = supabase
        .from("leads")
        .select("*")
        .eq("converted", false)
        .order("created_at", { ascending: false });

      // Apply branch filtering if user has branch restrictions
      if (accessibleBranches.length > 0 && profile?.branch_id) {
        const branchIds = accessibleBranches.map(b => b.id);
        query = query.in('company_id', [profile.branch_id]);
      }

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: accessibleBranches !== undefined,
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      // Check if lead with same email already exists
      if (data.email) {
        const { data: existingLead } = await supabase
          .from("leads")
          .select("id, first_name, last_name, email, converted")
          .eq("email", data.email)
          .eq("converted", false)
          .maybeSingle();
        
        if (existingLead) {
          throw new Error(`Active lead with email ${data.email} already exists: ${existingLead.first_name} ${existingLead.last_name}`);
        }

        // Check if contact with this email exists
        const { data: existingContact } = await supabase
          .from("contacts")
          .select("id, first_name, last_name, email")
          .eq("email", data.email)
          .maybeSingle();
        
        if (existingContact) {
          throw new Error(`This email already exists as a contact: ${existingContact.first_name} ${existingContact.last_name}. Consider linking to existing contact instead.`);
        }
      }

      const { data: profile } = await supabase.from("profiles").select("company_id").single();
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("leads").insert({
        ...data,
        lead_score: parseInt(data.lead_score),
        company_id: profile?.company_id,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead created successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from("leads")
        .update({
          ...data,
          lead_score: parseInt(data.lead_score),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead updated successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const convertLeadMutation = useMutation({
    mutationFn: async (lead: any) => {
      // Check if contact with this email already exists
      if (lead.email) {
        const { data: existingContact } = await supabase
          .from("contacts")
          .select("id, first_name, last_name")
          .eq("email", lead.email)
          .maybeSingle();
        
        if (existingContact) {
          throw new Error(`Contact with email ${lead.email} already exists: ${existingContact.first_name} ${existingContact.last_name}`);
        }
      }

      const { data: profile } = await supabase.from("profiles").select("company_id").single();
      const { data: user } = await supabase.auth.getUser();

      // Create contact from lead data
      const { error: contactError } = await supabase.from("contacts").insert({
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        title: lead.title,
        lead_source: lead.lead_source,
        status: "active",
        company_id: profile?.company_id,
        created_by: user.user?.id,
      });

      if (contactError) throw contactError;

      // Mark lead as converted
      const { error: updateError } = await supabase
        .from("leads")
        .update({ 
          converted: true,
          converted_date: new Date().toISOString()
        })
        .eq("id", lead.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Lead converted to contact successfully");
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
      company: "",
      title: "",
      lead_source: "",
      lead_status: "new",
      lead_score: "0",
      description: "",
    });
    setEditingLead(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead) {
      updateLeadMutation.mutate({ id: editingLead.id, ...formData });
    } else {
      createLeadMutation.mutate(formData);
    }
  };

  const openEditDialog = (lead: any) => {
    setEditingLead(lead);
    setFormData({
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      title: lead.title || "",
      lead_source: lead.lead_source || "",
      lead_status: lead.lead_status,
      lead_score: lead.lead_score?.toString() || "0",
      description: lead.description || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "default",
      contacted: "secondary",
      qualified: "outline",
      unqualified: "destructive",
    };
    return colors[status] || "default";
  };

  const exportToCSV = () => {
    if (!leads || leads.length === 0) {
      toast.error("No leads to export");
      return;
    }

    const headers = ["First Name", "Last Name", "Email", "Phone", "Company", "Title", "Lead Source", "Status", "Score", "Description"];
    const csvData = leads.map(lead => [
      lead.first_name,
      lead.last_name,
      lead.email || "",
      lead.phone || "",
      lead.company || "",
      lead.title || "",
      lead.lead_source || "",
      lead.lead_status,
      lead.lead_score || 0,
      lead.description || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Leads exported successfully");
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
            company: values[4] || "",
            title: values[5] || "",
            lead_source: values[6] || "",
            lead_status: values[7] || "new",
            lead_score: parseInt(values[8]) || 0,
            description: values[9] || "",
          };
        });

        const { data: profile } = await supabase.from("profiles").select("company_id").single();
        const { data: user } = await supabase.auth.getUser();
        
        let successCount = 0;
        let errorCount = 0;

        for (const lead of data) {
          if (!lead.first_name || !lead.last_name) {
            errorCount++;
            continue;
          }

          const { error } = await supabase.from("leads").insert({
            ...lead,
            company_id: profile?.company_id,
            created_by: user.user?.id,
          });

          if (error) {
            errorCount++;
          } else {
            successCount++;
          }
        }

        queryClient.invalidateQueries({ queryKey: ["leads"] });
        toast.success(`Imported ${successCount} leads${errorCount > 0 ? `, ${errorCount} failed` : ""}`);
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
        title="Lead Management"
        description="Capture, qualify, and nurture leads through your sales pipeline. Track lead sources, score prospects, and convert qualified leads into customers."
        features={[
          "Create and manage leads with comprehensive details",
          "Score leads based on engagement and qualification criteria",
          "Track lead sources to identify best acquisition channels",
          "Qualify leads through status progression",
          "Convert qualified leads into contacts and opportunities",
        ]}
        tips={[
          "Use lead scoring to prioritize your best prospects",
          "Update lead status regularly to reflect pipeline progress",
          "Track lead sources to optimize marketing spend",
          "Add detailed notes to maintain context across team interactions",
        ]}
      />

      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background p-8 backdrop-blur-sm border border-primary/10">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-slide-up">
              Leads Management
            </h1>
            <p className="text-muted-foreground text-lg animate-slide-up" style={{ animationDelay: "100ms" }}>
              Manage and qualify your leads with intelligent tracking
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
                <Button onClick={openCreateDialog} size="lg" className="shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-gradient-to-r from-primary to-accent animate-glow-pulse">
                  <Plus className="mr-2 h-5 w-5" />
                  New Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto backdrop-blur-xl bg-card/95">
              <DialogHeader>
                <DialogTitle className="text-2xl">{editingLead ? "Edit" : "Create"} Lead</DialogTitle>
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
                    <Label>Company</Label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
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

                <div className="grid grid-cols-3 gap-4">
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
                    <Select value={formData.lead_status} onValueChange={(value) => setFormData({ ...formData, lead_status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="unqualified">Unqualified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Lead Score (0-100)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.lead_score}
                      onChange={(e) => setFormData({ ...formData, lead_score: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingLead ? "Update" : "Create"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>

      {/* Stats Grid with Glassmorphic Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/5">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {leads?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active pipeline</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-accent/10 to-primary/5">
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              Qualified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {leads?.filter(l => l.lead_status === "qualified").length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready for conversion</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden animate-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success/20 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-success/10 to-accent/5">
                <CheckCircle2 className="h-4 w-4 text-success" />
              </div>
              Contacted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {leads?.filter(l => l.lead_status === "contacted").length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden animate-slide-up" style={{ animationDelay: "400ms" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Avg Lead Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
              {leads && leads.length > 0
                ? Math.round(leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / leads.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Quality metric</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="animate-slide-up" style={{ animationDelay: "500ms" }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">All Leads</CardTitle>
              <CardDescription>Search and manage your leads efficiently</CardDescription>
            </div>
            <div className="relative">
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm pl-10 backdrop-blur-sm bg-background/50"
              />
              <UserPlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leads && leads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead: any) => (
                  <TableRow key={lead.id} className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all">
                    <TableCell>
                      <div className="font-medium">{lead.first_name} {lead.last_name}</div>
                      {lead.title && <div className="text-xs text-muted-foreground">{lead.title}</div>}
                    </TableCell>
                    <TableCell>{lead.company || "-"}</TableCell>
                    <TableCell>{lead.email || "-"}</TableCell>
                    <TableCell>{lead.lead_source || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(lead.lead_status) as any} className="animate-scale-in">
                        {lead.lead_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-semibold">{lead.lead_score || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {lead.phone && (
                          <ClickToCall 
                            phoneNumber={lead.phone} 
                            contactName={`${lead.first_name} ${lead.last_name}`}
                            variant="ghost"
                            className="text-success"
                          />
                        )}
                        {lead.lead_status === "qualified" && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => convertLeadMutation.mutate(lead)}
                            className="bg-gradient-to-r from-success to-accent hover:scale-105 transition-all animate-glow-pulse"
                          >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Convert
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(lead)} className="hover:scale-110 transition-transform">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteLeadMutation.mutate(lead.id)}
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
              <UserPlus className="h-16 w-16 text-muted-foreground/50 mb-4 animate-float" />
              <p className="text-muted-foreground text-center">
                No leads found. Create your first lead to get started!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
