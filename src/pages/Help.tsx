import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Zap, Settings, BarChart, Send, Users, Shield, Video, MessageCircle, TrendingUp, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function Help() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Documentation</h1>
        <p className="text-muted-foreground mt-1">
          Everything you need to know about using the Social Media Management Platform
        </p>
      </div>

      <Tabs defaultValue="getting-started" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="admin">Administration</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        {/* Getting Started */}
        <TabsContent value="getting-started" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Quick Start Guide</CardTitle>
              </div>
              <CardDescription>Get up and running in 5 minutes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    1
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Connect Your Social Media Platforms</h3>
                    <p className="text-sm text-muted-foreground">
                      Navigate to <Link to="/company/platform-settings" className="text-primary hover:underline">Platform Settings</Link> and configure your social media accounts (TikTok, Instagram, Facebook, etc.)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      💡 Each platform has detailed setup instructions with OAuth flows and API requirements
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    2
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Create Your First Post</h3>
                    <p className="text-sm text-muted-foreground">
                      Go to the <Link to="/composer" className="text-primary hover:underline">Composer</Link> to create engaging content with text, images, and videos
                    </p>
                    <p className="text-xs text-muted-foreground">
                      💡 You can schedule posts for later or publish immediately to multiple platforms
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    3
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Review & Moderate Content</h3>
                    <p className="text-sm text-muted-foreground">
                      All posts go through AI-powered moderation. Check the moderation queue to approve or reject content
                    </p>
                    <p className="text-xs text-muted-foreground">
                      💡 Admins can override moderation decisions and configure content policies
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm flex-shrink-0">
                    4
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Track Your Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      Visit the <Link to="/analytics" className="text-primary hover:underline">Analytics Dashboard</Link> to monitor engagement, reach, and performance metrics
                    </p>
                    <p className="text-xs text-muted-foreground">
                      💡 View real-time data, geographic distribution, and platform-specific insights
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Understanding the platform architecture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    User Roles
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><Badge variant="outline" className="mr-2">Admin</Badge>Full system access, user management</li>
                    <li><Badge variant="outline" className="mr-2">Agent</Badge>Content creation, moderation</li>
                    <li><Badge variant="outline" className="mr-2">User</Badge>Basic content creation</li>
                  </ul>
                </div>

                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Content Workflow
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>1. Create post in Composer</li>
                    <li>2. AI moderation check</li>
                    <li>3. Admin approval (if flagged)</li>
                    <li>4. Publish to platforms</li>
                    <li>5. Track performance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRM Module */}
        <TabsContent value="crm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CRM - Customer Relationship Management</CardTitle>
              <CardDescription>
                Comprehensive CRM features to manage your customer relationships, sales pipeline, and business activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Contacts */}
                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Contact Management
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Store complete contact information</li>
                    <li>Link contacts to accounts</li>
                    <li>Track lead sources and status</li>
                    <li>Advanced search and filtering</li>
                    <li>Branch-based access control</li>
                  </ul>
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link to="/contacts">Manage Contacts <ExternalLink className="h-3 w-3 ml-2" /></Link>
                  </Button>
                </div>

                {/* Leads */}
                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Lead Management
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Capture and qualify leads</li>
                    <li>Lead scoring for prioritization</li>
                    <li>Track lead sources and campaigns</li>
                    <li>Status progression tracking</li>
                    <li>Convert leads to customers</li>
                  </ul>
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link to="/leads">Manage Leads <ExternalLink className="h-3 w-3 ml-2" /></Link>
                  </Button>
                </div>

                {/* Accounts */}
                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BarChart className="h-4 w-4 text-primary" />
                    Account Management
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Manage organizational accounts</li>
                    <li>Track revenue and company size</li>
                    <li>Account types (Customer, Prospect, Partner)</li>
                    <li>Link multiple contacts to accounts</li>
                    <li>Industry categorization</li>
                  </ul>
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link to="/accounts">Manage Accounts <ExternalLink className="h-3 w-3 ml-2" /></Link>
                  </Button>
                </div>

                {/* Activities */}
                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Activities & Tasks
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Track tasks, calls, meetings, emails</li>
                    <li>Set priorities and due dates</li>
                    <li>Monitor completion status</li>
                    <li>Link to CRM records</li>
                    <li>Team productivity tracking</li>
                  </ul>
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link to="/activities">View Activities <ExternalLink className="h-3 w-3 ml-2" /></Link>
                  </Button>
                </div>

                {/* Sales Pipeline */}
                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BarChart className="h-4 w-4 text-primary" />
                    Sales Pipeline
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Visual Kanban pipeline view</li>
                    <li>Customizable pipeline stages</li>
                    <li>Track opportunity amounts</li>
                    <li>Win probability forecasting</li>
                    <li>Pipeline value metrics</li>
                  </ul>
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link to="/sales-pipeline">View Pipeline <ExternalLink className="h-3 w-3 ml-2" /></Link>
                  </Button>
                </div>

                {/* Reports */}
                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BarChart className="h-4 w-4 text-primary" />
                    Reports & Analytics
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Sales performance reports</li>
                    <li>CRM metrics and KPIs</li>
                    <li>Inventory status reports</li>
                    <li>Activity productivity tracking</li>
                    <li>Custom date range analysis</li>
                  </ul>
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link to="/reports">View Reports <ExternalLink className="h-3 w-3 ml-2" /></Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Composer */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  <CardTitle>Content Composer</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Create and schedule multi-platform social media posts with rich media support.
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Key Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Multi-platform posting (select which platforms)</li>
                    <li>Rich text editor with formatting</li>
                    <li>Image & video uploads (drag & drop)</li>
                    <li>Schedule posts for future dates</li>
                    <li>Preview before publishing</li>
                    <li>Auto-save drafts</li>
                  </ul>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/composer">Go to Composer <ExternalLink className="h-3 w-3 ml-2" /></Link>
                </Button>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  <CardTitle>Analytics Dashboard</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Track engagement, reach, and performance across all your social media channels.
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Metrics Available:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Total reach & impressions</li>
                    <li>Engagement rates (likes, comments, shares)</li>
                    <li>Geographic distribution map</li>
                    <li>Platform-specific breakdowns</li>
                    <li>Time-based trends (hourly/daily)</li>
                    <li>Export data to CSV</li>
                  </ul>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/analytics">View Analytics <ExternalLink className="h-3 w-3 ml-2" /></Link>
                </Button>
              </CardContent>
            </Card>

            {/* Brand Monitoring */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle>Brand Monitoring</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Monitor brand mentions, sentiment, and competitor activity across social media.
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Capabilities:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Real-time mention tracking</li>
                    <li>Sentiment analysis (positive/negative/neutral)</li>
                    <li>Keyword and hashtag monitoring</li>
                    <li>Competitor tracking</li>
                    <li>Crisis detection alerts</li>
                    <li>Engagement opportunities</li>
                  </ul>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/brand-monitoring">Open Monitoring <ExternalLink className="h-3 w-3 ml-2" /></Link>
                </Button>
              </CardContent>
            </Card>

            {/* Influencer Marketing */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>Influencer Marketing</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Manage influencer campaigns, track partnerships, and measure ROI.
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Influencer database & discovery</li>
                    <li>Campaign creation & management</li>
                    <li>Contract & payment tracking</li>
                    <li>Performance metrics per influencer</li>
                    <li>Communication hub</li>
                    <li>ROI calculation</li>
                  </ul>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/influencer-marketing">Manage Influencers <ExternalLink className="h-3 w-3 ml-2" /></Link>
                </Button>
              </CardContent>
            </Card>

            {/* Content Moderation */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>AI Content Moderation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Automated AI-powered content moderation to ensure brand safety and compliance.
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">What Gets Checked:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Inappropriate language detection</li>
                    <li>Brand guidelines compliance</li>
                    <li>Copyright concerns</li>
                    <li>Spam & promotional content</li>
                    <li>Sensitive topics</li>
                    <li>Manual override available</li>
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  <Badge variant="secondary" className="mr-2">Admin Only</Badge>
                  Content moderation queue
                </p>
              </CardContent>
            </Card>

            {/* Ad Campaigns */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <CardTitle>Ad Campaign Manager</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Create, manage, and optimize paid advertising campaigns across platforms.
                </p>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Campaign Tools:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Multi-platform ad creation</li>
                    <li>Budget management & tracking</li>
                    <li>Audience targeting</li>
                    <li>A/B testing capabilities</li>
                    <li>Performance analytics</li>
                    <li>ROI tracking & reporting</li>
                  </ul>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/ad-campaigns">Manage Campaigns <ExternalLink className="h-3 w-3 ml-2" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Administration */}
        <TabsContent value="admin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Administration</CardTitle>
              <CardDescription>
                Organizational management, user permissions, and system configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Branch Management */}
                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Branch Management
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Hierarchical organization structure</li>
                    <li>Multi-level branch support (HQ, Regional, Branch)</li>
                    <li>Branch-based data access control</li>
                    <li>Manager assignments per branch</li>
                    <li>Branch performance tracking</li>
                  </ul>
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link to="/admin/branches">Manage Branches <ExternalLink className="h-3 w-3 ml-2" /></Link>
                  </Button>
                  <p className="text-xs text-muted-foreground pt-2">
                    <Badge variant="secondary" className="mr-2">Admin Only</Badge>
                    Requires system or company administrator role
                  </p>
                </div>

                {/* Permission Management */}
                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Permission Management
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Role-based access control (RBAC)</li>
                    <li>Dynamic permission assignment</li>
                    <li>Module-specific permissions</li>
                    <li>Company-scoped permissions</li>
                    <li>Granular access control</li>
                  </ul>
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link to="/admin/permissions">Manage Permissions <ExternalLink className="h-3 w-3 ml-2" /></Link>
                  </Button>
                  <p className="text-xs text-muted-foreground pt-2">
                    <Badge variant="secondary" className="mr-2">Admin Only</Badge>
                    Configure role permissions
                  </p>
                </div>

                {/* User Management */}
                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    User Management
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Create and manage user accounts</li>
                    <li>Assign roles and permissions</li>
                    <li>Branch-based user access</li>
                    <li>View user activity logs</li>
                    <li>Password reset management</li>
                  </ul>
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link to="/admin/users">Manage Users <ExternalLink className="h-3 w-3 ml-2" /></Link>
                  </Button>
                  <p className="text-xs text-muted-foreground pt-2">
                    <Badge variant="secondary" className="mr-2">Admin Only</Badge>
                    User account administration
                  </p>
                </div>

                {/* Company Management */}
                <div className="space-y-2 p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Company Management
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Multi-tenant company structure</li>
                    <li>Company approval workflow</li>
                    <li>Platform subscription management</li>
                    <li>Company-level settings</li>
                    <li>Data isolation between companies</li>
                  </ul>
                  <Button asChild variant="outline" size="sm" className="w-full mt-2">
                    <Link to="/admin/companies">Manage Companies <ExternalLink className="h-3 w-3 ml-2" /></Link>
                  </Button>
                  <p className="text-xs text-muted-foreground pt-2">
                    <Badge variant="secondary" className="mr-2">Super Admin Only</Badge>
                    System-wide company administration
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organizational Hierarchy</CardTitle>
              <CardDescription>Understanding the branch-based access control system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">How Branch Hierarchy Works:</h4>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li><strong>Super Admins</strong> - System-wide access to all companies and branches</li>
                  <li><strong>Company Admins</strong> - Full access to all branches within their company</li>
                  <li><strong>Branch Managers</strong> - Access to their branch and all child branches</li>
                  <li><strong>Branch Users</strong> - Access only to data within their assigned branch</li>
                </ol>
                <div className="p-4 bg-muted/50 rounded-lg border mt-4">
                  <p className="text-sm font-medium mb-2">Example Hierarchy:</p>
                  <div className="text-sm text-muted-foreground space-y-1 ml-4">
                    <div>└─ <strong>Headquarters</strong> (Level 1)</div>
                    <div className="ml-4">├─ <strong>Regional Office - North</strong> (Level 2)</div>
                    <div className="ml-8">├─ <strong>Branch - NYC</strong> (Level 3)</div>
                    <div className="ml-8">└─ <strong>Branch - Boston</strong> (Level 3)</div>
                    <div className="ml-4">└─ <strong>Regional Office - South</strong> (Level 2)</div>
                    <div className="ml-8">└─ <strong>Branch - Miami</strong> (Level 3)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Guides */}
        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Setup Guides</CardTitle>
              <CardDescription>
                Step-by-step instructions for connecting each social media platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {/* TikTok */}
                <AccordionItem value="tiktok">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span className="font-semibold">TikTok</span>
                      <Badge variant="secondary">OAuth 2.0</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-4">
                    <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                      <li>Visit <a href="https://developers.tiktok.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TikTok Developer Portal</a></li>
                      <li>Create an app and get Client Key & Client Secret</li>
                      <li>Add required scopes: <code className="text-xs bg-muted px-1 py-0.5 rounded">user.info.basic</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">video.publish</code></li>
                      <li>Configure redirect URI in app settings</li>
                      <li>Complete OAuth flow to get access token</li>
                      <li>Add Terms of Service and Privacy Policy URLs</li>
                    </ol>
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <p className="text-xs font-medium mb-2">⚠️ Important Requirements:</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-2">
                        <li>App must be approved by TikTok</li>
                        <li>Valid TOS and Privacy Policy required</li>
                        <li>Access tokens expire - implement refresh</li>
                      </ul>
                    </div>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link to="/company/platform-settings">Configure TikTok</Link>
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* Facebook */}
                <AccordionItem value="facebook">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Facebook</span>
                      <Badge variant="secondary">OAuth 2.0</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-4">
                    <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                      <li>Create app at <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Facebook Developers</a></li>
                      <li>Add Facebook Login and Pages API products</li>
                      <li>Request permissions: <code className="text-xs bg-muted px-1 py-0.5 rounded">pages_manage_posts</code></li>
                      <li>Generate Page Access Token (long-lived)</li>
                      <li>Complete App Review for production</li>
                    </ol>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link to="/company/platform-settings">Configure Facebook</Link>
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* Instagram */}
                <AccordionItem value="instagram">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Instagram</span>
                      <Badge variant="secondary">OAuth 2.0</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-4">
                    <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                      <li>Create Facebook app (Instagram requires Facebook)</li>
                      <li>Add Instagram Graph API product</li>
                      <li>Connect Instagram Business Account to Facebook Page</li>
                      <li>Request <code className="text-xs bg-muted px-1 py-0.5 rounded">instagram_content_publish</code> permission</li>
                      <li>Generate and save access token</li>
                    </ol>
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <p className="text-xs font-medium mb-2">📌 Requirements:</p>
                      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-2">
                        <li>Must be Business or Creator account</li>
                        <li>Linked to Facebook Page</li>
                      </ul>
                    </div>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link to="/company/platform-settings">Configure Instagram</Link>
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* Continue for other platforms... */}
                <AccordionItem value="twitter">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Twitter/X</span>
                      <Badge variant="secondary">OAuth 1.0a / 2.0</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-4">
                    <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                      <li>Apply for API access at <a href="https://developer.twitter.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Twitter Developer Portal</a></li>
                      <li>Create project and app</li>
                      <li>Set app permissions to "Read and Write"</li>
                      <li>Get API Key, API Secret, Access Token, Token Secret</li>
                      <li>Complete OAuth flow</li>
                    </ol>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link to="/company/platform-settings">Configure Twitter</Link>
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="youtube">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">YouTube</span>
                      <Badge variant="secondary">OAuth 2.0</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-4">
                    <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                      <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a></li>
                      <li>Enable YouTube Data API v3</li>
                      <li>Create OAuth 2.0 credentials</li>
                      <li>Request <code className="text-xs bg-muted px-1 py-0.5 rounded">youtube.upload</code> scope</li>
                      <li>Complete OAuth flow for access & refresh tokens</li>
                    </ol>
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <p className="text-xs font-medium mb-2">⚠️ Quota Limits:</p>
                      <p className="text-xs text-muted-foreground">Daily quota: 10,000 units (1 upload = 1,600 units)</p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link to="/company/platform-settings">Configure YouTube</Link>
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="telegram">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Telegram</span>
                      <Badge variant="secondary">Bot API</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-4">
                    <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                      <li>Open Telegram and search for <code className="text-xs bg-muted px-1 py-0.5 rounded">@BotFather</code></li>
                      <li>Send <code className="text-xs bg-muted px-1 py-0.5 rounded">/newbot</code> to create bot</li>
                      <li>Copy the Bot Token</li>
                      <li>Add bot as admin to your channel</li>
                      <li>Get channel ID using <code className="text-xs bg-muted px-1 py-0.5 rounded">@userinfobot</code></li>
                    </ol>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <Link to="/company/platform-settings">Configure Telegram</Link>
                    </Button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="faq-1">
                  <AccordionTrigger>How many social media accounts can I connect?</AccordionTrigger>
                  <AccordionContent>
                    You can connect unlimited social media accounts across all supported platforms. Each platform configuration is managed separately in the Platform Settings.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2">
                  <AccordionTrigger>What happens if my post is flagged by moderation?</AccordionTrigger>
                  <AccordionContent>
                    Flagged posts require admin approval before publishing. Admins can review the content, see the moderation reason, and choose to approve or reject. You'll be notified of the decision.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3">
                  <AccordionTrigger>Can I schedule posts for different time zones?</AccordionTrigger>
                  <AccordionContent>
                    Yes! When scheduling a post, you can set the exact date and time. The system uses your local timezone by default, but you can adjust for different regions.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4">
                  <AccordionTrigger>How do I track post performance?</AccordionTrigger>
                  <AccordionContent>
                    Visit the Analytics Dashboard to view comprehensive metrics including reach, engagement, clicks, and geographic distribution. You can filter by date range, platform, and post type.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-5">
                  <AccordionTrigger>What file formats are supported for media uploads?</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li><strong>Images:</strong> JPG, PNG, GIF (max 10MB)</li>
                      <li><strong>Videos:</strong> MP4, MOV, AVI (max 100MB)</li>
                      <li>Platform-specific limits apply (e.g., Instagram: 60s videos, TikTok: 10 min)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-6">
                  <AccordionTrigger>How do access tokens work and when do they expire?</AccordionTrigger>
                  <AccordionContent>
                    Access tokens are platform-specific credentials that allow posting on your behalf:
                    <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                      <li><strong>Facebook/Instagram:</strong> 60 days (can be refreshed)</li>
                      <li><strong>TikTok:</strong> Variable based on app settings</li>
                      <li><strong>YouTube:</strong> 1 hour (use refresh tokens)</li>
                      <li><strong>LinkedIn:</strong> 60 days</li>
                    </ul>
                    <p className="text-sm mt-2">You'll be notified when tokens need renewal.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-7">
                  <AccordionTrigger>Can I bulk upload posts or schedule multiple at once?</AccordionTrigger>
                  <AccordionContent>
                    Currently, posts are created individually. However, you can create multiple drafts and schedule them for different times using the Composer's scheduling feature.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-8">
                  <AccordionTrigger>What user roles are available?</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm">
                      <li><Badge variant="outline">Admin</Badge> - Full system access, user management, moderation override</li>
                      <li><Badge variant="outline">Agent</Badge> - Content creation, viewing analytics, managing campaigns</li>
                      <li><Badge variant="outline">User</Badge> - Basic content creation and viewing own analytics</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Troubleshooting */}
        <TabsContent value="troubleshooting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="issue-1">
                  <AccordionTrigger>
                    <span className="text-left">Post failed to publish to platform</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm font-medium">Possible Causes:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Expired access token - Reconnect platform in settings</li>
                      <li>Platform API rate limit - Wait and try again</li>
                      <li>Media file too large - Compress or resize</li>
                      <li>Platform-specific content restrictions</li>
                    </ul>
                    <p className="text-sm font-medium mt-3">Solution:</p>
                    <p className="text-sm text-muted-foreground">
                      Check Platform Settings to verify token is active. Review platform error message for specific requirements.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="issue-2">
                  <AccordionTrigger>
                    <span className="text-left">Cannot connect social media account</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm font-medium">Troubleshooting Steps:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Verify you have correct API credentials</li>
                      <li>Check OAuth redirect URI matches exactly</li>
                      <li>Ensure app has required permissions/scopes</li>
                      <li>For production apps, verify app is approved</li>
                      <li>Clear browser cache and try again</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="issue-3">
                  <AccordionTrigger>
                    <span className="text-left">Analytics data not updating</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Analytics typically update every 1-6 hours depending on the platform API. Real-time data may have delays.
                    </p>
                    <p className="text-sm font-medium mt-3">If data is missing:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Check that platform is properly connected</li>
                      <li>Verify posts were successfully published</li>
                      <li>Allow up to 24 hours for initial data sync</li>
                      <li>Contact support if issue persists</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="issue-4">
                  <AccordionTrigger>
                    <span className="text-left">Content stuck in moderation</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Posts flagged by AI moderation require admin approval. Contact your administrator to review the flagged content.
                    </p>
                    <p className="text-sm mt-2">
                      <Badge variant="outline">Admins:</Badge> Review flagged posts in the Content Moderation section.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="issue-5">
                  <AccordionTrigger>
                    <span className="text-left">Scheduled post didn't publish</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm font-medium">Check These Items:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Post passed content moderation</li>
                      <li>Platform tokens are still valid</li>
                      <li>Scheduled time was in the future (not past)</li>
                      <li>No platform API outages at scheduled time</li>
                    </ul>
                    <p className="text-sm mt-2 text-muted-foreground">
                      You can manually republish from the post history if needed.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need More Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you're experiencing issues not covered in this documentation, please contact your system administrator or support team.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <a href="mailto:support@yourdomain.com">Email Support</a>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings">Account Settings</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}