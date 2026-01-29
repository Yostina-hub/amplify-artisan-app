import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  FileText, Plus, Calendar, DollarSign, AlertCircle, CheckCircle2, 
  Clock, TrendingUp, FileCheck, AlertTriangle, Search, Filter,
  PenTool, RefreshCw, ShieldCheck, Download, Eye, Edit
} from "lucide-react";
import { PageHelp } from "@/components/PageHelp";
import { pageHelpContent } from "@/lib/pageHelpContent";

export default function ContractManagement() {
  const [newContractOpen, setNewContractOpen] = useState(false);
  const [newTemplateOpen, setNewTemplateOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  // Fetch contracts
  const { data: contracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ["contract-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch contract details
  const { data: selectedContractData } = useQuery({
    queryKey: ["contract-details", selectedContract],
    queryFn: async () => {
      if (!selectedContract) return null;
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", selectedContract)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedContract,
  });

  // Fetch milestones for selected contract
  const { data: milestones = [] } = useQuery({
    queryKey: ["contract-milestones", selectedContract],
    queryFn: async () => {
      if (!selectedContract) return [];
      const { data, error } = await supabase
        .from("contract_milestones")
        .select("*")
        .eq("contract_id", selectedContract)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedContract,
  });

  // Fetch amendments
  const { data: amendments = [] } = useQuery({
    queryKey: ["contract-amendments", selectedContract],
    queryFn: async () => {
      if (!selectedContract) return [];
      const { data, error } = await supabase
        .from("contract_amendments")
        .select("*")
        .eq("contract_id", selectedContract)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedContract,
  });

  // Fetch compliance
  const { data: compliance = [] } = useQuery({
    queryKey: ["contract-compliance", selectedContract],
    queryFn: async () => {
      if (!selectedContract) return [];
      const { data, error } = await supabase
        .from("contract_compliance")
        .select("*")
        .eq("contract_id", selectedContract)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedContract,
  });

  // Create contract mutation
  const createContract = useMutation({
    mutationFn: async (values: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const { error } = await supabase.from("contracts").insert({
        ...values,
        company_id: profile?.company_id,
        created_by: user?.id,
        owner_id: user?.id,
        contract_number: '', // Will be auto-generated
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Contract created successfully");
      setNewContractOpen(false);
    },
  });

  // Create template mutation
  const createTemplate = useMutation({
    mutationFn: async (values: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const { error } = await supabase.from("contract_templates").insert({
        ...values,
        company_id: profile?.company_id,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-templates"] });
      toast.success("Template created successfully");
      setNewTemplateOpen(false);
    },
  });

  // Calculate stats
  const today = new Date();
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === "active").length,
    draft: contracts.filter(c => c.status === "draft").length,
    expiringSoon: contracts.filter(c => {
      if (!c.end_date || c.status !== "active") return false;
      const daysUntilExpiry = Math.ceil((new Date(c.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length,
    totalValue: contracts
      .filter(c => c.status === "active")
      .reduce((sum, c) => sum + (c.contract_value || 0), 0),
    pendingSignature: contracts.filter(c => 
      c.status === "pending_signature" || 
      (!c.signed_by_company || !c.signed_by_client)
    ).length,
    renewalDue: contracts.filter(c => {
      if (!c.renewal_date) return false;
      const daysUntilRenewal = Math.ceil((new Date(c.renewal_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilRenewal > 0 && daysUntilRenewal <= 60;
    }).length,
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.contract_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "secondary",
      pending_review: "outline",
      pending_signature: "outline",
      active: "default",
      expired: "destructive",
      terminated: "destructive",
      renewed: "default",
    };
    return colors[status] || "outline";
  };

  const getDaysUntilExpiry = (endDate: string) => {
    return Math.ceil((new Date(endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getComplianceStatus = (complianceData: any[]) => {
    if (complianceData.length === 0) return "unknown";
    const compliant = complianceData.filter(c => c.status === "compliant").length;
    const total = complianceData.length;
    if (compliant === total) return "compliant";
    if (compliant / total >= 0.7) return "partial";
    return "non-compliant";
  };

  return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Contract Management</h1>
            <p className="text-muted-foreground">Manage contracts, templates, and compliance</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={newTemplateOpen} onOpenChange={setNewTemplateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Contract Template</DialogTitle>
                  <DialogDescription>Define a reusable contract template</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createTemplate.mutate({
                      name: formData.get("name"),
                      description: formData.get("description"),
                      template_category: formData.get("template_category"),
                      template_content: formData.get("template_content"),
                      terms_and_conditions: formData.get("terms_and_conditions"),
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Template Name *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="template_category">Category *</Label>
                    <Select name="template_category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="service_agreement">Service Agreement</SelectItem>
                        <SelectItem value="nda">Non-Disclosure Agreement</SelectItem>
                        <SelectItem value="employment">Employment Contract</SelectItem>
                        <SelectItem value="licensing">Licensing Agreement</SelectItem>
                        <SelectItem value="partnership">Partnership Agreement</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" rows={2} />
                  </div>
                  <div>
                    <Label htmlFor="template_content">Template Content *</Label>
                    <Textarea 
                      id="template_content" 
                      name="template_content" 
                      rows={6}
                      placeholder="Enter contract template with placeholders like {{company_name}}, {{client_name}}, etc."
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
                    <Textarea id="terms_and_conditions" name="terms_and_conditions" rows={4} />
                  </div>
                  <Button type="submit" className="w-full">Create Template</Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={newContractOpen} onOpenChange={setNewContractOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Contract
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Contract</DialogTitle>
                  <DialogDescription>Set up a new contract with detailed information</DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createContract.mutate({
                      title: formData.get("title"),
                      description: formData.get("description"),
                      contract_type: formData.get("contract_type"),
                      status: formData.get("status"),
                      start_date: formData.get("start_date"),
                      end_date: formData.get("end_date"),
                      contract_value: parseFloat(formData.get("contract_value") as string) || null,
                      currency: formData.get("currency"),
                      payment_terms: formData.get("payment_terms"),
                      auto_renewal: formData.get("auto_renewal") === "yes",
                      renewal_notice_days: parseInt(formData.get("renewal_notice_days") as string) || 30,
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="title">Contract Title *</Label>
                      <Input id="title" name="title" required />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" rows={2} />
                    </div>
                    <div>
                      <Label htmlFor="contract_type">Contract Type *</Label>
                      <Select name="contract_type" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service">Service Agreement</SelectItem>
                          <SelectItem value="master">Master Agreement</SelectItem>
                          <SelectItem value="nda">NDA</SelectItem>
                          <SelectItem value="employment">Employment</SelectItem>
                          <SelectItem value="licensing">Licensing</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue="draft">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pending_review">Pending Review</SelectItem>
                          <SelectItem value="pending_signature">Pending Signature</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input id="start_date" name="start_date" type="date" required />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date *</Label>
                      <Input id="end_date" name="end_date" type="date" required />
                    </div>
                    <div>
                      <Label htmlFor="contract_value">Contract Value</Label>
                      <Input 
                        id="contract_value" 
                        name="contract_value" 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select name="currency" defaultValue="USD">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="payment_terms">Payment Terms</Label>
                      <Textarea 
                        id="payment_terms" 
                        name="payment_terms" 
                        rows={2}
                        placeholder="e.g., Net 30, Monthly installments, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="auto_renewal">Auto-Renewal</Label>
                      <Select name="auto_renewal" defaultValue="no">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="renewal_notice_days">Renewal Notice (Days)</Label>
                      <Input 
                        id="renewal_notice_days" 
                        name="renewal_notice_days" 
                        type="number"
                        defaultValue="30"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">Create Contract</Button>
                    <Button type="button" variant="outline" onClick={() => setNewContractOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All contracts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.active}</div>
              <p className="text-xs text-muted-foreground">In effect</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.expiringSoon}</div>
              <p className="text-xs text-muted-foreground">Within 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Signature</CardTitle>
              <PenTool className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.pendingSignature}</div>
              <p className="text-xs text-muted-foreground">Awaiting sign</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Renewal Due</CardTitle>
              <RefreshCw className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.renewalDue}</div>
              <p className="text-xs text-muted-foreground">Within 60 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(stats.totalValue / 1000).toFixed(0)}K</div>
              <p className="text-xs text-muted-foreground">Active contracts</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {!selectedContract ? (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="pending_signature">Pending Signature</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contracts Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContracts.map((contract) => {
                const daysUntilExpiry = contract.end_date ? getDaysUntilExpiry(contract.end_date) : null;
                const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                
                return (
                  <Card 
                    key={contract.id}
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                    onClick={() => setSelectedContract(contract.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">{contract.title}</CardTitle>
                          </div>
                          <CardDescription className="text-xs">
                            {contract.contract_number}
                          </CardDescription>
                        </div>
                        <Badge variant={getStatusColor(contract.status) as any}>
                          {contract.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline">{contract.contract_type}</Badge>
                      </div>
                      
                      {contract.contract_value && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Value:</span>
                          <span className="font-medium">
                            {contract.currency} {contract.contract_value.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Period:</span>
                        <span className="text-xs">
                          {new Date(contract.start_date).toLocaleDateString()} - {new Date(contract.end_date).toLocaleDateString()}
                        </span>
                      </div>

                      {isExpiringSoon && (
                        <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                          <AlertTriangle className="h-3 w-3" />
                          Expires in {daysUntilExpiry} days
                        </div>
                      )}

                      {contract.auto_renewal && (
                        <div className="flex items-center gap-2 text-xs">
                          <RefreshCw className="h-3 w-3 text-blue-500" />
                          <span className="text-muted-foreground">Auto-renewal enabled</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs pt-2 border-t">
                        {contract.signed_by_company && contract.signed_by_client ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            <span className="text-green-600 dark:text-green-400">Fully Signed</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 text-orange-500" />
                            <span className="text-orange-600 dark:text-orange-400">Pending Signatures</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredContracts.length === 0 && (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-xl font-semibold mb-2">No contracts found</p>
                    <p className="text-muted-foreground mb-4">Create your first contract to get started</p>
                    <Button onClick={() => setNewContractOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Contract
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          /* Contract Details View */
          <div className="space-y-6">
            {/* Contract Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedContract(null)}
                      >
                        ← Back
                      </Button>
                      <div className="h-6 w-px bg-border" />
                      <h2 className="text-2xl font-bold">{selectedContractData?.title}</h2>
                      <Badge variant={getStatusColor(selectedContractData?.status || '') as any}>
                        {selectedContractData?.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{selectedContractData?.contract_number}</span>
                      <span>•</span>
                      <span>{selectedContractData?.contract_type}</span>
                      {selectedContractData?.contract_value && (
                        <>
                          <span>•</span>
                          <span className="font-medium">
                            {selectedContractData.currency} {selectedContractData.contract_value.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                    <p className="font-medium">{selectedContractData?.start_date && new Date(selectedContractData.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">End Date</p>
                    <p className="font-medium">{selectedContractData?.end_date && new Date(selectedContractData.end_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Company Signature</p>
                    <div className="flex items-center gap-2">
                      {selectedContractData?.signed_by_company ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600 dark:text-green-400">Signed</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <span className="text-sm text-orange-600 dark:text-orange-400">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Client Signature</p>
                    <div className="flex items-center gap-2">
                      {selectedContractData?.signed_by_client ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600 dark:text-green-400">Signed</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <span className="text-sm text-orange-600 dark:text-orange-400">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details Tabs */}
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="milestones">Milestones ({milestones.length})</TabsTrigger>
                <TabsTrigger value="amendments">Amendments ({amendments.length})</TabsTrigger>
                <TabsTrigger value="compliance">Compliance ({compliance.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contract Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedContractData?.description && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Description</h4>
                        <p className="text-sm text-muted-foreground">{selectedContractData.description}</p>
                      </div>
                    )}
                    {selectedContractData?.payment_terms && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Payment Terms</h4>
                        <p className="text-sm text-muted-foreground">{selectedContractData.payment_terms}</p>
                      </div>
                    )}
                    {selectedContractData?.auto_renewal && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">Auto-Renewal Enabled</p>
                            <p className="text-xs text-muted-foreground">
                              Notice period: {selectedContractData.renewal_notice_days} days
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="milestones" className="space-y-4 mt-4">
                {milestones.map((milestone) => (
                  <Card key={milestone.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{milestone.name}</CardTitle>
                          <CardDescription>{milestone.description}</CardDescription>
                        </div>
                        <Badge variant={milestone.status === "completed" ? "default" : "outline"}>
                          {milestone.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(milestone.due_date).toLocaleDateString()}
                        </div>
                        {milestone.amount && (
                          <span className="font-medium">${milestone.amount.toLocaleString()}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {milestones.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      No milestones defined
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="amendments" className="space-y-4 mt-4">
                {amendments.map((amendment) => (
                  <Card key={amendment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{amendment.amendment_number}</CardTitle>
                          <CardDescription>{amendment.amendment_type}</CardDescription>
                        </div>
                        <Badge variant="outline">
                          {new Date(amendment.effective_date).toLocaleDateString()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{amendment.description}</p>
                    </CardContent>
                  </Card>
                ))}
                {amendments.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      No amendments recorded
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4 mt-4">
                {compliance.map((item) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{item.compliance_type}</CardTitle>
                          <CardDescription>{item.requirement}</CardDescription>
                        </div>
                        <Badge 
                          variant={item.status === "compliant" ? "default" : "destructive"}
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {item.due_date && (
                        <div className="text-sm text-muted-foreground">
                          Due: {new Date(item.due_date).toLocaleDateString()}
                        </div>
                      )}
                      {item.notes && (
                        <p className="text-sm mt-2">{item.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {compliance.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      No compliance requirements defined
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    );
}
