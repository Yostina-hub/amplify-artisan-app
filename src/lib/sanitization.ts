// Content sanitization utilities for security

// Basic HTML entity encoding
export const escapeHtml = (text: string): string => {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return text.replace(/[&<>"'`=/]/g, char => htmlEntities[char] || char);
};

// Remove all HTML tags
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

// Sanitize for safe HTML display (basic XSS prevention)
export const sanitizeHtml = (html: string): string => {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: protocol (except for safe image types)
  sanitized = sanitized.replace(/data:(?!image\/(png|jpeg|gif|webp))[^;,]*[;,]/gi, '');
  
  // Remove vbscript: protocol
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove iframe, object, embed, form tags
  sanitized = sanitized.replace(/<(iframe|object|embed|form|base|meta|link)[^>]*>/gi, '');
  
  // Remove expression() in styles
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, '');
  
  return sanitized;
};

// Sanitize URL
export const sanitizeUrl = (url: string): string => {
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:'];
  if (dangerousProtocols.some(protocol => trimmed.startsWith(protocol))) {
    return '';
  }
  
  // Allow only http, https, mailto, tel protocols
  const allowedProtocols = ['http://', 'https://', 'mailto:', 'tel:'];
  const hasProtocol = allowedProtocols.some(protocol => trimmed.startsWith(protocol));
  
  if (!hasProtocol && !trimmed.startsWith('/') && !trimmed.startsWith('#')) {
    // Relative URL or needs protocol
    return url.startsWith('//') ? `https:${url}` : url;
  }
  
  return url;
};

// Sanitize for use in SQL-like patterns (prevent SQL wildcards injection)
export const sanitizeSearchPattern = (pattern: string): string => {
  return pattern
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/\\/g, '\\\\');
};

// Sanitize JSON input
export const sanitizeJsonInput = <T>(input: unknown): T | null => {
  try {
    const json = typeof input === 'string' ? JSON.parse(input) : input;
    return JSON.parse(JSON.stringify(json)) as T;
  } catch {
    return null;
  }
};

// Sanitize object keys and values recursively
export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = escapeHtml(key);
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = escapeHtml(value);
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item => 
        typeof item === 'string' ? escapeHtml(item) : 
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : 
        item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[sanitizedKey] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }
  
  return sanitized as T;
};

// Sanitize for CSS values
export const sanitizeCssValue = (value: string): string => {
  // Remove expression(), url() with javascript, and other dangerous patterns
  return value
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/url\s*\(\s*["']?\s*javascript:/gi, '')
    .replace(/behavior\s*:/gi, '')
    .replace(/-moz-binding\s*:/gi, '')
    .replace(/<!--/g, '')
    .replace(/-->/g, '');
};

// Truncate string safely (respecting UTF-8)
export const truncateSafe = (str: string, maxLength: number, suffix = '...'): string => {
  if (str.length <= maxLength) return str;
  
  const truncated = str.slice(0, maxLength - suffix.length);
  // Don't cut in the middle of a surrogate pair
  if (truncated.charCodeAt(truncated.length - 1) >= 0xD800 && 
      truncated.charCodeAt(truncated.length - 1) <= 0xDBFF) {
    return truncated.slice(0, -1) + suffix;
  }
  return truncated + suffix;
};

// Normalize whitespace
export const normalizeWhitespace = (str: string): string => {
  return str
    .replace(/\s+/g, ' ')
    .replace(/[\r\n]+/g, '\n')
    .trim();
};

// Remove invisible characters
export const removeInvisibleChars = (str: string): string => {
  // Remove zero-width characters and other invisible Unicode
  return str.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060\u180E]/g, '');
};

// Sanitize for logging (remove sensitive data patterns)
export const sanitizeForLogging = (data: unknown): unknown => {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /authorization/i,
    /credit[_-]?card/i,
    /ssn/i,
    /social[_-]?security/i
  ];
  
  if (typeof data === 'string') {
    return data;
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));
      sanitized[key] = isSensitive ? '[REDACTED]' : sanitizeForLogging(value);
    }
    
    return sanitized;
  }
  
  return data;
};

// Create a safe excerpt from HTML content
export const createSafeExcerpt = (html: string, maxLength: number = 200): string => {
  const stripped = stripHtml(html);
  const normalized = normalizeWhitespace(stripped);
  return truncateSafe(normalized, maxLength);
};
