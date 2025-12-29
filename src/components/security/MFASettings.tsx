import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, ShieldOff, Loader2, Mail, Smartphone } from 'lucide-react';
import { useMFA } from '@/hooks/useMFA';
import { useAuth } from '@/hooks/useAuth';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function MFASettings() {
  const { user } = useAuth();
  const { loading, mfaStatus, checkMFAStatus, enableMFA, disableMFA } = useMFA();
  const [method, setMethod] = useState<'email' | 'sms'>('email');

  useEffect(() => {
    if (user?.id) {
      checkMFAStatus(user.id);
    }
  }, [user?.id, checkMFAStatus]);

  useEffect(() => {
    if (mfaStatus?.preferred_method) {
      setMethod(mfaStatus.preferred_method as 'email' | 'sms');
    }
  }, [mfaStatus]);

  const handleToggleMFA = async () => {
    if (!user?.id) return;

    if (mfaStatus?.mfa_enabled) {
      await disableMFA(user.id);
    } else {
      await enableMFA(user.id, method);
    }
  };

  const isEnabled = mfaStatus?.mfa_enabled || false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <ShieldCheck className="w-6 h-6 text-green-500" />
            ) : (
              <ShieldOff className="w-6 h-6 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
          </div>
          <Badge variant={isEnabled ? 'default' : 'secondary'}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center justify-between py-4 border-t border-b">
          <div className="space-y-0.5">
            <Label htmlFor="mfa-toggle" className="text-base">
              Enable Two-Factor Authentication
            </Label>
            <p className="text-sm text-muted-foreground">
              Require a verification code when signing in
            </p>
          </div>
          <Switch
            id="mfa-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggleMFA}
            disabled={loading}
          />
        </div>

        {!isEnabled && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Verification Method</Label>
            <RadioGroup value={method} onValueChange={(v) => setMethod(v as 'email' | 'sms')}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="email" id="email" />
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label htmlFor="email" className="cursor-pointer">Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive codes via email
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer opacity-50">
                <RadioGroupItem value="sms" id="sms" disabled />
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label htmlFor="sms" className="cursor-pointer">SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive codes via text message (coming soon)
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        {isEnabled && mfaStatus?.last_mfa_at && (
          <div className="text-sm text-muted-foreground">
            Last verified: {new Date(mfaStatus.last_mfa_at).toLocaleString()}
          </div>
        )}

        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Why use two-factor authentication?</p>
              <p className="text-muted-foreground mt-1">
                Two-factor authentication adds an extra layer of security by requiring 
                a one-time code in addition to your password. This helps protect your 
                account even if your password is compromised.
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
