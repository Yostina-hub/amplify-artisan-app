import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PaymentGatewaySelector } from "./PaymentGatewaySelector";

interface SubscriptionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlanId?: string;
  isTrialMode?: boolean;
  isUpgradeMode?: boolean;
}

export const SubscriptionForm = ({ open, onOpenChange, selectedPlanId, isTrialMode = false, isUpgradeMode = false }: SubscriptionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [pendingSubscriptionId, setPendingSubscriptionId] = useState<string | null>(null);
  const [subscriptionAmount, setSubscriptionAmount] = useState(0);

  useEffect(() => {
    if (isUpgradeMode) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          setUserEmail(data.user.email || '');
        }
      });
    }
  }, [isUpgradeMode]);

  const { data: trialSettings } = useQuery({
    queryKey: ['trial-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('trial_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: isTrialMode,
  });

  const { data: plans } = useQuery({
    queryKey: ['pricing-plans-form'],
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

  const submitMutation = useMutation({
    mutationFn: async (formData: any) => {
      let dataToInsert = { ...formData, status: 'pending' };
      
      if (isTrialMode && trialSettings) {
        const trialStartsAt = new Date();
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + trialSettings.trial_duration_days);
        
        dataToInsert = {
          ...formData,
          is_trial: true,
          trial_started_at: trialStartsAt.toISOString(),
          trial_ends_at: trialEndsAt.toISOString(),
          status: 'approved',
        };
      }

      if (isUpgradeMode) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Update existing trial subscription to converted
        const { error: updateError } = await supabase
          .from('subscription_requests')
          .update({ 
            trial_converted: true,
            status: 'payment_pending',
            pricing_plan_id: formData.pricing_plan_id,
            message: formData.message,
          })
          .eq('email', user.email)
          .eq('is_trial', true);

        if (updateError) throw updateError;

        // Send upgrade confirmation email
        const { error: emailError } = await supabase.functions.invoke('send-upgrade-confirmation', {
          body: {
            email: user.email,
            fullName: formData.full_name,
            planId: formData.pricing_plan_id,
          },
        });

        if (emailError) {
          console.error('Error sending upgrade confirmation:', emailError);
        }

        return; // Exit early for upgrade mode
      }
      
      const { data: requestData, error: insertError } = await supabase
        .from('subscription_requests')
        .insert(dataToInsert)
        .select()
        .single();
      
      if (insertError) throw insertError;

      // If trial mode, create user account and send welcome email
      if (isTrialMode && requestData) {
        const { error: emailError } = await supabase.functions.invoke('send-trial-welcome-email', {
          body: {
            email: formData.email,
            fullName: formData.full_name,
            subscriptionRequestId: requestData.id,
          },
        });

        if (emailError) {
          console.error('Error sending trial welcome email:', emailError);
          // Don't throw - subscription was created successfully
        }
      }

      return requestData;
    },
    onSuccess: (data) => {
      console.log("Subscription request submitted successfully:", data);
      
      // For trial mode, skip payment and show success
      if (isTrialMode) {
        setShowSuccess(true);
        toast.success("Trial started! Check your email for details.");
        return;
      }

      // For upgrade mode, show success
      if (isUpgradeMode) {
        setShowSuccess(true);
        toast.success("Subscription upgraded successfully!");
        return;
      }

      // For paid subscriptions, show payment gateway
      if (data) {
        const selectedPlan = plans?.find(p => p.id === data.pricing_plan_id);
        if (selectedPlan) {
          setPendingSubscriptionId(data.id);
          setSubscriptionAmount(selectedPlan.price);
          setShowPayment(true);
        }
      }
    },
    onError: (error) => {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request. Please try again.');
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      pricing_plan_id: isTrialMode ? selectedPlanId : formData.get('plan_id'),
      full_name: formData.get('full_name'),
      email: isUpgradeMode ? userEmail : formData.get('email'),
      phone: isUpgradeMode ? null : formData.get('phone'),
      company_name: isUpgradeMode ? null : formData.get('company_name'),
      industry: isUpgradeMode ? null : formData.get('industry'),
      message: formData.get('message'),
    };

    submitMutation.mutate(data);
  };

  const handlePaymentComplete = async (transactionId: string, method: string) => {
    if (!pendingSubscriptionId) return;

    try {
      const { error } = await supabase.functions.invoke('process-payment', {
        body: {
          subscriptionRequestId: pendingSubscriptionId,
          amount: subscriptionAmount,
          currency: 'USD',
          paymentMethod: method,
        }
      });

      if (error) throw error;

      setShowPayment(false);
      setShowSuccess(true);
      toast.success("Payment processed successfully!");
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Payment processing failed");
    }
  };

  // Payment gateway state
  if (showPayment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <PaymentGatewaySelector
            amount={subscriptionAmount}
            currency="USD"
            onPaymentComplete={handlePaymentComplete}
            onCancel={() => {
              setShowPayment(false);
              onOpenChange(false);
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Success state
  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setShowSuccess(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4 py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-2xl">
              {isUpgradeMode ? 'Upgrade Request Submitted! 🎉' : isTrialMode ? 'Trial Activated! 🎉' : 'Payment Complete! 🎉'}
            </DialogTitle>
            <DialogDescription className="text-base">
              {isUpgradeMode
                ? 'Thank you for upgrading! Our team will review your request and send you payment instructions via email within 24 hours.'
                : isTrialMode 
                  ? 'Your trial account has been created! Check your email for login credentials. You can start exploring all features immediately.'
                  : 'Thank you! Your payment has been received and your subscription is now active. Check your email for login credentials.'
              }
            </DialogDescription>
            <Button onClick={() => {
              setShowSuccess(false);
              onOpenChange(false);
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {(isTrialMode || isUpgradeMode) && <Sparkles className="h-6 w-6 text-primary" />}
            {isUpgradeMode ? 'Upgrade to Premium' : isTrialMode ? 'Start Your Free Trial' : 'Start Your Subscription'}
          </DialogTitle>
          <DialogDescription>
            {isUpgradeMode
              ? 'Choose a plan and complete the upgrade to continue enjoying premium features after your trial.'
              : isTrialMode 
                ? `Start your ${trialSettings?.trial_duration_days || 3}-day free trial instantly - no credit card required!`
                : 'Fill out this form and our team will review your request. You\'ll receive payment instructions after approval.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {!isTrialMode && (
            <div className="space-y-2">
              <Label htmlFor="plan_id">Select Plan *</Label>
              <Select name="plan_id" defaultValue={selectedPlanId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ${plan.price}/{plan.billing_period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                name="full_name"
                placeholder="John Doe"
                required
              />
            </div>

            {!isUpgradeMode && (
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  required
                />
              </div>
            )}
          </div>

{!isUpgradeMode && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+251912345678"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  placeholder="Your Company"
                />
              </div>
            </div>
          )}

          {!isUpgradeMode && (
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select name="industry">
                <SelectTrigger>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="nonprofit">Non-Profit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Additional Information</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Tell us about your needs..."
              rows={3}
            />
          </div>

          {!isTrialMode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>What happens next?</strong><br />
                1. Our team reviews your request (24-48 hours)<br />
                2. You'll receive approval email with payment instructions<br />
                3. Complete payment via Telebirr, CBE, or Bank Transfer<br />
                4. Get instant access to your account
              </p>
            </div>
          )}

          {isTrialMode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>🚀 Instant Access!</strong><br />
                Your account will be created immediately and you'll receive login credentials via email within seconds. No approval needed - start exploring right away!
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUpgradeMode ? 'Processing Upgrade...' : isTrialMode ? 'Starting Trial...' : 'Submitting...'}
                </>
              ) : (
                isUpgradeMode ? 'Upgrade Now' : isTrialMode ? 'Start Free Trial Now' : 'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};