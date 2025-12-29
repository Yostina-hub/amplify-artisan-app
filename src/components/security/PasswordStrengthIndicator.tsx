import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, X, AlertTriangle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
  score: number;
  showRequirements?: boolean;
}

const strengthColors = {
  weak: 'bg-red-500',
  fair: 'bg-orange-500',
  good: 'bg-yellow-500',
  strong: 'bg-green-500',
  very_strong: 'bg-emerald-500'
};

const strengthLabels = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
  very_strong: 'Very Strong'
};

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  errors,
  strength,
  score,
  showRequirements = true
}) => {
  if (!password) return null;

  const requirements = [
    { label: 'At least 12 characters', met: password.length >= 12 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) }
  ];

  return (
    <div className="space-y-3 mt-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Password Strength</span>
          <span className={cn(
            'font-medium',
            strength === 'weak' && 'text-red-500',
            strength === 'fair' && 'text-orange-500',
            strength === 'good' && 'text-yellow-500',
            strength === 'strong' && 'text-green-500',
            strength === 'very_strong' && 'text-emerald-500'
          )}>
            {strengthLabels[strength]}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn('h-full transition-all duration-300', strengthColors[strength])}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="space-y-1">
          {requirements.map((req, index) => (
            <div 
              key={index} 
              className={cn(
                'flex items-center gap-2 text-xs',
                req.met ? 'text-green-600' : 'text-muted-foreground'
              )}
            >
              {req.met ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-red-500">
              <AlertTriangle className="h-3 w-3" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
