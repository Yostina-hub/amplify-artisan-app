import { useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Softphone from "@/components/call-center/Softphone";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClickToCallProps {
  phoneNumber: string;
  contactName?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function ClickToCall({ 
  phoneNumber, 
  contactName, 
  size = "icon",
  variant = "ghost",
  className = ""
}: ClickToCallProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sipConfig, setSipConfig] = useState<any>(null);
  const [agentExtension, setAgentExtension] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch user preferences and company integration
  const { data: callConfig } = useQuery({
    queryKey: ["call-center-config"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.user.id)
        .single();

      if (!profile?.company_id) return { useCompany: false, companyIntegration: null, userPreference: null };

      // Get user preferences
      const { data: userPref } = await supabase
        .from("user_call_preferences")
        .select("*")
        .eq("user_id", user.user.id)
        .maybeSingle();

      // Get company integration
      const { data: companyInt } = await supabase
        .from("call_center_integrations")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .maybeSingle();

      // Check if company has active subscription
      const hasActiveSubscription = companyInt?.subscription_active && 
        (!companyInt?.subscription_expires_at || new Date(companyInt.subscription_expires_at) > new Date());

      // Determine if user should use company integration
      const useCompany = (userPref?.use_company_integration ?? true) && hasActiveSubscription;

      return {
        useCompany,
        companyIntegration: companyInt,
        userPreference: userPref,
        hasActiveSubscription
      };
    },
  });

  // Load SIP config based on user preference
  useState(() => {
    if (callConfig?.useCompany && callConfig?.companyIntegration?.configuration) {
      // Use company integration
      const configuration = callConfig.companyIntegration.configuration as Record<string, any>;
      const config = {
        sipServer: configuration.sip_server || "",
        sipUser: agentExtension || callConfig.companyIntegration.account_sid || "",
        sipPassword: callConfig.companyIntegration.api_key_encrypted || "",
        sipDomain: configuration.sip_domain || "",
      };
      setSipConfig(config);
      if (config.sipServer && config.sipUser && config.sipPassword) {
        setIsAuthenticated(true);
      }
    } else if (callConfig?.userPreference?.personal_sip_config) {
      // Use personal config from database
      const config = callConfig.userPreference.personal_sip_config as any;
      setSipConfig(config);
      if (config.sipServer && config.sipUser && config.sipPassword) {
        setIsAuthenticated(true);
      }
    } else {
      // Fallback to localStorage
      const savedConfig = localStorage.getItem("sip-config");
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        setSipConfig(parsed);
        if (parsed.sipServer && parsed.sipUser && parsed.sipPassword) {
          setIsAuthenticated(true);
        }
      }
    }
  });

  const handleClick = () => {
    if (!phoneNumber) return;
    setIsOpen(true);
  };

  const handleCallStart = () => {
    console.log("Call started to:", phoneNumber);
  };

  const handleCallEnd = async (duration: number) => {
    console.log("Call ended. Duration:", duration);
    // Log call to database
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id, full_name")
      .eq("id", user.user.id)
      .single();

    if (profile) {
      await supabase.from("call_logs").insert({
        phone_number: phoneNumber,
        contact_name: contactName || "",
        agent_name: profile.full_name || "",
        call_duration_seconds: duration,
        call_status: "completed",
        company_id: profile.company_id,
        agent_id: user.user.id,
        call_started_at: new Date(Date.now() - duration * 1000).toISOString(),
        call_ended_at: new Date().toISOString(),
      });
    }
  };

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={handleClick}
        className={`hover:scale-110 transition-transform ${className}`}
        title={`Call ${phoneNumber}`}
      >
        <Phone className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Call {contactName ? contactName : phoneNumber}
            </DialogTitle>
          </DialogHeader>
          {isAuthenticated && sipConfig ? (
            <Softphone
              sipConfig={sipConfig}
              onCallStart={handleCallStart}
              onCallEnd={handleCallEnd}
              onOpenSettings={() => {}}
            />
          ) : (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                {callConfig?.hasActiveSubscription 
                  ? "Company call center subscription is available"
                  : "No active call center subscription"}
              </p>
              <p className="text-sm text-muted-foreground">
                Please configure SIP settings in the Call Center page to enable calling.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
