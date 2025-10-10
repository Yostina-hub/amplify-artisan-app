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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking for scheduled posts to publish...');

    // Get all scheduled posts that are ready to publish
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${scheduledPosts?.length || 0} posts ready to publish`);

    const results = [];

    for (const post of scheduledPosts || []) {
      try {
        console.log(`Publishing post ${post.id} to platforms:`, post.platforms);

        // Get platform credentials for this company
        const platforms = post.platforms || [];
        const publishResults = [];

        for (const platform of platforms) {
          try {
            if (platform === 'telegram') {
              const { error } = await supabase.functions.invoke('post-to-telegram', {
                body: { 
                  postId: post.id,
                  companyId: post.company_id
                }
              });
              if (error) throw error;
              publishResults.push({ platform, success: true });
            } else {
              // Use publish-to-platform for other platforms
              const { error } = await supabase.functions.invoke('publish-to-platform', {
                body: { 
                  contentId: post.id,
                  platforms: [platform]
                }
              });
              if (error) throw error;
              publishResults.push({ platform, success: true });
            }
          } catch (platformError) {
            console.error(`Error publishing to ${platform}:`, platformError);
            publishResults.push({ 
              platform, 
              success: false, 
              error: platformError instanceof Error ? platformError.message : 'Unknown error' 
            });
          }
        }

        // Update post status
        const allSuccessful = publishResults.every(r => r.success);
        const { error: updateError } = await supabase
          .from('social_media_posts')
          .update({
            status: allSuccessful ? 'published' : 'failed',
            published_at: allSuccessful ? new Date().toISOString() : null,
            metadata: {
              ...post.metadata,
              publish_results: publishResults,
              published_by_scheduler: true
            }
          })
          .eq('id', post.id);

        if (updateError) throw updateError;

        results.push({
          postId: post.id,
          status: allSuccessful ? 'published' : 'failed',
          platforms: publishResults
        });

      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
        results.push({
          postId: post.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in publish-scheduled-posts:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
