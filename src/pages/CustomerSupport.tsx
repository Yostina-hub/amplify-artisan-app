import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Headphones,
  TrendingUp,
  Clock,
  Star,
  Plus,
  Search,
  MessageSquare,
  Book,
  AlertCircle,
  CheckCircle2,
  Timer,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Eye,
  Phone,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ClickToCall } from "@/components/ClickToCall";

const CustomerSupport = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [slaDialogOpen, setSlaDialogOpen] = useState(false);

  // Mock data
  const stats = [
    { label: "Open Tickets", value: "47", change: "-5 from yesterday", icon: Headphones },
    { label: "Avg Response Time", value: "2.4h", change: "12% faster", icon: Clock },
    { label: "Resolution Rate", value: "94%", change: "+3% this week", icon: TrendingUp },
    { label: "CSAT Score", value: "4.6/5", change: "+0.2 this month", icon: Star },
  ];

  const tickets = [
    {
      id: "1",
      ticket_number: "TKT-001234",
      subject: "Login issues with mobile app",
      customer_name: "John Smith",
      customer_phone: "+1-555-0123",
      priority: "high",
      status: "in_progress",
      category: "technical",
      assigned_to: "Sarah Johnson",
      created_at: "2025-10-03T10:30:00Z",
      first_response: true,
      sla_breach: false,
    },
    {
      id: "2",
      ticket_number: "TKT-001235",
      subject: "Billing discrepancy on latest invoice",
      customer_name: "Emily Davis",
      customer_phone: "+1-555-0124",
      priority: "urgent",
      status: "open",
      category: "billing",
      assigned_to: null,
      created_at: "2025-10-04T08:15:00Z",
      first_response: false,
      sla_breach: true,
    },
    {
      id: "3",
      ticket_number: "TKT-001236",
      subject: "Feature request: Dark mode",
      customer_name: "Mike Chen",
      customer_phone: "+1-555-0125",
      priority: "low",
      status: "pending",
      category: "feature_request",
      assigned_to: "David Wilson",
      created_at: "2025-10-02T14:20:00Z",
      first_response: true,
      sla_breach: false,
    },
  ];

  const knowledgeBase = [
    {
      id: "1",
      title: "How to reset your password",
      category: "Account Management",
      status: "published",
      is_public: true,
      view_count: 1543,
      helpful_count: 234,
      not_helpful_count: 12,
      author: "Sarah Johnson",
      last_updated: "2025-09-15",
    },
    {
      id: "2",
      title: "Setting up two-factor authentication",
      category: "Security",
      status: "published",
      is_public: true,
      view_count: 892,
      helpful_count: 178,
      not_helpful_count: 8,
      author: "Mike Chen",
      last_updated: "2025-09-20",
    },
    {
      id: "3",
      title: "Understanding your billing cycle",
      category: "Billing",
      status: "published",
      is_public: true,
      view_count: 567,
      helpful_count: 98,
      not_helpful_count: 15,
      author: "Lisa Anderson",
      last_updated: "2025-09-25",
    },
  ];

  const slaMetrics = [
    {
      id: "1",
      policy_name: "Critical Issues",
      priority: "urgent",
      first_response: "1 hour",
      resolution_time: "4 hours",
      tickets_this_month: 23,
      sla_met: 21,
      sla_breached: 2,
      compliance_rate: 91,
    },
    {
      id: "2",
      policy_name: "High Priority",
      priority: "high",
      first_response: "2 hours",
      resolution_time: "8 hours",
      tickets_this_month: 89,
      sla_met: 85,
      sla_breached: 4,
      compliance_rate: 96,
    },
    {
      id: "3",
      policy_name: "Standard Support",
      priority: "medium",
      first_response: "4 hours",
      resolution_time: "24 hours",
      tickets_this_month: 234,
      sla_met: 229,
      sla_breached: 5,
      compliance_rate: 98,
    },
  ];

  const satisfactionData = [
    {
      month: "September",
      csat_score: 4.4,
      nps_score: 67,
      responses: 156,
      positive: 142,
      negative: 14,
    },
    {
      month: "October",
      csat_score: 4.6,
      nps_score: 72,
      responses: 189,
      positive: 175,
      negative: 14,
    },
  ];

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; className?: string }> = {
      low: { variant: "secondary" },
      medium: { variant: "default" },
      high: { variant: "default", className: "bg-orange-500" },
      urgent: { variant: "destructive" },
    };
    const config = variants[priority] || variants.medium;
    return <Badge variant={config.variant} className={config.className}>{priority}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      open: "secondary",
      in_progress: "default",
      pending: "secondary",
      resolved: "default",
      closed: "secondary",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace('_', ' ')}</Badge>;
  };

  const handleCreateTicket = () => {
    toast({ title: "Ticket created", description: "Support ticket created successfully" });
    setTicketDialogOpen(false);
  };

  const handleCreateArticle = () => {
    toast({ title: "Article created", description: "Knowledge base article created successfully" });
    setArticleDialogOpen(false);
  };

  const handleCreateSLA = () => {
    toast({ title: "SLA policy created", description: "New SLA policy created successfully" });
    setSlaDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customer Support</h1>
            <p className="text-muted-foreground mt-1">
              Manage tickets, knowledge base, and customer satisfaction
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-green-500 mt-1">{stat.change}</p>
                </div>
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="tickets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="sla">SLA Policies</TabsTrigger>
            <TabsTrigger value="satisfaction">Customer Satisfaction</TabsTrigger>
          </TabsList>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4">
            <Card className="p-4">
              <div className="flex gap-4 items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tickets</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Ticket
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Support Ticket</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input placeholder="Brief description of the issue" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Detailed description..." rows={5} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select defaultValue="medium">
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
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technical">Technical</SelectItem>
                              <SelectItem value="billing">Billing</SelectItem>
                              <SelectItem value="feature_request">Feature Request</SelectItem>
                              <SelectItem value="bug_report">Bug Report</SelectItem>
                              <SelectItem value="general">General</SelectItem>
                              <SelectItem value="account">Account</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Customer</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">John Smith</SelectItem>
                              <SelectItem value="2">Emily Davis</SelectItem>
                              <SelectItem value="3">Mike Chen</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Assign To</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select agent" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Sarah Johnson</SelectItem>
                              <SelectItem value="2">David Wilson</SelectItem>
                              <SelectItem value="3">Lisa Anderson</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setTicketDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTicket}>Create Ticket</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {ticket.ticket_number}
                          {ticket.sla_breach && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {ticket.customer_name}
                          {ticket.customer_phone && (
                            <ClickToCall 
                              phoneNumber={ticket.customer_phone}
                              contactName={ticket.customer_name}
                              variant="ghost"
                              size="icon"
                              className="text-success"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ticket.category.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>{ticket.assigned_to || "Unassigned"}</TableCell>
                      <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Comment
                            </DropdownMenuItem>
                            <DropdownMenuItem>Assign Agent</DropdownMenuItem>
                            <DropdownMenuItem>Change Priority</DropdownMenuItem>
                            <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge" className="space-y-4">
            <Card className="p-4">
              <div className="flex gap-4 items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search articles..." className="pl-10" />
                </div>
                <Dialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Article
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Create Knowledge Base Article</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input placeholder="Article title" />
                      </div>
                      <div className="space-y-2">
                        <Label>Summary</Label>
                        <Textarea placeholder="Brief summary..." rows={2} />
                      </div>
                      <div className="space-y-2">
                        <Label>Content</Label>
                        <Textarea placeholder="Article content..." rows={8} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input placeholder="e.g., Account Management" />
                        </div>
                        <div className="space-y-2">
                          <Label>Subcategory</Label>
                          <Input placeholder="Optional subcategory" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="public" className="rounded" />
                        <Label htmlFor="public">Make this article public</Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setArticleDialogOpen(false)}>
                        Save as Draft
                      </Button>
                      <Button onClick={handleCreateArticle}>Publish Article</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {knowledgeBase.map((article) => (
                <Card key={article.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Book className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold line-clamp-2">{article.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          <Badge variant="outline">{article.category}</Badge>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Views</span>
                      <span className="font-semibold">{article.view_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Helpful</span>
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-3 w-3 text-green-500" />
                        <span className="font-semibold">{article.helpful_count}</span>
                        <ThumbsDown className="h-3 w-3 text-red-500 ml-2" />
                        <span className="font-semibold">{article.not_helpful_count}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Author</span>
                      <span className="font-medium">{article.author}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* SLA Policies Tab */}
          <TabsContent value="sla" className="space-y-4">
            <Card className="p-4">
              <div className="flex justify-end">
                <Dialog open={slaDialogOpen} onOpenChange={setSlaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New SLA Policy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create SLA Policy</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Policy Name</Label>
                        <Input placeholder="e.g., Critical Issues" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Policy description..." />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Priority Level</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>First Response (hours)</Label>
                          <Input type="number" placeholder="0" />
                        </div>
                        <div className="space-y-2">
                          <Label>Resolution (hours)</Label>
                          <Input type="number" placeholder="0" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="business-hours" className="rounded" defaultChecked />
                        <Label htmlFor="business-hours">Apply during business hours only</Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSlaDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateSLA}>Create Policy</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy Name</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>First Response</TableHead>
                    <TableHead>Resolution Time</TableHead>
                    <TableHead>Tickets (This Month)</TableHead>
                    <TableHead>SLA Met</TableHead>
                    <TableHead>SLA Breached</TableHead>
                    <TableHead>Compliance Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slaMetrics.map((sla) => (
                    <TableRow key={sla.id}>
                      <TableCell className="font-medium">{sla.policy_name}</TableCell>
                      <TableCell>{getPriorityBadge(sla.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          {sla.first_response}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {sla.resolution_time}
                        </div>
                      </TableCell>
                      <TableCell>{sla.tickets_this_month}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-semibold">{sla.sla_met}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="font-semibold">{sla.sla_breached}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{sla.compliance_rate}%</span>
                          <Badge 
                            variant={sla.compliance_rate >= 95 ? "default" : "secondary"}
                          >
                            {sla.compliance_rate >= 95 ? "Excellent" : "Good"}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Customer Satisfaction Tab */}
          <TabsContent value="satisfaction" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {satisfactionData.map((data, index) => (
                <Card key={index} className="p-6">
                  <h3 className="font-semibold text-lg mb-4">{data.month} 2025</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">CSAT Score</span>
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="text-2xl font-bold">{data.csat_score}/5</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">NPS Score</span>
                      <span className="text-2xl font-bold">{data.nps_score}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Responses</span>
                      <span className="font-semibold">{data.responses}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Positive Feedback</span>
                      <span className="font-semibold text-green-600">{data.positive}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Negative Feedback</span>
                      <span className="font-semibold text-red-600">{data.negative}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerSupport;
