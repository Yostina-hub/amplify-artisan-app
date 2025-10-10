import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// 1x1 transparent pixel
const PIXEL = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));

serve(async (req: Request) => {
  const url = new URL(req.url);
  const trackingId = url.pathname.split('/').pop();

  if (!trackingId) {
    return new Response(PIXEL, {
      headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-cache' }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update tracking record
    const { data: existing } = await supabase
      .from('email_tracking')
      .select('opened_at, open_count')
      .eq('id', trackingId)
      .single();

    if (existing) {
      await supabase
        .from('email_tracking')
        .update({
          opened_at: existing.opened_at || new Date().toISOString(),
          open_count: (existing.open_count || 0) + 1,
        })
        .eq('id', trackingId);

      // Update campaign stats
      if (!existing.opened_at) {
        const { data: tracking } = await supabase
          .from('email_tracking')
          .select('campaign_id')
          .eq('id', trackingId)
          .single();

        if (tracking) {
          const { data: campaign } = await supabase
            .from('email_campaigns')
            .select('opened_count')
            .eq('id', tracking.campaign_id)
            .single();

          if (campaign) {
            await supabase
              .from('email_campaigns')
              .update({ opened_count: (campaign.opened_count || 0) + 1 })
              .eq('id', tracking.campaign_id);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error tracking email open:', error);
  }

  return new Response(PIXEL, {
    headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-cache' }
  });
});