import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Building2, Check, DollarSign } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const companyApplicationSchema = z.object({
  name: z.string().trim().min(2, "Company name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().optional(),
  website: z.string().trim().url("Invalid website URL").optional().or(z.literal("")),
  industry: z.string().trim().optional(),
  companySize: z.string().optional(),
  address: z.string().trim().optional(),
  pricingPlanId: z.string().optional(),
});

export default function CompanyApplication() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    companySize: "",
    address: "",
    pricingPlanId: "",
  });

  // Fetch active pricing plans
  const { data: pricingPlans, isLoading: plansLoading } = useQuery({
    queryKey: ['pricing-plans-company-app'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataToValidate = {
        ...formData,
        pricingPlanId: selectedPlan || undefined,
      };
      
      const validation = companyApplicationSchema.safeParse(dataToValidate);
      if (!validation.success) {
        toast.error(validation.error.issues[0].message);
        return;
      }

      setIsSubmitting(true);

      const { error } = await supabase.from("companies").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        website: formData.website || null,
        industry: formData.industry || null,
        company_size: formData.companySize || null,
        address: formData.address || null,
        pricing_plan_id: selectedPlan || null,
      });

      if (error) throw error;

      toast.success("Application submitted successfully! We'll review it and get back to you soon.");
      navigate("/auth");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      if (error.code === "23505") {
        toast.error("A company with this email already exists");
      } else {
        toast.error("Failed to submit application. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Apply for Company Access</CardTitle>
          <CardDescription>
            Fill out the form below to request access to our SaaS platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Acme Inc."
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Company Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@company.com"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Select
                  value={formData.companySize}
                  onValueChange={(value) => setFormData({ ...formData, companySize: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="companySize">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Company headquarters address"
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            {/* Pricing Plans Section */}
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h3 className="text-lg font-semibold mb-2">Select a Pricing Plan (Optional)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Review our pricing plans and select the one that best fits your needs. You can change this later.
                </p>
              </div>
              
              {plansLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading pricing plans...</p>
                </div>
              ) : pricingPlans && pricingPlans.length > 0 ? (
                <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pricingPlans.map((plan) => (
                      <Card
                        key={plan.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
                        } ${plan.is_popular ? 'border-primary' : ''}`}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-xl">{plan.name}</CardTitle>
                              {plan.description && (
                                <CardDescription className="text-xs mt-1">
                                  {plan.description}
                                </CardDescription>
                              )}
                            </div>
                            <RadioGroupItem value={plan.id} id={plan.id} />
                          </div>
                          {plan.is_popular && (
                            <Badge variant="default" className="w-fit">Most Popular</Badge>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-baseline gap-1">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <span className="text-3xl font-bold">{plan.price}</span>
                            <span className="text-muted-foreground">/{plan.billing_period}</span>
                          </div>
                          
                          {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                            <ul className="space-y-2 text-sm">
                              {(plan.features as string[]).slice(0, 5).map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                  <span className="text-muted-foreground">{feature}</span>
                                </li>
                              ))}
                              {(plan.features as string[]).length > 5 && (
                                <li className="text-xs text-muted-foreground italic">
                                  +{(plan.features as string[]).length - 5} more features
                                </li>
                              )}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pricing plans available at the moment.
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/auth")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
