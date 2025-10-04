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
  Map,
  Users,
  TrendingUp,
  Target,
  Plus,
  Search,
  Award,
  BarChart3,
  MapPin,
  Building2,
  UserPlus,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const TerritoryManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [territoryDialogOpen, setTerritoryDialogOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);

  // Mock data
  const stats = [
    { label: "Active Territories", value: "24", icon: Map },
    { label: "Sales Teams", value: "8", icon: Users },
    { label: "Team Members", value: "156", icon: UserPlus },
    { label: "Avg. Quota Achievement", value: "94%", icon: Target },
  ];

  const territories = [
    {
      id: "1",
      name: "North America - Enterprise",
      type: "geographic",
      region: "North America",
      assigned_reps: 12,
      target_quota: 5000000,
      achieved_quota: 4750000,
      achievement_rate: 95,
      is_active: true,
    },
    {
      id: "2",
      name: "Healthcare Industry",
      type: "industry",
      industry_focus: ["Healthcare", "Medical Devices"],
      assigned_reps: 8,
      target_quota: 3000000,
      achieved_quota: 2850000,
      achievement_rate: 95,
      is_active: true,
    },
    {
      id: "3",
      name: "West Coast - SMB",
      type: "geographic",
      region: "West Coast",
      assigned_reps: 15,
      target_quota: 2500000,
      achieved_quota: 2125000,
      achievement_rate: 85,
      is_active: true,
    },
  ];

  const teams = [
    {
      id: "1",
      name: "Enterprise Sales Team",
      type: "sales",
      manager_name: "Sarah Johnson",
      members: 25,
      territories: 5,
      quota: 10000000,
      achievement: 92,
      is_active: true,
    },
    {
      id: "2",
      name: "Account Management",
      type: "account_management",
      manager_name: "Mike Chen",
      members: 18,
      territories: 3,
      quota: 8000000,
      achievement: 98,
      is_active: true,
    },
    {
      id: "3",
      name: "Customer Success",
      type: "customer_success",
      manager_name: "Lisa Anderson",
      members: 22,
      territories: 4,
      quota: 5000000,
      achievement: 103,
      is_active: true,
    },
  ];

  const performance = [
    {
      id: "1",
      rep_name: "John Smith",
      team: "Enterprise Sales",
      territory: "North America - Enterprise",
      revenue: 520000,
      deals_closed: 12,
      win_rate: 68,
      quota: 500000,
      achievement: 104,
      commission: 26000,
    },
    {
      id: "2",
      rep_name: "Emily Davis",
      team: "Account Management",
      territory: "Healthcare Industry",
      revenue: 480000,
      deals_closed: 15,
      win_rate: 72,
      quota: 450000,
      achievement: 107,
      commission: 28800,
    },
    {
      id: "3",
      rep_name: "David Wilson",
      team: "Enterprise Sales",
      territory: "West Coast - SMB",
      revenue: 395000,
      deals_closed: 18,
      win_rate: 65,
      quota: 400000,
      achievement: 99,
      commission: 19750,
    },
  ];

  const commissionPlans = [
    {
      id: "1",
      name: "Standard Sales Commission",
      type: "tiered",
      base_rate: 5,
      applies_to: "all_sales",
      assigned_reps: 45,
      is_active: true,
    },
    {
      id: "2",
      name: "New Business Accelerator",
      type: "percentage",
      base_rate: 10,
      applies_to: "new_business",
      assigned_reps: 22,
      is_active: true,
    },
    {
      id: "3",
      name: "Renewal Commission",
      type: "flat_rate",
      base_rate: 3,
      applies_to: "renewals",
      assigned_reps: 18,
      is_active: true,
    },
  ];

  const getAchievementBadge = (rate: number) => {
    if (rate >= 100) return <Badge className="bg-green-500">On Target</Badge>;
    if (rate >= 80) return <Badge variant="secondary">In Progress</Badge>;
    return <Badge variant="destructive">Below Target</Badge>;
  };

  const handleAddTerritory = () => {
    toast({ title: "Territory created", description: "New territory created successfully" });
    setTerritoryDialogOpen(false);
  };

  const handleAddTeam = () => {
    toast({ title: "Team created", description: "New sales team created successfully" });
    setTeamDialogOpen(false);
  };

  const handleAddCommission = () => {
    toast({ title: "Commission plan created", description: "New commission plan created successfully" });
    setCommissionDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Territory & Team Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage sales territories, teams, and performance
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
                </div>
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="territories" className="space-y-4">
          <TabsList>
            <TabsTrigger value="territories">Territories</TabsTrigger>
            <TabsTrigger value="teams">Sales Teams</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="commissions">Commission Plans</TabsTrigger>
          </TabsList>

          {/* Territories Tab */}
          <TabsContent value="territories" className="space-y-4">
            <Card className="p-4">
              <div className="flex gap-4 items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search territories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Dialog open={territoryDialogOpen} onOpenChange={setTerritoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Territory
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Territory</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Territory Name</Label>
                        <Input placeholder="e.g., North America - Enterprise" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Territory description..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Territory Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="geographic">Geographic</SelectItem>
                              <SelectItem value="industry">Industry</SelectItem>
                              <SelectItem value="account_size">Account Size</SelectItem>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Target Quota ($)</Label>
                          <Input type="number" placeholder="0.00" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Region</Label>
                          <Input placeholder="e.g., North America" />
                        </div>
                        <div className="space-y-2">
                          <Label>Country</Label>
                          <Input placeholder="e.g., United States" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>State/Province</Label>
                          <Input placeholder="e.g., California" />
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input placeholder="e.g., San Francisco" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setTerritoryDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddTerritory}>Create Territory</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {territories.map((territory) => (
                <Card key={territory.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{territory.name}</p>
                        <p className="text-sm text-muted-foreground">
                          <Badge variant="outline">{territory.type}</Badge>
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Territory</DropdownMenuItem>
                        <DropdownMenuItem>Assign Reps</DropdownMenuItem>
                        <DropdownMenuItem>View Analytics</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete Territory
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Assigned Reps</span>
                      <span className="font-semibold">{territory.assigned_reps}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Target Quota</span>
                      <span className="font-semibold">
                        ${(territory.target_quota / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Achievement</span>
                      {getAchievementBadge(territory.achievement_rate)}
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span className="font-semibold">{territory.achievement_rate}%</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${Math.min(territory.achievement_rate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-4">
            <Card className="p-4">
              <div className="flex gap-4 items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search teams..." className="pl-10" />
                </div>
                <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Team Name</Label>
                        <Input placeholder="e.g., Enterprise Sales Team" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Team description..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Team Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="account_management">Account Management</SelectItem>
                              <SelectItem value="customer_success">Customer Success</SelectItem>
                              <SelectItem value="support">Support</SelectItem>
                              <SelectItem value="business_development">Business Development</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Team Manager</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select manager" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Sarah Johnson</SelectItem>
                              <SelectItem value="2">Mike Chen</SelectItem>
                              <SelectItem value="3">Lisa Anderson</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setTeamDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddTeam}>Create Team</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Territories</TableHead>
                    <TableHead>Quota</TableHead>
                    <TableHead>Achievement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{team.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>{team.manager_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {team.members}
                        </div>
                      </TableCell>
                      <TableCell>{team.territories}</TableCell>
                      <TableCell className="font-semibold">
                        ${(team.quota / 1000000).toFixed(1)}M
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{team.achievement}%</span>
                          {getAchievementBadge(team.achievement)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Team</DropdownMenuItem>
                            <DropdownMenuItem>Edit Team</DropdownMenuItem>
                            <DropdownMenuItem>Manage Members</DropdownMenuItem>
                            <DropdownMenuItem>View Performance</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card className="p-4">
              <div className="flex gap-4">
                <Select defaultValue="monthly">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search reps..." className="pl-10" />
                </div>
              </div>
            </Card>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rep Name</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Territory</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Deals</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>Quota</TableHead>
                    <TableHead>Achievement</TableHead>
                    <TableHead>Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performance.map((perf) => (
                    <TableRow key={perf.id}>
                      <TableCell className="font-medium">{perf.rep_name}</TableCell>
                      <TableCell>{perf.team}</TableCell>
                      <TableCell className="text-sm">{perf.territory}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ${perf.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell>{perf.deals_closed}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{perf.win_rate}%</Badge>
                      </TableCell>
                      <TableCell>${perf.quota.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{perf.achievement}%</span>
                          {getAchievementBadge(perf.achievement)}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${perf.commission.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Commission Plans Tab */}
          <TabsContent value="commissions" className="space-y-4">
            <Card className="p-4">
              <div className="flex gap-4 items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search commission plans..." className="pl-10" />
                </div>
                <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Commission Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Commission Plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Plan Name</Label>
                        <Input placeholder="e.g., Standard Sales Commission" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Plan description..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Plan Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage</SelectItem>
                              <SelectItem value="tiered">Tiered</SelectItem>
                              <SelectItem value="flat_rate">Flat Rate</SelectItem>
                              <SelectItem value="bonus">Bonus</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Base Rate (%)</Label>
                          <Input type="number" placeholder="0.00" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Applies To</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select scope" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all_sales">All Sales</SelectItem>
                            <SelectItem value="new_business">New Business</SelectItem>
                            <SelectItem value="renewals">Renewals</SelectItem>
                            <SelectItem value="upsells">Upsells</SelectItem>
                            <SelectItem value="specific_products">Specific Products</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setCommissionDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddCommission}>Create Plan</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {commissionPlans.map((plan) => (
                <Card key={plan.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          <Badge variant="outline">{plan.type}</Badge>
                        </p>
                      </div>
                    </div>
                    {plan.is_active && <Badge variant="default">Active</Badge>}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Base Rate</span>
                      <span className="font-semibold text-lg">{plan.base_rate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Applies To</span>
                      <Badge variant="secondary">{plan.applies_to.replace('_', ' ')}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Assigned Reps</span>
                      <span className="font-semibold">{plan.assigned_reps}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit Plan
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Assign Reps
                    </Button>
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

export default TerritoryManagement;
