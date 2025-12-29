import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special_chars: boolean;
  min_special_chars: number;
  max_repeated_chars: number;
  prevent_common_passwords: boolean;
  prevent_username_in_password: boolean;
  password_history_count: number;
  max_age_days: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very_strong';
  score: number;
}

const COMMON_PASSWORDS = [
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'abc123', 'monkey', '1234567', 'letmein', 'trustno1',
  'dragon', 'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
  'passw0rd', 'shadow', '123123', '654321', 'superman', 'qazwsx',
  'michael', 'football', 'password12', 'princess', 'admin', 'welcome',
  'login', 'starwars', 'hello', 'charlie', 'donald', 'password2'
];

export const usePasswordPolicy = () => {
  const [policy, setPolicy] = useState<PasswordPolicy | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch password policy
  const fetchPolicy = useCallback(async (companyId?: string): Promise<PasswordPolicy> => {
    setLoading(true);
    try {
      let query = supabase
        .from('password_policy_settings')
        .select('*');
      
      if (companyId) {
        query = query.eq('company_id', companyId);
      } else {
        query = query.is('company_id', null);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        // Return default policy
        const defaultPolicy: PasswordPolicy = {
          min_length: 12,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_special_chars: true,
          min_special_chars: 1,
          max_repeated_chars: 3,
          prevent_common_passwords: true,
          prevent_username_in_password: true,
          password_history_count: 5,
          max_age_days: 90
        };
        setPolicy(defaultPolicy);
        return defaultPolicy;
      }

      setPolicy(data as PasswordPolicy);
      return data as PasswordPolicy;
    } finally {
      setLoading(false);
    }
  }, []);

  // Validate password against policy
  const validatePassword = useCallback((
    password: string,
    currentPolicy: PasswordPolicy,
    username?: string
  ): ValidationResult => {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < currentPolicy.min_length) {
      errors.push(`Password must be at least ${currentPolicy.min_length} characters long`);
    } else {
      score += Math.min(25, password.length * 2);
    }

    // Uppercase check
    if (currentPolicy.require_uppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 10;
    }

    // Lowercase check
    if (currentPolicy.require_lowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 10;
    }

    // Numbers check
    if (currentPolicy.require_numbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/[0-9]/.test(password)) {
      score += 10;
    }

    // Special characters check
    const specialChars = password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || [];
    if (currentPolicy.require_special_chars && specialChars.length < currentPolicy.min_special_chars) {
      errors.push(`Password must contain at least ${currentPolicy.min_special_chars} special character(s)`);
    } else if (specialChars.length > 0) {
      score += 15 + (specialChars.length * 5);
    }

    // Repeated characters check
    if (currentPolicy.max_repeated_chars > 0) {
      const repeatedRegex = new RegExp(`(.)\\1{${currentPolicy.max_repeated_chars},}`, 'i');
      if (repeatedRegex.test(password)) {
        errors.push(`Password cannot have more than ${currentPolicy.max_repeated_chars} repeated characters`);
      }
    }

    // Common passwords check
    if (currentPolicy.prevent_common_passwords) {
      if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
        errors.push('Password is too common and easily guessed');
      }
    }

    // Username in password check
    if (currentPolicy.prevent_username_in_password && username) {
      if (password.toLowerCase().includes(username.toLowerCase())) {
        errors.push('Password cannot contain your username');
      }
    }

    // Check for sequential characters
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
      score -= 10;
    }

    // Check for keyboard patterns
    if (/(?:qwerty|asdf|zxcv|qazwsx|1qaz|2wsx)/i.test(password)) {
      errors.push('Password contains common keyboard patterns');
      score -= 15;
    }

    // Mixed case bonus
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score += 10;
    }

    // Determine strength
    let strength: ValidationResult['strength'];
    if (score < 30) {
      strength = 'weak';
    } else if (score < 50) {
      strength = 'fair';
    } else if (score < 70) {
      strength = 'good';
    } else if (score < 90) {
      strength = 'strong';
    } else {
      strength = 'very_strong';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score: Math.max(0, Math.min(100, score))
    };
  }, []);

  // Update password policy
  const updatePolicy = useCallback(async (
    newPolicy: Partial<PasswordPolicy>,
    companyId?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('password_policy_settings')
        .upsert({
          company_id: companyId || null,
          ...newPolicy,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });

      if (error) throw error;
      
      await fetchPolicy(companyId);
      return true;
    } catch (error) {
      console.error('Error updating password policy:', error);
      return false;
    }
  }, [fetchPolicy]);

  // Generate secure password
  const generateSecurePassword = useCallback((length: number = 16): string => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + special;
    let password = '';
    
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }, []);

  return {
    policy,
    loading,
    fetchPolicy,
    validatePassword,
    updatePolicy,
    generateSecurePassword
  };
};
