import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageHelp } from "@/components/PageHelp";
import { toast } from "sonner";
import { Shield, Plus, Edit, Trash2, Globe, Lock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function FirewallManagement() {
  const [isIpDialogOpen, setIsIpDialogOpen] = useState(false);
  const [isDomainDialogOpen, setIsDomainDialogOpen] = useState(false);
  const [editingIp, setEditingIp] = useState<any>(null);
  const [editingDomain, setEditingDomain] = useState<any>(null);
  const [ipForm, setIpForm] = useState({ ip_address: "", description: "", is_active: true });
  const [domainForm, setDomainForm] = useState({ domain: "", description: "", is_active: true });
  const queryClient = useQueryClient();

  // Fetch IP whitelist
  const { data: ipWhitelist } = useQuery({
    queryKey: ["ip-whitelist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ip_whitelist")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch domain whitelist
  const { data: domainWhitelist } = useQuery({
    queryKey: ["domain-whitelist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domain_whitelist")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch access logs
  const { data: accessLogs } = useQuery({
    queryKey: ["access-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("access_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // IP mutations
  const createIpMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("ip_whitelist").insert({
        ...data,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-whitelist"] });
      toast.success("IP address added to whitelist");
      setIsIpDialogOpen(false);
      resetIpForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateIpMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from("ip_whitelist")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-whitelist"] });
      toast.success("IP address updated");
      setIsIpDialogOpen(false);
      resetIpForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteIpMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ip_whitelist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-whitelist"] });
      toast.success("IP address removed from whitelist");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  // Domain mutations
  const createDomainMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("domain_whitelist").insert({
        ...data,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domain-whitelist"] });
      toast.success("Domain added to whitelist");
      setIsDomainDialogOpen(false);
      resetDomainForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateDomainMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from("domain_whitelist")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domain-whitelist"] });
      toast.success("Domain updated");
      setIsDomainDialogOpen(false);
      resetDomainForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("domain_whitelist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domain-whitelist"] });
      toast.success("Domain removed from whitelist");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetIpForm = () => {
    setIpForm({ ip_address: "", description: "", is_active: true });
    setEditingIp(null);
  };

  const resetDomainForm = () => {
    setDomainForm({ domain: "", description: "", is_active: true });
    setEditingDomain(null);
  };

  const handleIpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIp) {
      updateIpMutation.mutate({ id: editingIp.id, ...ipForm });
    } else {
      createIpMutation.mutate(ipForm);
    }
  };

  const handleDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDomain) {
      updateDomainMutation.mutate({ id: editingDomain.id, ...domainForm });
    } else {
      createDomainMutation.mutate(domainForm);
    }
  };

  const openEditIpDialog = (ip: any) => {
    setEditingIp(ip);
    setIpForm({
      ip_address: ip.ip_address,
      description: ip.description || "",
      is_active: ip.is_active,
    });
    setIsIpDialogOpen(true);
  };

  const openEditDomainDialog = (domain: any) => {
    setEditingDomain(domain);
    setDomainForm({
      domain: domain.domain,
      description: domain.description || "",
      is_active: domain.is_active,
    });
    setIsDomainDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <PageHelp
        title="Firewall & Whitelist Management"
        description="Manage system security by controlling IP address and domain access. Whitelist trusted sources and monitor blocked access attempts."
        features={[
          "Whitelist specific IP addresses for secure access",
          "Manage domain-based access controls",
          "Monitor and review blocked access attempts",
          "Enable/disable whitelist entries without deletion",
          "Track access patterns and security threats",
        ]}
        tips={[
          "Regularly review and update your whitelist entries",
          "Monitor access logs for suspicious activity patterns",
          "Document the purpose of each whitelist entry",
          "Test whitelist changes before applying to production",
        ]}
      />

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-destructive/10 via-primary/5 to-background p-8 backdrop-blur-sm border border-destructive/10">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-gradient-to-br from-destructive/10 to-primary/5">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-destructive to-primary bg-clip-text text-transparent">
              Firewall Management
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Control and monitor system access security
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success/20 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-success" />
              Whitelisted IPs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {ipWhitelist?.filter(ip => ip.is_active).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active entries</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Whitelisted Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {domainWhitelist?.filter(d => d.is_active).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active entries</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-destructive/20 to-transparent rounded-full blur-3xl" />
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Blocked Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {accessLogs?.filter(log => log.is_blocked).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 100 logs</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ip" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ip">IP Whitelist</TabsTrigger>
          <TabsTrigger value="domain">Domain Whitelist</TabsTrigger>
          <TabsTrigger value="logs">Access Logs</TabsTrigger>
        </TabsList>

        {/* IP Whitelist Tab */}
        <TabsContent value="ip" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>IP Address Whitelist</CardTitle>
                  <CardDescription>Manage allowed IP addresses</CardDescription>
                </div>
                <Dialog open={isIpDialogOpen} onOpenChange={setIsIpDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetIpForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add IP
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingIp ? "Edit" : "Add"} IP Address</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleIpSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>IP Address *</Label>
                        <Input
                          placeholder="192.168.1.1"
                          value={ipForm.ip_address}
                          onChange={(e) => setIpForm({ ...ipForm, ip_address: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Purpose of this IP whitelist entry..."
                          value={ipForm.description}
                          onChange={(e) => setIpForm({ ...ipForm, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Active</Label>
                        <Switch
                          checked={ipForm.is_active}
                          onCheckedChange={(checked) => setIpForm({ ...ipForm, is_active: checked })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsIpDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">{editingIp ? "Update" : "Add"}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {ipWhitelist && ipWhitelist.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipWhitelist.map((ip: any) => (
                      <TableRow key={ip.id}>
                        <TableCell className="font-mono">{ip.ip_address}</TableCell>
                        <TableCell>{ip.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={ip.is_active ? "default" : "secondary"}>
                            {ip.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(ip.created_at), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditIpDialog(ip)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteIpMutation.mutate(ip.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No IP addresses in whitelist
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Whitelist Tab */}
        <TabsContent value="domain" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Domain Whitelist</CardTitle>
                  <CardDescription>Manage allowed domains</CardDescription>
                </div>
                <Dialog open={isDomainDialogOpen} onOpenChange={setIsDomainDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetDomainForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Domain
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingDomain ? "Edit" : "Add"} Domain</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleDomainSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Domain *</Label>
                        <Input
                          placeholder="example.com"
                          value={domainForm.domain}
                          onChange={(e) => setDomainForm({ ...domainForm, domain: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Purpose of this domain whitelist entry..."
                          value={domainForm.description}
                          onChange={(e) => setDomainForm({ ...domainForm, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Active</Label>
                        <Switch
                          checked={domainForm.is_active}
                          onCheckedChange={(checked) => setDomainForm({ ...domainForm, is_active: checked })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDomainDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">{editingDomain ? "Update" : "Add"}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {domainWhitelist && domainWhitelist.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domainWhitelist.map((domain: any) => (
                      <TableRow key={domain.id}>
                        <TableCell className="font-mono">{domain.domain}</TableCell>
                        <TableCell>{domain.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={domain.is_active ? "default" : "secondary"}>
                            {domain.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(domain.created_at), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDomainDialog(domain)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteDomainMutation.mutate(domain.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No domains in whitelist
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Access Logs</CardTitle>
              <CardDescription>Recent access attempts and blocks</CardDescription>
            </CardHeader>
            <CardContent>
              {accessLogs && accessLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono">{log.ip_address}</TableCell>
                        <TableCell>{log.request_path || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={log.is_blocked ? "destructive" : "default"}>
                            {log.is_blocked ? "Blocked" : "Allowed"}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.block_reason || "-"}</TableCell>
                        <TableCell>{format(new Date(log.created_at), "MMM dd, HH:mm:ss")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No access logs available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
