import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Sparkles, FileText, Download, Send, CircleCheck as CheckCircle2, DollarSign, Calendar, Target, TrendingUp, Zap, Copy, CreditCard as Edit, Eye } from "lucide-react";
import { PageHelp } from "@/components/PageHelp";

interface ProposalData {
  clientName: string;
  clientCompany: string;
  clientIndustry: string;
  painPoints: string[];
  objectives: string[];
  solutions: Solution[];
  pricing: PricingOption[];
  timeline: string;
  roi: ROI;
}

interface Solution {
  name: string;
  description: string;
  features: string[];
  deliverables: string[];
}

interface PricingOption {
  tier: string;
  price: number;
  term: string;
  included: string[];
  optional: string[];
}

interface ROI {
  timeToValue: string;
  projectedReturn: string;
  keyMetrics: Metric[];
}

interface Metric {
  name: string;
  current: string;
  projected: string;
  improvement: string;
}

export default function ProposalGenerator() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ProposalData>>({
    painPoints: [],
    objectives: [],
    solutions: [],
    pricing: [],
  });

  const handleGenerate = async () => {
    setIsGenerating(true);

    // Simulate AI generation
    setTimeout(() => {
      setGeneratedProposal("generated");
      setIsGenerating(false);
      toast.success("Proposal generated successfully!");
    }, 2000);
  };

  const totalSteps = 5;

  return (
    <div className="space-y-6">
      <PageHelp
        title="AI Proposal Generator"
        description="Generate professional, customized sales proposals in minutes using AI."
        features={[
          "AI-powered proposal writing",
          "Customizable templates",
          "ROI calculator integration",
          "Pricing table builder",
          "Timeline and milestone planning",
          "Export to PDF/Word"
        ]}
        tips={[
          "Fill in all sections for best results",
          "Use specific pain points and metrics",
          "Customize AI-generated content",
          "Include case studies for credibility",
          "Review and edit before sending"
        ]}
      />

      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Proposal Generator
        </h2>
        <p className="text-muted-foreground">
          Create winning proposals in minutes with AI assistance
        </p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Step {step} of {totalSteps}</span>
              <span className="text-muted-foreground">{Math.round((step / totalSteps) * 100)}% Complete</span>
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs value={`step-${step}`} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="step-1" onClick={() => setStep(1)}>
            Client Info
          </TabsTrigger>
          <TabsTrigger value="step-2" onClick={() => setStep(2)}>
            Pain Points
          </TabsTrigger>
          <TabsTrigger value="step-3" onClick={() => setStep(3)}>
            Solutions
          </TabsTrigger>
          <TabsTrigger value="step-4" onClick={() => setStep(4)}>
            Pricing
          </TabsTrigger>
          <TabsTrigger value="step-5" onClick={() => setStep(5)}>
            Generate
          </TabsTrigger>
        </TabsList>

        {/* Step 1: Client Information */}
        <TabsContent value="step-1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
              <CardDescription>Basic details about your prospect</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input placeholder="John Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="VP of Sales" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input placeholder="Acme Corporation" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saas">SaaS / Technology</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Financial Services</SelectItem>
                      <SelectItem value="retail">Retail / E-commerce</SelectItem>
                      <SelectItem value="professional">Professional Services</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Company Size</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="501+">501+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current Situation</Label>
                <Textarea
                  placeholder="Describe their current process, tools they use, and any challenges mentioned..."
                  rows={4}
                />
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                Next: Pain Points
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 2: Pain Points & Objectives */}
        <TabsContent value="step-2" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pain Points</CardTitle>
                <CardDescription>What problems are they trying to solve?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {["Manual data entry consuming 10+ hours/week", "Lack of visibility into sales pipeline", "Inconsistent follow-up process"].map((pain, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm">{pain}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pain Point
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Objectives</CardTitle>
                <CardDescription>What are they trying to achieve?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {["Increase sales team productivity by 30%", "Close more deals in Q4", "Improve forecast accuracy"].map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <Target className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm">{obj}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Objective
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1">
              Next: Solutions
            </Button>
          </div>
        </TabsContent>

        {/* Step 3: Solutions */}
        <TabsContent value="step-3" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Proposed Solutions</CardTitle>
              <CardDescription>What you're recommending to solve their problems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Card className="border-2 border-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Solution 1: CRM Implementation</CardTitle>
                    <Badge>Recommended</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Description</Label>
                    <Textarea
                      defaultValue="Complete CRM setup including data migration, custom workflows, and team training"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Key Features</Label>
                    <div className="space-y-1">
                      {["Contact & Lead Management", "Sales Pipeline Tracking", "Email Integration", "Reporting Dashboard"].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Deliverables</Label>
                    <div className="space-y-1">
                      {["Fully configured CRM system", "Migrated data from spreadsheets", "Custom sales workflows", "Team training (4 sessions)"].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Another Solution
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  Next: Pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 4: Pricing */}
        <TabsContent value="step-4" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Options</CardTitle>
              <CardDescription>Investment required for the proposed solution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: "Starter", price: 5000, term: "One-time setup" },
                  { name: "Professional", price: 12000, term: "One-time setup", recommended: true },
                  { name: "Enterprise", price: 25000, term: "One-time setup" }
                ].map((tier, i) => (
                  <Card key={i} className={tier.recommended ? "border-2 border-primary" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{tier.name}</CardTitle>
                        {tier.recommended && <Badge>Recommended</Badge>}
                      </div>
                      <CardDescription>{tier.term}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-3xl font-bold">${tier.price.toLocaleString()}</div>
                        <p className="text-sm text-muted-foreground mt-1">+ $199/mo subscription</p>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Includes:</h4>
                        <div className="space-y-1">
                          {["Setup & Configuration", "Data Migration", "Basic Training", i > 0 && "Custom Workflows", i > 1 && "Priority Support", i > 1 && "Dedicated Account Manager"].filter(Boolean).map((item: any, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">ROI Projection:</h4>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="text-sm font-semibold text-green-900">
                            Break-even: {i === 0 ? "6" : i === 1 ? "4" : "3"} months
                          </div>
                          <div className="text-xs text-green-800 mt-1">
                            Projected savings: ${(tier.price * (i === 0 ? 3 : i === 1 ? 4 : 6)).toLocaleString()}/year
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button onClick={() => setStep(5)} className="flex-1">
                  Next: Generate Proposal
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 5: Generate */}
        <TabsContent value="step-5" className="space-y-4">
          {!generatedProposal ? (
            <Card>
              <CardHeader>
                <CardTitle>Generate Your Proposal</CardTitle>
                <CardDescription>Review settings and generate your AI-powered proposal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">Include Executive Summary</h4>
                      <p className="text-sm text-muted-foreground">AI-generated overview of the proposal</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">Include Case Studies</h4>
                      <p className="text-sm text-muted-foreground">Add relevant customer success stories</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">Include Implementation Timeline</h4>
                      <p className="text-sm text-muted-foreground">Detailed project milestones</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">Include Terms & Conditions</h4>
                      <p className="text-sm text-muted-foreground">Standard contract terms</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(4)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                        Generating with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Proposal
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Proposal is Ready!</CardTitle>
                    <CardDescription>Review, edit, and send to your prospect</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Generated
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-[400px] border rounded-lg p-6 bg-white">
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-bold mb-2">Sales Proposal for Acme Corporation</h1>
                      <p className="text-muted-foreground">Prepared for John Smith, VP of Sales</p>
                      <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
                    </div>

                    <Separator />

                    <div>
                      <h2 className="text-xl font-bold mb-3">Executive Summary</h2>
                      <p className="text-sm leading-relaxed">
                        This proposal outlines a comprehensive CRM solution designed specifically for Acme Corporation's sales team.
                        Our solution addresses your key challenges including manual data entry, lack of pipeline visibility, and
                        inconsistent follow-up processes. With our proven methodology and technology, we project a 30% increase in
                        sales team productivity within the first quarter of implementation.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold mb-3">Current Challenges</h2>
                      <ul className="space-y-2">
                        <li className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2" />
                          <span>Manual data entry consuming 10+ hours per week per sales rep</span>
                        </li>
                        <li className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2" />
                          <span>Limited visibility into sales pipeline and deal status</span>
                        </li>
                        <li className="text-sm flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2" />
                          <span>Inconsistent follow-up process leading to missed opportunities</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold mb-3">Proposed Solution</h2>
                      <p className="text-sm leading-relaxed mb-4">
                        We propose implementing our Professional CRM package, which includes:
                      </p>
                      <ul className="space-y-2">
                        {["Complete CRM setup and configuration", "Data migration from existing systems", "Custom workflow automation", "Comprehensive team training (4 sessions)", "Ongoing support and optimization"].map((item, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold mb-3">Investment & ROI</h2>
                      <div className="p-4 bg-primary/5 border-2 border-primary rounded-lg">
                        <div className="text-lg font-bold mb-1">$12,000 one-time setup + $199/month</div>
                        <div className="text-sm text-muted-foreground mb-4">Professional Package (Recommended)</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-semibold">Break-even Point</div>
                            <div className="text-2xl font-bold text-primary">4 months</div>
                          </div>
                          <div>
                            <div className="font-semibold">Projected Annual Savings</div>
                            <div className="text-2xl font-bold text-green-600">$48,000</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold mb-3">Implementation Timeline</h2>
                      <div className="space-y-3">
                        {[
                          { phase: "Week 1-2", task: "System setup & data migration" },
                          { phase: "Week 3", task: "Workflow configuration & testing" },
                          { phase: "Week 4", task: "Team training (4 sessions)" },
                          { phase: "Week 5+", task: "Go-live & ongoing support" }
                        ].map((milestone, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-20 text-sm font-semibold">{milestone.phase}</div>
                            <div className="flex-1 text-sm">{milestone.task}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-bold mb-3">Next Steps</h2>
                      <ol className="space-y-2">
                        <li className="text-sm flex gap-2">
                          <span className="font-semibold">1.</span>
                          <span>Review this proposal and share with stakeholders</span>
                        </li>
                        <li className="text-sm flex gap-2">
                          <span className="font-semibold">2.</span>
                          <span>Schedule a call to address any questions</span>
                        </li>
                        <li className="text-sm flex gap-2">
                          <span className="font-semibold">3.</span>
                          <span>Sign agreement and begin implementation</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setGeneratedProposal(null)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button className="flex-1">
                    <Send className="mr-2 h-4 w-4" />
                    Send to Client
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
