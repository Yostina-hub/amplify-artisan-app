import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  FolderKanban, Plus, Calendar, Clock, DollarSign, CheckCircle2, Target, 
  Users, ListTodo, AlertTriangle, TrendingUp, Activity, FileText, 
  BarChart3, Zap, Filter, Search, Download, Settings, Grid3x3, 
  List, GanttChart, PlayCircle, PauseCircle, Timer, User, ChevronRight
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ProjectManagement() {
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "list" | "timeline">("board");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch projects with detailed stats
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch tasks for selected project
  const { data: tasks = [] } = useQuery({
    queryKey: ["project-tasks", selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const { data, error } = await supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", selectedProject)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProject,
  });

  // Fetch milestones
  const { data: milestones = [] } = useQuery({
    queryKey: ["project-milestones", selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const { data, error } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", selectedProject)
        .order("milestone_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProject,
  });

  // Fetch time entries for analytics
  const { data: timeEntries = [] } = useQuery({
    queryKey: ["time-entries", selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("project_id", selectedProject)
        .order("entry_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProject,
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["project-team", selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const { data, error } = await supabase
        .from("project_team_members")
        .select("*")
        .eq("project_id", selectedProject);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProject,
  });

  // Create project mutation
  const createProject = useMutation({
    mutationFn: async (values: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const { error } = await supabase.from("projects").insert({
        ...values,
        company_id: profile?.company_id,
        created_by: user?.id,
        project_manager_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
      setNewProjectOpen(false);
    },
  });

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (values: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("project_tasks").insert({
        ...values,
        project_id: selectedProject,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      toast.success("Task created successfully");
      setNewTaskOpen(false);
    },
  });

  // Update task status
  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { error } = await supabase
        .from("project_tasks")
        .update({ 
          status,
          completed_at: status === "done" ? new Date().toISOString() : null 
        })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      toast.success("Task updated");
    },
  });

  // Calculate comprehensive stats
  const selectedProjectData = projects.find(p => p.id === selectedProject);
  
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === "in_progress").length,
    completedProjects: projects.filter((p) => p.status === "completed").length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    onTrack: projects.filter(p => p.progress_percentage >= 50 && p.status === "in_progress").length,
    atRisk: projects.filter(p => p.progress_percentage < 30 && p.status === "in_progress").length,
  };

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === "todo").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    review: tasks.filter(t => t.status === "review").length,
    done: tasks.filter(t => t.status === "done").length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length,
  };

  // Budget breakdown data for chart
  const budgetData = selectedProjectData ? [
    { name: "Spent", value: selectedProjectData.budget_spent || 0, color: "#ef4444" },
    { name: "Remaining", value: (selectedProjectData.budget || 0) - (selectedProjectData.budget_spent || 0), color: "#22c55e" },
  ] : [];

  // Time tracking data for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const timeTrackingData = last7Days.map(date => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hours: timeEntries
      .filter(entry => entry.entry_date === date)
      .reduce((sum, entry) => sum + (entry.hours || 0), 0),
  }));

  // Task completion trend
  const taskCompletionData = [
    { name: "To Do", value: taskStats.todo, color: "#94a3b8" },
    { name: "In Progress", value: taskStats.inProgress, color: "#3b82f6" },
    { name: "Review", value: taskStats.review, color: "#f59e0b" },
    { name: "Done", value: taskStats.done, color: "#22c55e" },
  ];

  // Milestone progress
  const milestoneProgress = milestones.length > 0
    ? (milestones.filter(m => m.is_completed).length / milestones.length) * 100
    : 0;

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "secondary",
      in_progress: "default",
      on_hold: "outline",
      completed: "default",
      cancelled: "destructive",
      todo: "secondary",
      review: "outline",
      done: "default",
    };
    return colors[status] || "outline";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "secondary",
      medium: "outline",
      high: "default",
      urgent: "destructive",
    };
    return colors[priority] || "outline";
  };

  const getDaysRemaining = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getHealthStatus = (project: any) => {
    if (!project.end_date) return "on-track";
    const daysRemaining = getDaysRemaining(project.end_date);
    const progress = project.progress_percentage;
    
    if (daysRemaining < 0) return "overdue";
    if (progress < 30 && daysRemaining < 30) return "at-risk";
    if (progress >= 70) return "on-track";
    return "needs-attention";
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case "on-track":
        return <Badge className="bg-green-500">On Track</Badge>;
      case "at-risk":
        return <Badge className="bg-yellow-500">At Risk</Badge>;
      case "needs-attention":
        return <Badge className="bg-orange-500">Needs Attention</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Project Management</h1>
            <p className="text-muted-foreground">Comprehensive project tracking and analytics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>Set up a new project with detailed configuration</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createProject.mutate({
                      name: formData.get("name"),
                      description: formData.get("description"),
                      status: formData.get("status"),
                      priority: formData.get("priority"),
                      start_date: formData.get("start_date") || null,
                      end_date: formData.get("end_date") || null,
                      budget: parseFloat(formData.get("budget") as string) || null,
                      tags: formData.get("tags") ? (formData.get("tags") as string).split(',').map(t => t.trim()) : [],
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Project Name *</Label>
                    <Input id="name" name="name" placeholder="Enter project name" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      placeholder="Detailed project description, goals, and objectives"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue="planning">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select name="priority" defaultValue="medium">
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input id="start_date" name="start_date" type="date" />
                    </div>
                    <div>
                      <Label htmlFor="end_date">Target End Date</Label>
                      <Input id="end_date" name="end_date" type="date" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget (USD)</Label>
                    <Input 
                      id="budget" 
                      name="budget" 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input 
                      id="tags" 
                      name="tags" 
                      placeholder="development, frontend, client-project"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">Create Project</Button>
                    <Button type="button" variant="outline" onClick={() => setNewProjectOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.activeProjects}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.completedProjects}</div>
              <p className="text-xs text-muted-foreground">Finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Track</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.onTrack}</div>
              <p className="text-xs text-muted-foreground">Healthy projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.atRisk}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats.totalBudget / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">Allocated</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        {!selectedProject && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">All Projects</h2>
              <div className="flex gap-2">
                <Button 
                  variant={viewMode === "board" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setViewMode("board")}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === "list" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const healthStatus = getHealthStatus(project);
                const daysRemaining = project.end_date ? getDaysRemaining(project.end_date) : null;
                
                return (
                  <Card 
                    key={project.id} 
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-l-4"
                    style={{ 
                      borderLeftColor: project.priority === "urgent" ? "#ef4444" : 
                                      project.priority === "high" ? "#f59e0b" : 
                                      "#3b82f6" 
                    }}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">{project.name}</CardTitle>
                            <Badge variant={getPriorityColor(project.priority) as any} className="text-xs">
                              {project.priority}
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{project.progress_percentage}%</span>
                        </div>
                        <Progress value={project.progress_percentage} className="h-2" />
                      </div>

                      {/* Health & Status */}
                      <div className="flex items-center justify-between">
                        <Badge variant={getStatusColor(project.status) as any}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        {getHealthBadge(healthStatus)}
                      </div>

                      {/* Timeline */}
                      {project.end_date && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(project.end_date).toLocaleDateString()}</span>
                          </div>
                          {daysRemaining !== null && (
                            <span className={daysRemaining < 7 ? "text-red-500 font-medium" : "text-muted-foreground"}>
                              {daysRemaining > 0 ? `${daysRemaining}d left` : "Overdue"}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Budget */}
                      {project.budget && (
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="font-medium">${project.budget.toLocaleString()}</span>
                        </div>
                      )}

                      {/* Tags */}
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {project.tags.slice(0, 3).map((tag: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {project.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{project.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {projects.length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-xl font-semibold mb-2">No projects yet</p>
                    <p className="text-muted-foreground mb-4">Create your first project to get started with project management</p>
                    <Button onClick={() => setNewProjectOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Project
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Project Details View */}
        {selectedProject && selectedProjectData && (
          <div className="space-y-6">
            {/* Project Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedProject(null)}
                      >
                        ← Back
                      </Button>
                      <div className="h-6 w-px bg-border" />
                      <h2 className="text-2xl font-bold">{selectedProjectData.name}</h2>
                      <Badge variant={getPriorityColor(selectedProjectData.priority) as any}>
                        {selectedProjectData.priority}
                      </Badge>
                      <Badge variant={getStatusColor(selectedProjectData.status) as any}>
                        {selectedProjectData.status.replace('_', ' ')}
                      </Badge>
                      {getHealthBadge(getHealthStatus(selectedProjectData))}
                    </div>
                    <p className="text-muted-foreground">{selectedProjectData.description}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Progress</p>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedProjectData.progress_percentage} className="flex-1 h-2" />
                      <span className="text-sm font-medium">{selectedProjectData.progress_percentage}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Timeline</p>
                    <p className="text-sm font-medium">
                      {selectedProjectData.start_date && new Date(selectedProjectData.start_date).toLocaleDateString()} - 
                      {selectedProjectData.end_date && ` ${new Date(selectedProjectData.end_date).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Budget</p>
                    <p className="text-sm font-medium">
                      ${selectedProjectData.budget?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Team Size</p>
                    <p className="text-sm font-medium">{teamMembers.length} members</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Dashboard */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Budget Breakdown */}
              {selectedProjectData.budget && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Budget Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Budget</span>
                        <span className="font-bold">${selectedProjectData.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Spent</span>
                        <span className="font-bold text-red-500">
                          ${selectedProjectData.budget_spent?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Remaining</span>
                        <span className="font-bold text-green-500">
                          ${((selectedProjectData.budget || 0) - (selectedProjectData.budget_spent || 0)).toLocaleString()}
                        </span>
                      </div>
                      <Progress 
                        value={((selectedProjectData.budget_spent || 0) / (selectedProjectData.budget || 1)) * 100} 
                        className="h-3"
                      />
                      {budgetData.length > 0 && (
                        <ResponsiveContainer width="100%" height={150}>
                          <PieChart>
                            <Pie
                              data={budgetData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {budgetData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => `$${value.toLocaleString()}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Task Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListTodo className="h-4 w-4" />
                    Task Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span className="text-sm">To Do</span>
                      </div>
                      <span className="font-bold">{taskStats.todo}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm">In Progress</span>
                      </div>
                      <span className="font-bold">{taskStats.inProgress}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-sm">Review</span>
                      </div>
                      <span className="font-bold">{taskStats.review}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm">Done</span>
                      </div>
                      <span className="font-bold">{taskStats.done}</span>
                    </div>
                  </div>
                  {taskCompletionData.length > 0 && (
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={taskCompletionData}
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          dataKey="value"
                          label={(entry) => entry.value > 0 ? entry.value : ''}
                        >
                          {taskCompletionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Time Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Tracking (Last 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={timeTrackingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Milestones Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Milestone Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {milestones.filter(m => m.is_completed).length} of {milestones.length} completed
                      </span>
                      <span className="font-bold">{Math.round(milestoneProgress)}%</span>
                    </div>
                    <Progress value={milestoneProgress} className="h-3" />
                    <div className="space-y-2 mt-4">
                      {milestones.slice(0, 4).map((milestone) => (
                        <div key={milestone.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {milestone.is_completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span className={milestone.is_completed ? "line-through text-muted-foreground" : ""}>
                              {milestone.name}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(milestone.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tasks Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    Tasks ({filteredTasks.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Task</DialogTitle>
                          <DialogDescription>Add a task to this project</DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            createTask.mutate({
                              title: formData.get("title"),
                              description: formData.get("description"),
                              status: formData.get("status"),
                              priority: formData.get("priority"),
                              due_date: formData.get("due_date") || null,
                              estimated_hours: parseFloat(formData.get("estimated_hours") as string) || null,
                            });
                          }}
                          className="space-y-4"
                        >
                          <div>
                            <Label htmlFor="title">Task Title *</Label>
                            <Input id="title" name="title" required />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" rows={3} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="status">Status</Label>
                              <Select name="status" defaultValue="todo">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">To Do</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="review">Review</SelectItem>
                                  <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="priority">Priority</Label>
                              <Select name="priority" defaultValue="medium">
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
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="due_date">Due Date</Label>
                              <Input id="due_date" name="due_date" type="date" />
                            </div>
                            <div>
                              <Label htmlFor="estimated_hours">Est. Hours</Label>
                              <Input id="estimated_hours" name="estimated_hours" type="number" step="0.5" />
                            </div>
                          </div>
                          <Button type="submit" className="w-full">Create Task</Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {taskStats.overdue > 0 && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700 dark:text-red-400">
                      {taskStats.overdue} task{taskStats.overdue > 1 ? 's' : ''} overdue
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  {filteredTasks.map((task) => {
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";
                    
                    return (
                      <Card key={task.id} className={isOverdue ? "border-red-200 dark:border-red-800" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{task.title}</h4>
                                <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                                  {task.priority}
                                </Badge>
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-xs">Overdue</Badge>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {task.due_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(task.due_date).toLocaleDateString()}
                                  </div>
                                )}
                                {task.estimated_hours && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {task.estimated_hours}h
                                  </div>
                                )}
                                {task.assigned_to && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    Assigned
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Select 
                                value={task.status} 
                                onValueChange={(value) => updateTaskStatus.mutate({ taskId: task.id, status: value })}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">To Do</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="review">Review</SelectItem>
                                  <SelectItem value="done">Done</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {filteredTasks.length === 0 && (
                    <div className="text-center py-12">
                      <ListTodo className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No tasks found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
