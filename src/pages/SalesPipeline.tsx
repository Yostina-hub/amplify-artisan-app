import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, DollarSign, TrendingUp, Target } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageHelp } from "@/components/PageHelp";
import { useBranches } from "@/hooks/useBranches";

export default function SalesPipeline() {
  const { accessibleBranches } = useBranches();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    account_id: "",
    contact_id: "",
    stage_id: "",
    amount: "",
    probability: "0",
    expected_close_date: "",
    lead_source: "",
    description: "",
    next_step: "",
  });
  const queryClient = useQueryClient();

  const { data: stages } = useQuery({
    queryKey: ["pipeline_stages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipeline_stages")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: opportunities } = useQuery({
    queryKey: ["opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*, accounts(name), contacts(first_name, last_name), pipeline_stages(name, probability)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: contacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const createOpportunityMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: profile } = await supabase.from("profiles").select("company_id").single();
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("opportunities").insert({
        ...data,
        amount: parseFloat(data.amount) || 0,
        probability: parseInt(data.probability),
        company_id: profile?.company_id,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Opportunity created successfully");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateOpportunityStageMutation = useMutation({
    mutationFn: async ({ id, stage_id }: { id: string; stage_id: string }) => {
      const { error } = await supabase
        .from("opportunities")
        .update({ stage_id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Opportunity moved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      account_id: "",
      contact_id: "",
      stage_id: "",
      amount: "",
      probability: "0",
      expected_close_date: "",
      lead_source: "",
      description: "",
      next_step: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOpportunityMutation.mutate(formData);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const getOpportunitiesByStage = (stageId: string) => {
    return opportunities?.filter(opp => opp.stage_id === stageId) || [];
  };

  const totalValue = opportunities?.reduce((sum, opp) => sum + (opp.amount || 0), 0) || 0;
  const avgDealSize = opportunities && opportunities.length > 0 ? totalValue / opportunities.length : 0;

  return (
    <div className="container mx-auto p-6 space-y-8">
      <PageHelp
        title="Sales Pipeline"
        description="Visualize and manage your sales opportunities through customizable pipeline stages. Track deals, forecast revenue, and close more business efficiently."
        features={[
          "Visual Kanban-style pipeline with drag-and-drop",
          "Customizable pipeline stages and probabilities",
          "Opportunity tracking with amount and close dates",
          "Pipeline value and conversion metrics",
          "Link opportunities to accounts and contacts",
          "Branch-based opportunity visibility",
        ]}
        tips={[
          "Keep opportunities moving through stages to maintain velocity",
          "Update probability and amounts regularly for accurate forecasting",
          "Set realistic close dates to prioritize your efforts",
          "Use next steps field to track required actions for each deal",
        ]}
      />

      {/* Revolutionary Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-12 shadow-[var(--shadow-xl)] animate-scale-in" style={{ background: 'var(--gradient-mesh)' }}>
        <div className="absolute inset-0 animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, transparent, hsl(var(--primary-glow) / 0.2), transparent)', backgroundSize: '200% 100%' }} />
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl animate-float" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-glow-pulse">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/70">Sales Pipeline</h1>
            </div>
            <p className="text-muted-foreground text-lg">Visual pipeline for tracking deals through every stage</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)} size="lg" className="shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] group">
                <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                New Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Opportunity</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Opportunity Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account</Label>
                    <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact</Label>
                    <Select value={formData.contact_id} onValueChange={(value) => setFormData({ ...formData, contact_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts?.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.first_name} {contact.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stage *</Label>
                    <Select value={formData.stage_id} onValueChange={(value) => setFormData({ ...formData, stage_id: value })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {stages?.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Probability (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability}
                      onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Close Date</Label>
                    <Input
                      type="date"
                      value={formData.expected_close_date}
                      onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Next Step</Label>
                  <Input
                    value={formData.next_step}
                    onChange={(e) => setFormData({ ...formData, next_step: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
              Total Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">{opportunities?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">In pipeline</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success/20 to-accent/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              Pipeline Value
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-success to-accent">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total opportunity value</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <CardHeader className="pb-3 relative z-10">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              Avg Deal Size
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">{formatCurrency(avgDealSize)}</div>
            <p className="text-xs text-muted-foreground mt-1">Average deal value</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages */}
      <div className="flex gap-6 overflow-x-auto pb-6">
        {stages?.map((stage, index) => {
          const stageOpps = getOpportunitiesByStage(stage.id);
          const stageValue = stageOpps.reduce((sum, opp) => sum + (opp.amount || 0), 0);

          return (
            <Card key={stage.id} className="min-w-[340px] flex-shrink-0 relative overflow-hidden group animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="absolute inset-0 bg-gradient-mesh opacity-5" />
              <CardHeader className="relative z-10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${index % 3 === 0 ? 'from-primary to-primary-glow' : index % 3 === 1 ? 'from-accent to-accent' : 'from-success to-success'} animate-glow-pulse`} />
                  {stage.name}
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span className="font-semibold">{stageOpps.length} deals</span>
                  <span className="text-primary font-bold">{formatCurrency(stageValue)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ScrollArea className="h-[520px] pr-4">
                  <div className="space-y-3">
                    {stageOpps.map((opp: any) => (
                      <Card key={opp.id} className="p-4 hover:shadow-[var(--shadow-card)] transition-all duration-500 cursor-pointer border-2 border-transparent hover:border-primary/20 hover:scale-[1.02] group/card">
                        <div className="space-y-3">
                          <div className="font-semibold text-base group-hover/card:text-primary transition-colors">{opp.name}</div>
                          {opp.accounts && (
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-xs font-bold">
                                {opp.accounts.name.charAt(0)}
                              </div>
                              <span>{opp.accounts.name}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-success to-accent">{formatCurrency(opp.amount || 0)}</span>
                            <Badge variant="outline" className="bg-gradient-to-r from-primary/10 to-accent/10">{opp.pipeline_stages?.probability}%</Badge>
                          </div>
                          {opp.expected_close_date && (
                            <div className="text-xs text-muted-foreground pt-1">
                              Close: {new Date(opp.expected_close_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
