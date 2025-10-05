import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, CheckCircle2, Clock, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { PageHelp } from "@/components/PageHelp";
import { useBranches } from "@/hooks/useBranches";

type Activity = {
  id: string;
  subject: string;
  activity_type: string;
  status: string;
  priority: string;
  due_date: string | null;
  description: string | null;
  related_to_type: string | null;
  related_to_id: string | null;
  assigned_to: string | null;
  created_at: string;
};

export default function Activities() {
  const { accessibleBranches } = useBranches();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    subject: "",
    activity_type: "task",
    status: "pending",
    priority: "medium",
    due_date: "",
    description: "",
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

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.ilike("subject", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Activity[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("activities").insert({
        ...data,
        company_id: profile?.company_id,
        created_by: session?.user?.id,
        due_date: data.due_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Activity created successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create activity: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from("activities")
        .update({
          ...data,
          due_date: data.due_date || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Activity updated successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update activity: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Activity deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete activity: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      subject: "",
      activity_type: "task",
      status: "pending",
      priority: "medium",
      due_date: "",
      description: "",
    });
    setEditingActivity(null);
    setDialogOpen(false);
  };

  const openEditDialog = (activity: Activity) => {
    setEditingActivity(activity);
    setFormData({
      subject: activity.subject,
      activity_type: activity.activity_type,
      status: activity.status,
      priority: activity.priority,
      due_date: activity.due_date ? format(new Date(activity.due_date), "yyyy-MM-dd") : "",
      description: activity.description || "",
    });
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      in_progress: "secondary",
      completed: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status.replace("_", " ")}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-500/10 text-blue-600",
      medium: "bg-yellow-500/10 text-yellow-600",
      high: "bg-orange-500/10 text-orange-600",
      urgent: "bg-red-500/10 text-red-600",
    };
    return <Badge className={colors[priority] || ""}>{priority}</Badge>;
  };

  const stats = {
    total: activities.length,
    pending: activities.filter((a) => a.status === "pending").length,
    completed: activities.filter((a) => a.status === "completed").length,
    overdue: activities.filter(
      (a) => a.due_date && new Date(a.due_date) < new Date() && a.status !== "completed"
    ).length,
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <PageHelp
        title="Activities & Tasks"
        description="Manage all your business activities including tasks, calls, meetings, emails, and notes. Track progress, set priorities, and ensure nothing falls through the cracks."
        features={[
          "Create and track multiple activity types (tasks, calls, meetings, emails)",
          "Set priorities and due dates for time-sensitive activities",
          "Monitor activity status and completion",
          "Link activities to contacts, leads, and opportunities",
          "Branch-based activity visibility and assignment",
        ]}
        tips={[
          "Set realistic due dates and priorities to manage workload",
          "Update activity status regularly to track progress",
          "Use activity types to categorize and report on team productivity",
          "Link activities to CRM records for complete interaction history",
        ]}
      />

      <div className="relative overflow-hidden rounded-3xl p-12 shadow-[var(--shadow-xl)] animate-scale-in" style={{ background: 'var(--gradient-mesh)' }}>
        <div className="absolute inset-0 animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, hsl(var(--primary-glow) / 0.2), transparent)', backgroundSize: '200% 100%' }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl animate-float" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-glow-pulse">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/70">Activities & Tasks</h1>
            </div>
            <p className="text-muted-foreground text-lg">Manage tasks, calls, meetings, and all your business activities</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} size="lg" className="shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] group">
                <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                New Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingActivity ? "Edit Activity" : "Create Activity"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="activity_type">Type *</Label>
                    <Select
                      value={formData.activity_type}
                      onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priority">Priority *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingActivity ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All activities</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500/20 to-accent/20 flex items-center justify-center">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Waiting to start</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success/20 to-accent/20 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-success">{stats.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully done</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-destructive/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-destructive/20 to-accent/20 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-destructive">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 shadow-inner"
          />
        </div>
      </div>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-5" />
        <CardContent className="p-0 relative z-10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
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
              ) : activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No activities found
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity) => (
                  <TableRow key={activity.id} className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-300">
                    <TableCell className="font-medium">{activity.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{activity.activity_type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(activity.status)}</TableCell>
                    <TableCell>{getPriorityBadge(activity.priority)}</TableCell>
                    <TableCell>
                      {activity.due_date
                        ? format(new Date(activity.due_date), "MMM dd, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>{format(new Date(activity.created_at), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(activity)}
                        className="hover:scale-110 transition-transform"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(activity.id)}
                        className="hover:scale-110 transition-transform text-destructive"
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
    </div>
  );
}
