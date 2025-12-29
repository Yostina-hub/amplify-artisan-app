// Secure cookie management utilities

export interface CookieOptions {
  expires?: Date | number; // Date or days from now
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  httpOnly?: boolean; // Note: JavaScript can't set httpOnly cookies
}

// Default secure cookie options
const DEFAULT_OPTIONS: CookieOptions = {
  path: '/',
  secure: window.location.protocol === 'https:',
  sameSite: 'Lax'
};

// Set a cookie with secure defaults
export const setCookie = (
  name: string, 
  value: string, 
  options: CookieOptions = {}
): void => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  if (opts.expires) {
    const expiresDate = typeof opts.expires === 'number'
      ? new Date(Date.now() + opts.expires * 24 * 60 * 60 * 1000)
      : opts.expires;
    cookieString += `; expires=${expiresDate.toUTCString()}`;
  }
  
  if (opts.path) {
    cookieString += `; path=${opts.path}`;
  }
  
  if (opts.domain) {
    cookieString += `; domain=${opts.domain}`;
  }
  
  if (opts.secure) {
    cookieString += '; secure';
  }
  
  if (opts.sameSite) {
    cookieString += `; samesite=${opts.sameSite}`;
  }
  
  document.cookie = cookieString;
};

// Get a cookie value
export const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split(';');
  const encodedName = encodeURIComponent(name);
  
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === encodedName) {
      return decodeURIComponent(cookieValue || '');
    }
  }
  
  return null;
};

// Delete a cookie
export const deleteCookie = (name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void => {
  setCookie(name, '', {
    ...options,
    expires: new Date(0)
  });
};

// Check if cookies are enabled
export const areCookiesEnabled = (): boolean => {
  try {
    const testCookie = '__cookie_test__';
    setCookie(testCookie, 'test', { expires: 1 });
    const enabled = getCookie(testCookie) === 'test';
    deleteCookie(testCookie);
    return enabled;
  } catch {
    return false;
  }
};

// Secure session storage with encryption-like obfuscation
// Note: This is not true encryption, just obfuscation for casual inspection
const obfuscate = (data: string): string => {
  return btoa(encodeURIComponent(data));
};

const deobfuscate = (data: string): string => {
  try {
    return decodeURIComponent(atob(data));
  } catch {
    return '';
  }
};

// Secure session storage wrapper
export const secureSession = {
  set: (key: string, value: unknown): void => {
    try {
      const json = JSON.stringify(value);
      const obfuscated = obfuscate(json);
      sessionStorage.setItem(key, obfuscated);
    } catch (error) {
      console.error('Error setting secure session:', error);
    }
  },
  
  get: <T>(key: string): T | null => {
    try {
      const obfuscated = sessionStorage.getItem(key);
      if (!obfuscated) return null;
      
      const json = deobfuscate(obfuscated);
      return JSON.parse(json) as T;
    } catch {
      return null;
    }
  },
  
  remove: (key: string): void => {
    sessionStorage.removeItem(key);
  },
  
  clear: (): void => {
    sessionStorage.clear();
  }
};

// Secure local storage wrapper with expiration support
export const secureLocal = {
  set: (key: string, value: unknown, expiresInDays?: number): void => {
    try {
      const data = {
        value,
        expires: expiresInDays 
          ? Date.now() + expiresInDays * 24 * 60 * 60 * 1000 
          : null
      };
      const json = JSON.stringify(data);
      const obfuscated = obfuscate(json);
      localStorage.setItem(key, obfuscated);
    } catch (error) {
      console.error('Error setting secure local:', error);
    }
  },
  
  get: <T>(key: string): T | null => {
    try {
      const obfuscated = localStorage.getItem(key);
      if (!obfuscated) return null;
      
      const json = deobfuscate(obfuscated);
      const data = JSON.parse(json);
      
      // Check expiration
      if (data.expires && Date.now() > data.expires) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data.value as T;
    } catch {
      return null;
    }
  },
  
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
  
  clear: (): void => {
    localStorage.clear();
  }
};

// CSRF token management
export const csrf = {
  generate: (): string => {
    const token = crypto.randomUUID();
    secureSession.set('csrf_token', token);
    return token;
  },
  
  get: (): string | null => {
    return secureSession.get<string>('csrf_token');
  },
  
  validate: (token: string): boolean => {
    const storedToken = csrf.get();
    return storedToken !== null && storedToken === token;
  },
  
  refresh: (): string => {
    return csrf.generate();
  }
};

// Session fingerprint for additional security
export const generateSessionFingerprint = (): string => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth.toString(),
    `${screen.width}x${screen.height}`,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || 'unknown'
  ];
  
  // Simple hash function
  const hash = components.join('|').split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return Math.abs(hash).toString(36);
};
