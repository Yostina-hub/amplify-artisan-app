import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId } = await req.json().catch(() => ({ postId: null }));
    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'postId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth client bound to the caller token
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    // Admin client for privileged updates
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('approve-post: unauthorized', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure caller has admin role
    const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (adminErr) {
      console.warn('approve-post: is_admin RPC error', adminErr);
    }
    if (isAdmin === false) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load post
    const { data: post, error: fetchErr } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle();
    if (fetchErr) {
      console.error('approve-post: fetch post error', fetchErr);
      throw fetchErr;
    }
    if (!post) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nowIso = new Date().toISOString();
    const scheduledFor: string | null = post.scheduled_at || post.scheduled_for || null;
    const isScheduled = !!(scheduledFor && new Date(scheduledFor) > new Date());

    let updatePayload: Record<string, unknown> = {
      flagged: false,
      approved_at: nowIso,
    };

    const result: { scheduled: boolean; scheduledFor?: string | null; alreadyPublished: boolean } = {
      scheduled: false,
      alreadyPublished: false,
    };

    if (isScheduled) {
      updatePayload = { ...updatePayload, status: 'scheduled', scheduled_for: scheduledFor };
      result.scheduled = true;
      result.scheduledFor = scheduledFor;
    } else if (post.status === 'published') {
      // keep status as published, just mark approved
      result.alreadyPublished = true;
    } else {
      updatePayload = { ...updatePayload, status: 'published' };
    }

    const { error: updateErr } = await supabase
      .from('social_media_posts')
      .update(updatePayload)
      .eq('id', postId);

    if (updateErr) {
      console.error('approve-post: update error', updateErr);
      throw updateErr;
    }

    // If not scheduled and not already published, publish to platforms now
    if (!isScheduled && post.status !== 'published') {
      const platforms = post.platforms || [];
      console.log(`approve-post: Publishing to platforms:`, platforms);
      
      for (const platform of platforms) {
        try {
          if (platform === 'telegram') {
            const { error: telegramErr } = await supabase.functions.invoke('post-to-telegram', {
              body: { 
                postId: post.id,
                companyId: post.company_id
              }
            });
            if (telegramErr) {
              console.error(`approve-post: Telegram error:`, telegramErr);
            } else {
              console.log(`approve-post: Posted to Telegram successfully`);
            }
          }
          // Add other platforms here as needed
        } catch (platformErr) {
          console.error(`approve-post: Error posting to ${platform}:`, platformErr);
        }
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('approve-post: unexpected error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
