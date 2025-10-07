import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Network, Users, UserPlus, Building, Phone, Mail, MessageSquare, TrendingUp, Shield, Star, CircleAlert as AlertCircle, CircleCheck as CheckCircle2, Link as LinkIcon, Plus, CreditCard as Edit, Trash2 } from "lucide-react";
import { PageHelp } from "@/components/PageHelp";

interface Contact {
  id: string;
  name: string;
  title: string;
  department: string;
  level: "executive" | "manager" | "individual";
  influence: "high" | "medium" | "low";
  sentiment: "champion" | "supporter" | "neutral" | "detractor";
  lastContact: string;
  interactions: number;
  x: number;
  y: number;
}

interface Relationship {
  from: string;
  to: string;
  type: "reports_to" | "works_with" | "influences";
  strength: "strong" | "medium" | "weak";
}

interface Account {
  id: string;
  name: string;
  contacts: Contact[];
  relationships: Relationship[];
}

const mockAccount: Account = {
  id: "1",
  name: "Acme Corporation",
  contacts: [
    {
      id: "1",
      name: "Sarah Johnson",
      title: "CEO",
      department: "Executive",
      level: "executive",
      influence: "high",
      sentiment: "supporter",
      lastContact: "2 days ago",
      interactions: 8,
      x: 400,
      y: 100
    },
    {
      id: "2",
      name: "Michael Chen",
      title: "CTO",
      department: "Technology",
      level: "executive",
      influence: "high",
      sentiment: "champion",
      lastContact: "5 days ago",
      interactions: 15,
      x: 250,
      y: 250
    },
    {
      id: "3",
      name: "Lisa Anderson",
      title: "VP of Sales",
      department: "Sales",
      level: "executive",
      influence: "high",
      sentiment: "supporter",
      lastContact: "1 day ago",
      interactions: 22,
      x: 550,
      y: 250
    },
    {
      id: "4",
      name: "David Martinez",
      title: "Sales Manager",
      department: "Sales",
      level: "manager",
      influence: "medium",
      sentiment: "neutral",
      lastContact: "10 days ago",
      interactions: 5,
      x: 550,
      y: 400
    },
    {
      id: "5",
      name: "Emily Taylor",
      title: "IT Director",
      department: "Technology",
      level: "manager",
      influence: "medium",
      sentiment: "champion",
      lastContact: "3 days ago",
      interactions: 12,
      x: 250,
      y: 400
    },
    {
      id: "6",
      name: "Robert Wilson",
      title: "Operations Manager",
      department: "Operations",
      level: "manager",
      influence: "low",
      sentiment: "detractor",
      lastContact: "45 days ago",
      interactions: 2,
      x: 400,
      y: 400
    }
  ],
  relationships: [
    { from: "2", to: "1", type: "reports_to", strength: "strong" },
    { from: "3", to: "1", type: "reports_to", strength: "strong" },
    { from: "5", to: "2", type: "reports_to", strength: "strong" },
    { from: "4", to: "3", type: "reports_to", strength: "strong" },
    { from: "6", to: "3", type: "reports_to", strength: "medium" },
    { from: "2", to: "3", type: "works_with", strength: "strong" },
    { from: "5", to: "4", type: "works_with", strength: "medium" },
    { from: "2", to: "5", type: "influences", strength: "strong" }
  ]
};

