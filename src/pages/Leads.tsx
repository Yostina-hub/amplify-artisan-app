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
import { Plus, Edit, Trash2, UserPlus, TrendingUp, CheckCircle2, Sparkles } from "lucide-react";

export default function Leads() {
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
    queryKey: ["leads", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*")
        .eq("converted", false)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,company.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
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

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
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
