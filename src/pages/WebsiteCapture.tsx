import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Code, Copy, Globe, Users, TrendingUp, Mail } from "lucide-react";

const WebsiteCapture = () => {
  const embedCode = `<script src="https://crm.example.com/capture.js"></script>
<script>
  CRM.init({ apiKey: 'your-api-key' });
</script>`;

  const capturedLeads = [
    { id: 1, name: "John Doe", email: "john@example.com", source: "Pricing Page", score: 85, date: "2024-12-20 14:32" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", source: "Contact Form", score: 72, date: "2024-12-20 13:15" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", source: "Demo Request", score: 92, date: "2024-12-20 11:45" }
  ];

  const formFields = [
    { field: "First Name", required: true, enabled: true },
    { field: "Last Name", required: true, enabled: true },
    { field: "Email", required: true, enabled: true },
    { field: "Company", required: false, enabled: true },
    { field: "Phone", required: false, enabled: true },
    { field: "Message", required: false, enabled: true }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Website Lead Auto-Capture</h1>
          <p className="text-muted-foreground">Automatically capture and qualify leads from your website</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Today's Captures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">47</div>
            <p className="text-sm text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24%</div>
            <p className="text-sm text-muted-foreground">Visitors to leads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3min</div>
            <p className="text-sm text-muted-foreground">Auto-reply enabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,247</div>
            <p className="text-sm text-muted-foreground">Total leads captured</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="forms">Form Builder</TabsTrigger>
          <TabsTrigger value="leads">Captured Leads</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Website Integration Code</CardTitle>
              <CardDescription>Add this code to your website to start capturing leads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Embed Code</Label>
                <div className="relative">
                  <Textarea value={embedCode} readOnly className="font-mono text-sm" rows={5} />
                  <Button size="sm" variant="ghost" className="absolute top-2 right-2">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button>
                <Code className="h-4 w-4 mr-2" />
                View Full Documentation
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Copy the embed code above",
                  "Paste it before the closing </body> tag on your website",
                  "Configure form fields and styling",
                  "Test the integration using preview mode",
                  "Go live and start capturing leads automatically"
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                      {idx + 1}
                    </div>
                    <p className="text-sm pt-0.5">{step}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supported Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["WordPress Plugin", "Shopify App", "React Component", "Vue.js Module", "Custom HTML"].map((integration, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="font-medium">{integration}</span>
                      </div>
                      <Button size="sm" variant="outline">Install</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Field Configuration</CardTitle>
              <CardDescription>Customize what information you collect</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Validation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formFields.map((field, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{field.field}</TableCell>
                      <TableCell>
                        <Badge variant={field.required ? "default" : "outline"}>
                          {field.required ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={field.enabled ? "bg-green-500" : "bg-gray-500"}>
                          {field.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recently Captured Leads</CardTitle>
              <CardDescription>Leads automatically captured from your website</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Captured</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capturedLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.source}</TableCell>
                      <TableCell>
                        <Badge className={lead.score >= 80 ? "bg-green-500" : "bg-orange-500"}>
                          {lead.score}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{lead.date}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Assignment Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Assign leads to</Label>
                <Input defaultValue="Round robin" />
              </div>
              <div>
                <Label>Notification email</Label>
                <Input type="email" defaultValue="sales@company.com" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebsiteCapture;