export default function RelationshipMap() {
  const [selectedAccount] = useState<Account>(mockAccount);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [viewMode, setViewMode] = useState<"hierarchy" | "influence" | "engagement">("hierarchy");
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const getSentimentColor = (sentiment: string) => {
    const colors = {
      champion: "bg-green-500",
      supporter: "bg-blue-500",
      neutral: "bg-gray-400",
      detractor: "bg-red-500"
    };
    return colors[sentiment as keyof typeof colors];
  };

  const getSentimentBadge = (sentiment: string) => {
    const styles = {
      champion: "bg-green-100 text-green-800 border-green-300",
      supporter: "bg-blue-100 text-blue-800 border-blue-300",
      neutral: "bg-gray-100 text-gray-800 border-gray-300",
      detractor: "bg-red-100 text-red-800 border-red-300"
    };
    return styles[sentiment as keyof typeof styles];
  };

  const getInfluenceBadge = (influence: string) => {
    const styles = {
      high: "bg-purple-100 text-purple-800 border-purple-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      low: "bg-gray-100 text-gray-800 border-gray-300"
    };
    return styles[influence as keyof typeof styles];
  };

  const getLevelIcon = (level: string) => {
    if (level === "executive") return <Star className="h-3 w-3" />;
    if (level === "manager") return <Shield className="h-3 w-3" />;
    return <Users className="h-3 w-3" />;
  };

  const champions = selectedAccount.contacts.filter(c => c.sentiment === "champion");
  const supporters = selectedAccount.contacts.filter(c => c.sentiment === "supporter");
  const neutrals = selectedAccount.contacts.filter(c => c.sentiment === "neutral");
  const detractors = selectedAccount.contacts.filter(c => c.sentiment === "detractor");

  return (
    <div className="space-y-6">
      <PageHelp
        title="Relationship Mapping"
        description="Visualize and manage stakeholder relationships within accounts."
        features={[
          "Interactive org chart visualization",
          "Stakeholder influence mapping",
          "Champion identification",
          "Relationship strength tracking",
          "Engagement history",
          "Multi-threading strategy"
        ]}
        tips={[
          "Identify and engage champions early",
          "Map reporting relationships accurately",
          "Track sentiment after each interaction",
          "Build relationships at multiple levels",
          "Update contact information regularly"
        ]}
      />

      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Network className="h-8 w-8 text-primary" />
          Relationship Map
        </h2>
        <p className="text-muted-foreground">
          Visualize stakeholder relationships and influence
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Champions</CardTitle>
            <Star className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{champions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Strong advocates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supporters</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{supporters.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Positive sentiment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{neutrals.length + detractors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Need engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedAccount.contacts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Mapped relationships</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Relationship Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedAccount.name}</CardTitle>
                <CardDescription>Stakeholder Relationship Map</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hierarchy">Hierarchy</SelectItem>
                    <SelectItem value="influence">Influence</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Contact</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>First Name</Label>
                          <Input placeholder="John" />
                        </div>
                        <div className="space-y-2">
                          <Label>Last Name</Label>
                          <Input placeholder="Doe" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input placeholder="VP of Sales" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="executive">Executive</SelectItem>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="operations">Operations</SelectItem>
                              <SelectItem value="finance">Finance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Level</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="executive">Executive</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="individual">Individual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" placeholder="john@company.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input placeholder="+1 (555) 123-4567" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Reports To</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contact" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedAccount.contacts.map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name} - {c.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea placeholder="Add notes about this contact..." rows={3} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddContactOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => setIsAddContactOpen(false)}>
                          Add Contact
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-[500px] border rounded-lg bg-gradient-to-br from-gray-50 to-white p-4 overflow-hidden">
              {/* SVG for relationship lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {selectedAccount.relationships.map((rel, i) => {
                  const fromContact = selectedAccount.contacts.find(c => c.id === rel.from);
                  const toContact = selectedAccount.contacts.find(c => c.id === rel.to);
                  if (!fromContact || !toContact) return null;

                  const strokeWidth = rel.strength === "strong" ? 3 : rel.strength === "medium" ? 2 : 1;
                  const strokeDasharray = rel.type === "influences" ? "5,5" : rel.type === "works_with" ? "2,2" : "none";

                  return (
                    <line
                      key={i}
                      x1={fromContact.x}
                      y1={fromContact.y}
                      x2={toContact.x}
                      y2={toContact.y}
                      stroke="#94a3b8"
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      opacity={0.4}
                    />
                  );
                })}
              </svg>

              {/* Contact nodes */}
              {selectedAccount.contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  style={{
                    position: "absolute",
                    left: contact.x - 60,
                    top: contact.y - 40,
                    width: 120
                  }}
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    selectedContact?.id === contact.id ? "scale-110 z-10" : ""
                  }`}
                >
                  <div className={`p-3 rounded-lg border-2 bg-white shadow-lg ${
                    selectedContact?.id === contact.id ? "border-primary shadow-xl" : "border-gray-200"
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className={`w-2 h-2 rounded-full ${getSentimentColor(contact.sentiment)}`} />
                      {getLevelIcon(contact.level)}
                    </div>
                    <div className="text-xs font-bold truncate">{contact.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{contact.title}</div>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {contact.interactions}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <h4 className="font-semibold mb-2">Sentiment</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span>Champion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span>Supporter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      <span>Neutral</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span>Detractor</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Relationships</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-gray-400" />
                      <span>Reports To</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-gray-400" style={{ backgroundImage: "repeating-linear-gradient(to right, #94a3b8 0, #94a3b8 2px, transparent 2px, transparent 4px)" }} />
                      <span>Works With</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-0.5 bg-gray-400" style={{ backgroundImage: "repeating-linear-gradient(to right, #94a3b8 0, #94a3b8 5px, transparent 5px, transparent 10px)" }} />
                      <span>Influences</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Level</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Star className="h-3 w-3" />
                      <span>Executive</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3" />
                      <span>Manager</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span>Individual</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedContact ? "Contact Details" : "Select a Contact"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedContact ? (
              <Tabs defaultValue="info">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg">{selectedContact.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedContact.title}</p>
                      <p className="text-sm text-muted-foreground">{selectedContact.department}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Sentiment</span>
                        <Badge variant="outline" className={getSentimentBadge(selectedContact.sentiment)}>
                          {selectedContact.sentiment}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Influence</span>
                        <Badge variant="outline" className={getInfluenceBadge(selectedContact.influence)}>
                          {selectedContact.influence}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Level</span>
                        <Badge variant="outline">
                          {selectedContact.level}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-3 border-t space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Contact</span>
                        <span className="font-medium">{selectedContact.lastContact}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Interactions</span>
                        <span className="font-medium">{selectedContact.interactions}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3">
                      <Button size="sm" className="flex-1">
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-3">
                  <div className="space-y-2">
                    {[
                      { type: "call", date: "2 days ago", note: "Discussed Q4 implementation timeline" },
                      { type: "email", date: "5 days ago", note: "Sent product documentation" },
                      { type: "meeting", date: "1 week ago", note: "Demo session with technical team" },
                      { type: "email", date: "2 weeks ago", note: "Follow-up on proposal" }
                    ].map((activity, i) => (
                      <div key={i} className="p-2 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          {activity.type === "call" && <Phone className="h-3 w-3" />}
                          {activity.type === "email" && <Mail className="h-3 w-3" />}
                          {activity.type === "meeting" && <Users className="h-3 w-3" />}
                          <span className="text-xs font-medium">{activity.type}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{activity.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{activity.note}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Click on a contact in the map to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analysis Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement Strategy</CardTitle>
            <CardDescription>AI-powered recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <h4 className="font-semibold text-green-900">Champions Identified</h4>
                </div>
                <p className="text-sm text-green-800">
                  Emily Taylor (IT Director) and Michael Chen (CTO) are strong advocates. Leverage them for internal selling.
                </p>
              </div>

              <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <h4 className="font-semibold text-orange-900">Action Required</h4>
                </div>
                <p className="text-sm text-orange-800">
                  Robert Wilson (Operations Manager) shows detractor sentiment. Schedule 1-on-1 to understand concerns.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Multi-threading Opportunity</h4>
                </div>
                <p className="text-sm text-blue-800">
                  You have strong relationships in Technology and Sales. Expand to Operations and Finance for broader support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coverage Analysis</CardTitle>
            <CardDescription>Relationship strength by department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { dept: "Executive", coverage: 100, contacts: 1, strength: "strong" },
                { dept: "Technology", coverage: 100, contacts: 2, strength: "strong" },
                { dept: "Sales", coverage: 75, contacts: 2, strength: "medium" },
                { dept: "Operations", coverage: 25, contacts: 1, strength: "weak" }
              ].map((dept, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dept.dept}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {dept.contacts} contacts
                      </Badge>
                      <span className="text-muted-foreground">{dept.coverage}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          dept.strength === "strong" ? "bg-green-500" :
                          dept.strength === "medium" ? "bg-yellow-500" :
                          "bg-red-500"
                        }`}
                        style={{ width: `${dept.coverage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
