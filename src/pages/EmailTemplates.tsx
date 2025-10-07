import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Save, Eye, Copy, Trash2, Mail, Sparkles, Image, Link, Code } from "lucide-react";

const EmailTemplates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const templates = [
    {
      id: 1,
      name: "Welcome Email",
      category: "Onboarding",
      subject: "Welcome to {{company_name}}",
      usageCount: 245,
      openRate: 68,
      clickRate: 42
    },
    {
      id: 2,
      name: "Follow-up After Demo",
      category: "Sales",
      subject: "Great meeting you, {{first_name}}",
      usageCount: 189,
      openRate: 72,
      clickRate: 38
    },
    {
      id: 3,
      name: "Proposal Sent",
      category: "Sales",
      subject: "Your custom proposal is ready",
      usageCount: 156,
      openRate: 81,
      clickRate: 55
    },
    {
      id: 4,
      name: "Contract Renewal",
      category: "Retention",
      subject: "Time to renew - Special offer inside",
      usageCount: 98,
      openRate: 65,
      clickRate: 48
    }
  ];

  const variables = [
    { tag: "{{first_name}}", description: "Contact's first name" },
    { tag: "{{last_name}}", description: "Contact's last name" },
    { tag: "{{company_name}}", description: "Company name" },
    { tag: "{{email}}", description: "Contact's email" },
    { tag: "{{phone}}", description: "Contact's phone" },
    { tag: "{{sales_rep}}", description: "Assigned sales rep name" },
    { tag: "{{deal_value}}", description: "Deal value" },
    { tag: "{{product_name}}", description: "Product/service name" }
  ];

  const aiSuggestions = [
    "Add urgency with a time-limited offer",
    "Include social proof or testimonial",
    "Add a clear, single call-to-action",
    "Personalize the opening sentence",
    "Use shorter paragraphs for readability"
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Email Templates</h1>
          <p className="text-muted-foreground">Create, manage, and optimize email templates with AI</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
              <DialogDescription>Design a new email template with dynamic variables</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[70vh]">
              <div className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Template Name</Label>
                    <Input placeholder="e.g., Welcome Email" />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onboarding">Onboarding</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                        <SelectItem value="retention">Retention</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Subject Line</Label>
                  <Input placeholder="Use {{variables}} for personalization" />
                  <Button variant="ghost" size="sm" className="mt-1">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Suggest Subject
                  </Button>
                </div>

                <div>
                  <Label>Email Body</Label>
                  <Textarea
                    rows={12}
                    placeholder="Write your email content here. Use {{variable_name}} for dynamic content."
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm">
                      <Image className="h-3 w-3 mr-1" />
                      Add Image
                    </Button>
                    <Button variant="outline" size="sm">
                      <Link className="h-3 w-3 mr-1" />
                      Add Link
                    </Button>
                    <Button variant="outline" size="sm">
                      <Code className="h-3 w-3 mr-1" />
                      Add Button
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">AI Writing Assistant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {aiSuggestions.map((suggestion, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 hover:bg-accent rounded-lg cursor-pointer">
                          <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                          <span className="text-sm">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Available Variables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {variables.map((variable, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 border rounded hover:bg-accent cursor-pointer">
                          <code className="text-xs bg-muted px-2 py-1 rounded">{variable.tag}</code>
                          <span className="text-xs text-muted-foreground">{variable.description}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">42</div>
            <p className="text-sm text-muted-foreground">8 added this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">71%</div>
            <p className="text-sm text-muted-foreground">+4% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg Click Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">45%</div>
            <p className="text-sm text-muted-foreground">+6% improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emails Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12.5K</div>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Manage and optimize your email templates</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="retention">Retention</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{template.subject}</p>
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Used: </span>
                          <span className="font-medium">{template.usageCount}x</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Open: </span>
                          <span className="font-medium">{template.openRate}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Click: </span>
                          <span className="font-medium">{template.clickRate}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Sparkles className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTemplates;
