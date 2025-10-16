import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Shield, Database, Phone, Layout, Mail, Key, Volume2, Settings as SettingsIcon, FileSearch, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function SystemConfiguration() {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in-50 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <p className="text-muted-foreground mt-1">
          Centralized management for all system settings and integrations
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/admin/live-chat')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Live Chat</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Dashboard</div>
                <p className="text-xs text-muted-foreground">Manage customer conversations</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/admin/firewall')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Firewall</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Management</div>
                <p className="text-xs text-muted-foreground">Security rules and protection</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/admin/api-management')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Integrations</div>
                <p className="text-xs text-muted-foreground">API keys and webhooks</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/admin/call-center-integrations')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Call Center</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Setup</div>
                <p className="text-xs text-muted-foreground">Configure telephony systems</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/admin/public-content')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Public Content</CardTitle>
                <Layout className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Manager</div>
                <p className="text-xs text-muted-foreground">Manage public pages</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/admin/email-settings')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Settings</div>
                <p className="text-xs text-muted-foreground">SMTP and email config</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/admin/social-auth')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Social Auth</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">OAuth</div>
                <p className="text-xs text-muted-foreground">Social login configuration</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/social-platform-settings')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Social Platforms</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">OAuth Apps</div>
                <p className="text-xs text-muted-foreground">Company OAuth settings</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/admin/platform-oauth-apps')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform OAuth</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Centralized</div>
                <p className="text-xs text-muted-foreground">Platform-wide credentials</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/tts-settings')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TTS/STT</CardTitle>
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Voice</div>
                <p className="text-xs text-muted-foreground">Speech services config</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/admin/trial-settings')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trial</CardTitle>
                <SettingsIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Settings</div>
                <p className="text-xs text-muted-foreground">Free trial configuration</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/admin/settings')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System</CardTitle>
                <SettingsIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">General</div>
                <p className="text-xs text-muted-foreground">Core system settings</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/admin/audit-log')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Audit</CardTitle>
                <FileSearch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Logs</div>
                <p className="text-xs text-muted-foreground">System activity tracking</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Communication Tab */}
        <TabsContent value="communication" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Live Chat Dashboard
                </CardTitle>
                <CardDescription>Manage real-time customer support conversations</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/admin/live-chat')}>
                  Open Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Settings
                </CardTitle>
                <CardDescription>Configure SMTP servers and email templates</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/admin/email-settings')}>
                  Configure Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Call Center Setup
                </CardTitle>
                <CardDescription>Integrate telephony and VoIP systems</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/admin/call-center-integrations')}>
                  Setup Call Center
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  TTS/STT Settings
                </CardTitle>
                <CardDescription>Configure text-to-speech and speech-to-text services</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/tts-settings')}>
                  Configure Voice
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Firewall Management
                </CardTitle>
                <CardDescription>Configure security rules and IP restrictions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/admin/firewall')}>
                  Manage Firewall
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Social Auth Settings
                </CardTitle>
                <CardDescription>Configure OAuth providers for user authentication</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/admin/social-auth')}>
                  Configure OAuth
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5" />
                  Audit Log
                </CardTitle>
                <CardDescription>View system activity and security events</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/admin/audit-log')}>
                  View Logs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  API Integrations
                </CardTitle>
                <CardDescription>Manage API keys, webhooks, and external services</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/admin/api-management')}>
                  Manage APIs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Call Center Integrations
                </CardTitle>
                <CardDescription>Connect to external telephony providers</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/admin/call-center-integrations')}>
                  Setup Integrations
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Company Social OAuth
                </CardTitle>
                <CardDescription>Configure company-specific OAuth apps (per-company credentials)</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/social-platform-settings')}>
                  Configure Company OAuth
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Platform OAuth Apps
                </CardTitle>
                <CardDescription>Manage centralized OAuth credentials (Buffer/Hootsuite style)</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/admin/platform-oauth-apps')}>
                  Manage Platform OAuth
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Social Auth (User Login)
                </CardTitle>
                <CardDescription>Setup social login for user authentication</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/admin/social-auth')}>
                  Configure Social Login
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Public Content
                </CardTitle>
                <CardDescription>Manage public-facing content and pages</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/admin/public-content')}>
                  Manage Content
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  General System Settings
                </CardTitle>
                <CardDescription>Core system configuration and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/admin/settings')}>
                  System Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Trial Settings
                </CardTitle>
                <CardDescription>Configure free trial periods and limitations</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleNavigate('/admin/trial-settings')}>
                  Trial Configuration
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
