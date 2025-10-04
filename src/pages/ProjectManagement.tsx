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
import { FolderKanban, Plus, Calendar, Clock, DollarSign, CheckCircle2, Target, Users, ListTodo } from "lucide-react";

export default function ProjectManagement() {
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch projects
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

  // Fetch time entries
  const { data: timeEntries = [] } = useQuery({
    queryKey: ["time-entries", selectedProject],
    queryFn: async () => {
      if (!selectedProject) return [];
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("project_id", selectedProject)
        .order("entry_date", { ascending: false })
        .limit(10);
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

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === "in_progress").length,
    completedProjects: projects.filter((p) => p.status === "completed").length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "secondary",
      in_progress: "default",
      on_hold: "outline",
      completed: "default",
      cancelled: "destructive",
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

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Project Management</h1>
            <p className="text-muted-foreground">Track projects, tasks, and time</p>
          </div>
          <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Start a new project with your team</DialogDescription>
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
                    start_date: formData.get("start_date"),
                    end_date: formData.get("end_date"),
                    budget: parseFloat(formData.get("budget") as string) || null,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" />
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
                    <Label htmlFor="end_date">End Date</Label>
                    <Input id="end_date" name="end_date" type="date" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="budget">Budget</Label>
                  <Input id="budget" name="budget" type="number" step="0.01" />
                </div>
                <Button type="submit">Create Project</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedProjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalBudget.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setSelectedProject(project.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  </div>
                  <Badge variant={getStatusColor(project.status) as any}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span>{project.progress_percentage}%</span>
                    </div>
                    <Progress value={project.progress_percentage} />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {project.end_date ? new Date(project.end_date).toLocaleDateString() : "No deadline"}
                      </span>
                    </div>
                    <Badge variant={getPriorityColor(project.priority) as any} className="text-xs">
                      {project.priority}
                    </Badge>
                  </div>

                  {project.budget && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">${project.budget.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {projects.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No projects yet. Create your first project to get started!</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Project Details */}
        {selectedProject && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Details</CardTitle>
                <div className="flex gap-2">
                  <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Task</DialogTitle>
                        <DialogDescription>Add a new task to this project</DialogDescription>
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
                            due_date: formData.get("due_date"),
                            estimated_hours: parseFloat(formData.get("estimated_hours") as string) || null,
                          });
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="title">Task Title</Label>
                          <Input id="title" name="title" required />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" name="description" />
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
                        <Button type="submit">Create Task</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="outline" onClick={() => setSelectedProject(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tasks">
                <TabsList>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="milestones">Milestones</TabsTrigger>
                  <TabsTrigger value="time">Time Entries</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="space-y-4 mt-4">
                  {tasks.map((task) => (
                    <Card key={task.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{task.title}</CardTitle>
                            <CardDescription>{task.description}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={getStatusColor(task.status) as any}>
                              {task.status}
                            </Badge>
                            <Badge variant={getPriorityColor(task.priority) as any}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                          {task.estimated_hours && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.estimated_hours}h est.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <ListTodo className="h-12 w-12 mx-auto mb-2" />
                      No tasks yet
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="milestones" className="space-y-4 mt-4">
                  {milestones.map((milestone) => (
                    <Card key={milestone.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{milestone.name}</CardTitle>
                            <CardDescription>{milestone.description}</CardDescription>
                          </div>
                          {milestone.is_completed && (
                            <Badge variant="default">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          Due: {new Date(milestone.due_date).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {milestones.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-12 w-12 mx-auto mb-2" />
                      No milestones defined
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="time" className="space-y-4 mt-4">
                  {timeEntries.map((entry) => (
                    <Card key={entry.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm">{entry.description || "Time entry"}</CardTitle>
                            <CardDescription>
                              {new Date(entry.entry_date).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{entry.hours}h</div>
                            {entry.is_billable && (
                              <Badge variant="secondary" className="text-xs">Billable</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                  {timeEntries.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-2" />
                      No time entries logged
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
