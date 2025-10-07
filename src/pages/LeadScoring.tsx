import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Save, TrendingUp, Users, Zap, Target, Clock, Award } from "lucide-react";

const LeadScoring = () => {
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);

  const scoringCriteria = [
    { id: 1, name: "Company Size", weight: 20, icon: Users },
    { id: 2, name: "Budget Range", weight: 25, icon: Target },
    { id: 3, name: "Engagement Level", weight: 30, icon: TrendingUp },
    { id: 4, name: "Response Time", weight: 15, icon: Clock },
    { id: 5, name: "Authority Level", weight: 10, icon: Award }
  ];

  const recentLeads = [
    { id: 1, name: "Acme Corp", score: 92, status: "hot", assignedTo: "John Smith", factors: ["High Budget", "Quick Response"] },
    { id: 2, name: "TechStart Inc", score: 78, status: "warm", assignedTo: "Sarah Johnson", factors: ["Medium Budget", "High Engagement"] },
    { id: 3, name: "Global Solutions", score: 85, status: "hot", assignedTo: "Mike Davis", factors: ["Large Company", "Decision Maker"] },
    { id: 4, name: "Local Business", score: 45, status: "cold", assignedTo: "Lisa Brown", factors: ["Small Budget", "Low Engagement"] }
  ];

  const assignmentRules = [
    { id: 1, name: "High Score Priority", condition: "Score > 80", action: "Assign to Senior Sales", active: true },
    { id: 2, name: "Geographic Match", condition: "Same Region", action: "Assign to Regional Rep", active: true },
    { id: 3, name: "Industry Expert", condition: "Industry Match", action: "Assign to Specialist", active: true },
    { id: 4, name: "Round Robin", condition: "Default", action: "Distribute Evenly", active: true }
  ];

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-red-500">Hot</Badge>;
    if (score >= 60) return <Badge className="bg-orange-500">Warm</Badge>;
    return <Badge variant="secondary">Cold</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lead Scoring & Auto-Assignment</h1>
          <p className="text-muted-foreground">Automatically score and route leads to the right sales rep</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Run Scoring
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Rules
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Leads Scored</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,247</div>
            <p className="text-sm text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">67</div>
            <p className="text-sm text-muted-foreground">+5 points improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto-Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">89%</div>
            <p className="text-sm text-muted-foreground">1,112 leads this month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="criteria" className="w-full">
        <TabsList>
          <TabsTrigger value="criteria">Scoring Criteria</TabsTrigger>
          <TabsTrigger value="rules">Assignment Rules</TabsTrigger>
          <TabsTrigger value="leads">Recent Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="criteria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configure Scoring Weights</CardTitle>
              <CardDescription>Adjust the importance of each factor (total must equal 100%)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {scoringCriteria.map((criterion) => {
                const Icon = criterion.icon;
                return (
                  <div key={criterion.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <Label>{criterion.name}</Label>
                      </div>
                      <span className="text-sm font-medium">{criterion.weight}%</span>
                    </div>
                    <Slider defaultValue={[criterion.weight]} max={50} step={5} />
                  </div>
                );
              })}

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Weight</span>
                  <span className="text-lg font-bold">100%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Point Thresholds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Hot Lead (Red)</Label>
                  <Input type="number" defaultValue={80} />
                </div>
                <div>
                  <Label>Warm Lead (Orange)</Label>
                  <Input type="number" defaultValue={60} />
                </div>
                <div>
                  <Label>Cold Lead (Gray)</Label>
                  <Input type="number" defaultValue={0} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Auto-Assignment Rules</CardTitle>
                  <CardDescription>Define how leads are automatically distributed</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Enable Auto-Assignment</Label>
                  <Switch checked={autoAssignEnabled} onCheckedChange={setAutoAssignEnabled} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {assignmentRules.map((rule) => (
                    <Card key={rule.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <Switch defaultChecked={rule.active} />
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex gap-2">
                            <span className="text-muted-foreground">When:</span>
                            <span>{rule.condition}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-muted-foreground">Then:</span>
                            <span>{rule.action}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <Button className="w-full mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add New Rule
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales Team Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["John Smith", "Sarah Johnson", "Mike Davis", "Lisa Brown"].map((rep, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{rep}</p>
                      <p className="text-sm text-muted-foreground">{15 + idx * 5} active leads</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{85 - idx * 10}%</p>
                        <p className="text-xs text-muted-foreground">capacity</p>
                      </div>
                      <Select defaultValue="active">
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="away">Away</SelectItem>
                          <SelectItem value="full">Full</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recently Scored Leads</CardTitle>
              <CardDescription>Latest leads with automatic scoring and assignment</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {recentLeads.map((lead) => (
                    <Card key={lead.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{lead.name}</h3>
                            <p className="text-sm text-muted-foreground">Assigned to: {lead.assignedTo}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{lead.score}</div>
                            {getScoreBadge(lead.score)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {lead.factors.map((factor, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadScoring;
