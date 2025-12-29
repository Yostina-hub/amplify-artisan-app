import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, Loader2, RefreshCw, Mail, CheckCircle } from 'lucide-react';
import { useMFA } from '@/hooks/useMFA';

interface MFAVerificationProps {
  userId: string;
  purpose?: 'login' | 'sensitive_action' | 'password_reset';
  onVerified: () => void;
  onCancel?: () => void;
}

export function MFAVerification({ 
  userId, 
  purpose = 'login', 
  onVerified, 
  onCancel 
}: MFAVerificationProps) {
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { loading, otpSent, verified, requestOTP, verifyOTP, resetState } = useMFA();

  useEffect(() => {
    // Auto-send OTP when component mounts
    handleRequestOTP();
    return () => resetState();
  }, []);

  useEffect(() => {
    if (verified) {
      onVerified();
    }
  }, [verified, onVerified]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestOTP = async () => {
    const result = await requestOTP(userId, purpose);
    if (result.success) {
      setCountdown(60);
      setCode('');
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    await verifyOTP(userId, code, purpose);
  };

  const handleCodeComplete = (value: string) => {
    setCode(value);
    if (value.length === 6) {
      verifyOTP(userId, value, purpose);
    }
  };

  if (verified) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Verified Successfully</h3>
          <p className="text-muted-foreground mt-2">Your identity has been confirmed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          {otpSent 
            ? 'Enter the 6-digit code sent to your email'
            : 'We\'ll send a verification code to your email'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {otpSent ? (
          <>
            <div className="flex justify-center">
              <InputOTP 
                maxLength={6} 
                value={code} 
                onChange={handleCodeComplete}
                disabled={loading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              className="w-full" 
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRequestOTP}
                disabled={loading || countdown > 0}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </Button>
            </div>
          </>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleRequestOTP}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Verification Code
              </>
            )}
          </Button>
        )}

        {onCancel && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
