import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeoCheckRequest {
  ip_address?: string;
  company_id?: string;
  user_id?: string;
  request_path?: string;
}

interface GeoLocation {
  country_code: string;
  country_name: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: GeoCheckRequest = await req.json();
    
    // Get IP from request or body
    const clientIp = body.ip_address || 
                     req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     req.headers.get('cf-connecting-ip') ||
                     'unknown';
    
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Get geolocation from IP using free API
    let geoData: GeoLocation = {
      country_code: 'XX',
      country_name: 'Unknown'
    };

    try {
      // Using ip-api.com (free, no key required, 45 requests/minute)
      const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode,region,regionName,city,lat,lon`);
      const geoJson = await geoResponse.json();
      
      if (geoJson.status === 'success') {
        geoData = {
          country_code: geoJson.countryCode,
          country_name: geoJson.country,
          city: geoJson.city,
          region: geoJson.regionName,
          latitude: geoJson.lat,
          longitude: geoJson.lon
        };
      }
    } catch (geoError) {
      console.error('[GeoBlocking] Geolocation lookup failed:', geoError);
    }

    // Check geo access rules
    const { data: accessResult } = await supabase.rpc('check_geo_access', {
      p_country_code: geoData.country_code,
      p_company_id: body.company_id || null
    });

    const isAllowed = accessResult?.allowed !== false;
    const actionTaken = accessResult?.action || 'allowed';

    // Log the access attempt
    await supabase.from('geo_access_logs').insert({
      user_id: body.user_id || null,
      ip_address: clientIp,
      country_code: geoData.country_code,
      country_name: geoData.country_name,
      city: geoData.city,
      region: geoData.region,
      latitude: geoData.latitude,
      longitude: geoData.longitude,
      action_taken: actionTaken,
      rule_id: accessResult?.rule_id || null,
      user_agent: userAgent,
      request_path: body.request_path
    });

    if (!isAllowed) {
      return new Response(
        JSON.stringify({
          allowed: false,
          action: 'blocked',
          reason: accessResult?.reason || 'Access denied from your location',
          country: geoData.country_name,
          country_code: geoData.country_code
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        action: actionTaken,
        country: geoData.country_name,
        country_code: geoData.country_code,
        city: geoData.city,
        region: geoData.region,
        ...(actionTaken === 'challenge' && { challenge_required: true })
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[GeoBlocking] Error:', error);
    // Fail open - allow access if geo-blocking fails
    return new Response(
      JSON.stringify({ 
        allowed: true, 
        action: 'allowed',
        reason: 'Geo-blocking service unavailable' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
