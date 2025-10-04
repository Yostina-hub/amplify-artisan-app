import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CRMFeatureStatus() {
  const implementedFeatures = [
    { name: "Custom Fields / Layouts / Forms", module: "Module Builder", description: "15 field types with validation" },
    { name: "Dashboard & Reporting", module: "Analytics Dashboard", description: "Visual charts, KPIs, CSV export" },
    { name: "Workflow / Process Automation", module: "Workflow Builder", description: "Trigger-based actions and automations" },
    { name: "Role-Based Access & Permissions", module: "Core System", description: "User roles with RLS policies" },
    { name: "Audit Logs & Change History", module: "Core System", description: "Security audit tracking" },
    { name: "Dynamic GUI / Runtime Module Creation", module: "Module Builder", description: "Create modules on-the-fly" },
    { name: "Import / Export", module: "Analytics Dashboard", description: "CSV data export functionality" },
    { name: "API & Integrations", module: "API Management", description: "Custom API integrations" },
  ];

  const coreCRMNeeded = [
    { name: "Contact & Account Management", priority: "High", description: "Store contacts, companies, relationships" },
    { name: "Lead & Opportunity Management", priority: "High", description: "Capture leads, track qualification" },
    { name: "Sales Pipeline / Deal Management", priority: "High", description: "Visual pipeline with stages" },
    { name: "Tasks, Activities & Reminders", priority: "High", description: "Calls, meetings, follow-ups" },
    { name: "Notes & Interaction History", priority: "High", description: "Log all communications" },
    { name: "Email & Calendar Sync", priority: "Medium", description: "Two-way sync with email providers" },
    { name: "Document / File Management", priority: "Medium", description: "Attach files to records" },
    { name: "Duplicate / Data Quality Management", priority: "Medium", description: "Merge duplicates, validation" },
    { name: "Customer Service / Ticketing", priority: "Medium", description: "Support cases and SLAs" },
    { name: "Multi-Currency / Multi-Language", priority: "Low", description: "Global operations support" },
  ];

  const advancedFeatures = [
    { name: "AI / Predictive Analytics", priority: "High", description: "Deal scoring, churn prediction" },
    { name: "LLM / Generative AI Assisted Content", priority: "High", description: "Auto-generate emails, proposals" },
    { name: "Multi-Channel Tracking", priority: "High", description: "Email, SMS, chat, social in one view" },
    { name: "Timeline / Historical Story View", priority: "Medium", description: "Chronological customer journey" },
    { name: "Smart Suggestions / Next Best Action", priority: "Medium", description: "AI-powered recommendations" },
    { name: "Relationship Graphs / Network Visualization", priority: "Medium", description: "Visual relationship mapping" },
    { name: "Real-Time Data & Streaming", priority: "Medium", description: "Live updates and dashboards" },
    { name: "Embedded Collaboration Tools", priority: "Medium", description: "Team messaging in CRM" },
    { name: "Gamification / Incentive Tracking", priority: "Low", description: "Scoreboards and badges" },
    { name: "Customer-Accessible Portals", priority: "Low", description: "Self-service customer dashboards" },
  ];

  const uniqueInnovations = [
    { name: "Conversational AI Agents", description: "Multi-agent system for sales, support, data tasks" },
    { name: "Visual Flow Pipeline UI", description: "Interface as visual flows instead of lists" },
    { name: "Behavioral Analytics & Heatmaps", description: "Track customer behavior patterns" },
    { name: "Smart Templates That Adapt", description: "Self-adjusting based on success" },
    { name: "Micro-Apps / In-CRM Tools", description: "Built-in calculators, quote builders" },
    { name: "Emotional / Sentiment Tracking", description: "Analyze sentiment from interactions" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">CRM Feature Roadmap</h1>
        <p className="text-muted-foreground">Enterprise Builder System vs Modern CRM Requirements</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Implemented
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{implementedFeatures.length}</div>
            <p className="text-xs text-muted-foreground">Features ready</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Circle className="h-4 w-4 text-orange-500" />
              Core CRM Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coreCRMNeeded.length}</div>
            <p className="text-xs text-muted-foreground">Essential features</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Advanced Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advancedFeatures.length + uniqueInnovations.length}</div>
            <p className="text-xs text-muted-foreground">Differentiators</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="implemented" className="space-y-4">
        <TabsList>
          <TabsTrigger value="implemented">✅ Implemented</TabsTrigger>
          <TabsTrigger value="core">🎯 Core CRM Needed</TabsTrigger>
          <TabsTrigger value="advanced">⚡ Advanced Features</TabsTrigger>
          <TabsTrigger value="innovations">💡 Unique Innovations</TabsTrigger>
        </TabsList>

        <TabsContent value="implemented" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Already Built in Enterprise Builder</CardTitle>
              <CardDescription>Foundation features we have today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {implementedFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{feature.name}</div>
                    <div className="text-sm text-muted-foreground">{feature.description}</div>
                    <Badge variant="outline" className="mt-2">{feature.module}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="core" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Core CRM Features Needed</CardTitle>
              <CardDescription>Essential functionality for a complete CRM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {coreCRMNeeded.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Circle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{feature.name}</div>
                    <div className="text-sm text-muted-foreground">{feature.description}</div>
                    <Badge 
                      variant={feature.priority === "High" ? "destructive" : feature.priority === "Medium" ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {feature.priority} Priority
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced / Modern Features</CardTitle>
              <CardDescription>Next-generation capabilities to stand out</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {advancedFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{feature.name}</div>
                    <div className="text-sm text-muted-foreground">{feature.description}</div>
                    <Badge 
                      variant={feature.priority === "High" ? "destructive" : feature.priority === "Medium" ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {feature.priority} Priority
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="innovations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unique Innovations</CardTitle>
              <CardDescription>Creative features to differentiate from competitors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {uniqueInnovations.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border rounded-lg bg-gradient-to-r from-primary/5 to-accent/5">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{feature.name}</div>
                    <div className="text-sm text-muted-foreground">{feature.description}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-primary">
        <CardHeader>
          <CardTitle>📋 Recommended Next Steps</CardTitle>
          <CardDescription>Priority order for building complete CRM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Phase 5: Core CRM Modules (High Priority)</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Contact & Account Management - Central customer database</li>
              <li>Lead & Opportunity Management - Sales funnel tracking</li>
              <li>Sales Pipeline with Kanban View - Visual deal management</li>
              <li>Tasks & Activities Management - Action tracking</li>
              <li>Interaction History & Notes - Communication log</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Phase 6: AI-Powered Features (High Priority)</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>AI Content Generation - Email drafts, proposals</li>
              <li>Predictive Analytics - Deal scoring, churn prediction</li>
              <li>Smart Suggestions - Next best action recommendations</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Phase 7: Enhanced Capabilities (Medium Priority)</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
              <li>Email & Calendar Integration</li>
              <li>Document Management</li>
              <li>Customer Service / Ticketing</li>
              <li>Timeline / Historical View</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
