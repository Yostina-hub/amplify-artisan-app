import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Clock, CheckCircle2, AlertCircle, Mail, Phone, FileText, Handshake, DollarSign, Users } from "lucide-react";

const CustomerJourney = () => {
  const [selectedCustomer, setSelectedCustomer] = useState("acme-corp");

  const journeyStages = [
    {
      stage: "Lead Capture",
      date: "2024-10-15",
      duration: "0 days",
      status: "completed",
      icon: Users,
      activities: [
        { type: "Web Form", description: "Submitted contact form from pricing page", timestamp: "2024-10-15 14:32" },
        { type: "Auto-assigned", description: "Assigned to Sarah Johnson (Regional Sales)", timestamp: "2024-10-15 14:33" }
      ]
    },
    {
      stage: "First Contact",
      date: "2024-10-16",
      duration: "1 day",
      status: "completed",
      icon: Phone,
      activities: [
        { type: "Email Sent", description: "Welcome email with calendar link", timestamp: "2024-10-16 09:15" },
        { type: "Call Scheduled", description: "Discovery call booked for Oct 18", timestamp: "2024-10-16 11:22" }
      ]
    },
    {
      stage: "Discovery",
      date: "2024-10-18",
      duration: "2 days",
      status: "completed",
      icon: Phone,
      activities: [
        { type: "Discovery Call", description: "45-minute needs assessment (recorded)", timestamp: "2024-10-18 10:00" },
        { type: "Notes Added", description: "Company size: 150, Budget: $50K, Timeline: Q4", timestamp: "2024-10-18 10:52" },
        { type: "Lead Scored", description: "Score updated from 45 to 82 (Hot)", timestamp: "2024-10-18 11:00" }
      ]
    },
    {
      stage: "Demo & Proposal",
      date: "2024-10-22",
      duration: "4 days",
      status: "completed",
      icon: FileText,
      activities: [
        { type: "Demo Delivered", description: "Custom demo focusing on automation features", timestamp: "2024-10-22 14:00" },
        { type: "Proposal Sent", description: "Customized proposal for Enterprise plan", timestamp: "2024-10-23 16:45" },
        { type: "Follow-up", description: "Answered technical questions via email", timestamp: "2024-10-25 11:15" }
      ]
    },
    {
      stage: "Negotiation",
      date: "2024-10-28",
      duration: "6 days",
      status: "completed",
      icon: Handshake,
      activities: [
        { type: "Price Negotiation", description: "Discussed volume discount", timestamp: "2024-10-28 13:00" },
        { type: "Stakeholder Meeting", description: "Met with CFO and IT Director", timestamp: "2024-10-30 15:00" },
        { type: "Revised Proposal", description: "Updated terms with 15% discount", timestamp: "2024-11-01 09:30" }
      ]
    },
    {
      stage: "Closed Won",
      date: "2024-11-05",
      duration: "15 days total",
      status: "completed",
      icon: CheckCircle2,
      activities: [
        { type: "Contract Signed", description: "Annual contract for $42,500", timestamp: "2024-11-05 16:20" },
        { type: "Payment Received", description: "First payment processed", timestamp: "2024-11-06 10:15" },
        { type: "Onboarding Started", description: "Welcome email and training scheduled", timestamp: "2024-11-06 14:00" }
      ]
    }
  ];

  const customers = [
    { id: "acme-corp", name: "Acme Corp", stage: "Closed Won", value: 42500, duration: 21 },
    { id: "techstart", name: "TechStart Inc", stage: "Negotiation", value: 35000, duration: 18 },
    { id: "global-sol", name: "Global Solutions", stage: "Demo", value: 58000, duration: 12 }
  ];

  const metrics = {
    avgCycleTime: 28,
    conversionRate: 34,
    avgDealSize: 45000,
    touchPoints: 12
  };

  const bottlenecks = [
    {
      stage: "Demo to Proposal",
      issue: "Average 8 days delay",
      impact: "20% of deals stall here",
      recommendation: "Automate proposal generation"
    },
    {
      stage: "Stakeholder Engagement",
      issue: "Multiple decision makers",
      impact: "Extends cycle by 12 days",
      recommendation: "Implement champion program"
    }
  ];

  const getStageIcon = (IconComponent: any, status: string) => {
    return (
      <div className={`p-3 rounded-full ${status === "completed" ? "bg-green-100" : "bg-blue-100"}`}>
        <IconComponent className={`h-6 w-6 ${status === "completed" ? "text-green-600" : "text-blue-600"}`} />
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lead-to-Customer Journey</h1>
          <p className="text-muted-foreground">Visualize the complete customer acquisition path</p>
        </div>
        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name} - {customer.stage}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Sales Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.avgCycleTime} days</div>
            <p className="text-sm text-muted-foreground">-3 days from last quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.conversionRate}%</div>
            <p className="text-sm text-muted-foreground">Lead to customer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Avg Deal Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${(metrics.avgDealSize / 1000).toFixed(0)}K</div>
            <p className="text-sm text-muted-foreground">Closed deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Avg Touchpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.touchPoints}</div>
            <p className="text-sm text-muted-foreground">Before conversion</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Journey Timeline</CardTitle>
              <CardDescription>Complete journey from lead to customer</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {journeyStages.map((stage, idx) => (
                    <div key={idx} className="relative">
                      {idx < journeyStages.length - 1 && (
                        <div className="absolute left-[23px] top-[60px] w-0.5 h-[calc(100%+24px)] bg-border" />
                      )}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 relative z-10">
                          {getStageIcon(stage.icon, stage.status)}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{stage.stage}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{stage.date}</span>
                                <span>•</span>
                                <span>{stage.duration}</span>
                              </div>
                            </div>
                            <Badge className={stage.status === "completed" ? "bg-green-500" : "bg-blue-500"}>
                              {stage.status === "completed" ? "Completed" : "In Progress"}
                            </Badge>
                          </div>
                          <Card className="mt-3">
                            <CardContent className="pt-4">
                              <div className="space-y-3">
                                {stage.activities.map((activity, actIdx) => (
                                  <div key={actIdx} className="flex items-start gap-3 text-sm">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                                    <div className="flex-1">
                                      <div className="font-medium">{activity.type}</div>
                                      <div className="text-muted-foreground">{activity.description}</div>
                                      <div className="text-xs text-muted-foreground mt-1">{activity.timestamp}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Customer</div>
                <div className="font-semibold">Acme Corp</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Deal Value</div>
                <div className="text-2xl font-bold">$42,500</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Sales Rep</div>
                <div className="font-semibold">Sarah Johnson</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Duration</div>
                <div className="font-semibold">21 days</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Touchpoints</div>
                <div className="font-semibold">14 interactions</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Lead Source</div>
                <div className="font-semibold">Website Form</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <CardTitle>Identified Bottlenecks</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bottlenecks.map((bottleneck, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-2">{bottleneck.stage}</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Issue: </span>
                          <span>{bottleneck.issue}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Impact: </span>
                          <span>{bottleneck.impact}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <span className="text-muted-foreground">Fix: </span>
                          <span className="font-medium">{bottleneck.recommendation}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Journey Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Engagement Score</span>
                  <Badge className="bg-green-500">High</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Rate</span>
                  <span className="font-semibold">92%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Decision Velocity</span>
                  <Badge className="bg-green-500">Fast</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerJourney;
