import { useEffect } from 'react';

interface SecurityHeadersConfig {
  enableCSP?: boolean;
  enableXSS?: boolean;
  enableFrameGuard?: boolean;
  enableContentTypeOptions?: boolean;
  reportUri?: string;
}

export const useSecurityHeaders = (config: SecurityHeadersConfig = {}) => {
  const {
    enableCSP = true,
    enableXSS = true,
    enableFrameGuard = true,
    enableContentTypeOptions = true,
  } = config;

  useEffect(() => {
    // These are client-side security measures
    // Note: True CSP headers must be set server-side, but we can add meta tags
    
    if (enableCSP) {
      addMetaTag('Content-Security-Policy', buildCSPDirectives());
    }

    if (enableXSS) {
      addMetaTag('X-XSS-Protection', '1; mode=block');
    }

    if (enableContentTypeOptions) {
      addMetaTag('X-Content-Type-Options', 'nosniff');
    }

    if (enableFrameGuard) {
      addMetaTag('X-Frame-Options', 'SAMEORIGIN');
    }

    // Referrer policy
    addMetaTag('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy
    addMetaTag('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    return () => {
      // Cleanup meta tags on unmount
      removeMetaTag('Content-Security-Policy');
      removeMetaTag('X-XSS-Protection');
      removeMetaTag('X-Content-Type-Options');
      removeMetaTag('X-Frame-Options');
      removeMetaTag('Referrer-Policy');
      removeMetaTag('Permissions-Policy');
    };
  }, [enableCSP, enableXSS, enableFrameGuard, enableContentTypeOptions]);

  const buildCSPDirectives = (): string => {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.ipify.org",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'"
    ];

    return directives.join('; ');
  };

  const addMetaTag = (name: string, content: string) => {
    let meta = document.querySelector(`meta[http-equiv="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('http-equiv', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  };

  const removeMetaTag = (name: string) => {
    const meta = document.querySelector(`meta[http-equiv="${name}"]`);
    if (meta) {
      meta.remove();
    }
  };

  const getSecurityHeaders = () => ({
    'Content-Security-Policy': buildCSPDirectives(),
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  });

  return { getSecurityHeaders };
};

// Content Security Policy builder for edge functions
export const buildEdgeFunctionCSP = (additionalSources?: {
  scripts?: string[];
  styles?: string[];
  images?: string[];
  connects?: string[];
}): string => {
  const defaults = {
    scripts: ["'self'"],
    styles: ["'self'", "'unsafe-inline'"],
    images: ["'self'", 'data:', 'https:'],
    connects: ["'self'"]
  };

  const merged = {
    scripts: [...defaults.scripts, ...(additionalSources?.scripts || [])],
    styles: [...defaults.styles, ...(additionalSources?.styles || [])],
    images: [...defaults.images, ...(additionalSources?.images || [])],
    connects: [...defaults.connects, ...(additionalSources?.connects || [])]
  };

  return [
    `default-src 'self'`,
    `script-src ${merged.scripts.join(' ')}`,
    `style-src ${merged.styles.join(' ')}`,
    `img-src ${merged.images.join(' ')}`,
    `connect-src ${merged.connects.join(' ')}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`
  ].join('; ');
};

export default useSecurityHeaders;
