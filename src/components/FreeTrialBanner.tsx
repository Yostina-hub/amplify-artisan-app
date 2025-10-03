import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface TrialInfo {
  is_trial: boolean;
  trial_ends_at: string;
  days_remaining: number;
  trial_converted: boolean;
}

export const FreeTrialBanner = () => {
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrialInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_user_trial_info', {
        _user_id: user.id
      });

      if (!error && data && data.length > 0) {
        setTrialInfo(data[0]);
      }
      setLoading(false);
    };

    fetchTrialInfo();
  }, []);

  if (loading || !trialInfo || !trialInfo.is_trial || trialInfo.days_remaining <= 0) {
    return null;
  }

  const isExpiringSoon = trialInfo.days_remaining <= 2;

  return (
    <Alert className={`mb-6 border-2 ${isExpiringSoon ? 'border-destructive bg-destructive/5' : 'border-primary bg-primary/5'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${isExpiringSoon ? 'bg-destructive/10' : 'bg-primary/10'}`}>
          {isExpiringSoon ? (
            <Clock className={`h-5 w-5 ${isExpiringSoon ? 'text-destructive' : 'text-primary'}`} />
          ) : (
            <Sparkles className="h-5 w-5 text-primary" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold">Free Trial Active</h4>
            <Badge variant={isExpiringSoon ? "destructive" : "default"}>
              {trialInfo.days_remaining} {trialInfo.days_remaining === 1 ? 'day' : 'days'} remaining
            </Badge>
          </div>
          <AlertDescription>
            {isExpiringSoon ? (
              <>Your trial is expiring soon! Upgrade now to continue enjoying all premium features without interruption.</>
            ) : (
              <>You're experiencing our premium features. Upgrade anytime to continue after your trial ends.</>
            )}
          </AlertDescription>
          <Button 
            onClick={() => navigate('/')} 
            className="mt-3"
            variant={isExpiringSoon ? "default" : "outline"}
          >
            View Pricing Plans
          </Button>
        </div>
      </div>
    </Alert>
  );
};
