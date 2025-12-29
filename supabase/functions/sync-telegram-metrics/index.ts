import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramMessage {
  message_id: number;
  views?: number;
  forwards?: number;
  reactions?: {
    results: Array<{
      type: { emoji: string };
      count: number;
    }>;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(
        JSON.stringify({ error: 'User has no company' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const companyId = profile.company_id;
    console.log('Syncing Telegram metrics for company:', companyId);

    // Get all active Telegram tokens for this company
    const { data: tokens, error: tokenError } = await supabase
      .from('social_platform_tokens')
      .select('*')
      .eq('company_id', companyId)
      .eq('platform', 'telegram')
      .eq('is_active', true);

    if (tokenError) {
      console.error('Error fetching tokens:', tokenError);
      throw new Error('Failed to fetch Telegram connections');
    }

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No active Telegram connections found', synced: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get posts that have been published to Telegram
    const { data: posts, error: postsError } = await supabase
      .from('social_media_posts')
      .select('id, platform_post_ids, views, likes, shares')
      .eq('company_id', companyId)
      .eq('status', 'published')
      .contains('platforms', ['telegram']);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      throw new Error('Failed to fetch posts');
    }

    // Filter posts that have telegram message ID stored
    const telegramPosts = (posts || []).filter(p => {
      const platformIds = p.platform_post_ids as Record<string, any> | null;
      return platformIds?.telegram?.message_id;
    });

    console.log(`Found ${telegramPosts.length} published Telegram posts with message IDs to sync`);

    let syncedCount = 0;
    const metricsResults: any[] = [];

    for (const token of tokens) {
      const botToken = token.access_token;
      const channelId = token.metadata?.channel_id || token.account_id;

      if (!botToken || !channelId) {
        console.log('Skipping token without bot token or channel ID');
        continue;
      }

      // For each post, try to get message info
      for (const post of telegramPosts) {
        const platformIds = post.platform_post_ids as Record<string, any>;
        const telegramMessageId = platformIds?.telegram?.message_id;
        const telegramChatId = platformIds?.telegram?.chat_id || channelId;

        if (!telegramMessageId) continue;

        try {
          // Use getChatMember to verify bot has access, then use getChat for channel info
          // For message-specific metrics, we need to use forwardMessage trick or rely on webhook updates
          
          // Get channel/chat info for general stats
          const chatInfoUrl = `https://api.telegram.org/bot${botToken}/getChat`;
          const chatResponse = await fetch(chatInfoUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: telegramChatId }),
          });
          const chatResult = await chatResponse.json();

          if (chatResult.ok) {
            console.log('Chat info:', chatResult.result.title || chatResult.result.id);
          }

          // Try to get message reactions (available for channels with reactions enabled)
          // This uses getMessageReactionCount API (Telegram Bot API 7.0+)
          const reactionsUrl = `https://api.telegram.org/bot${botToken}/getMessageReactionCount`;
          const reactionsResponse = await fetch(reactionsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              chat_id: telegramChatId,
              message_id: telegramMessageId 
            }),
          });
          const reactionsResult = await reactionsResponse.json();

          let totalReactions = 0;
          let reactionDetails: Record<string, number> = {};

          if (reactionsResult.ok && reactionsResult.result?.reactions) {
            for (const reaction of reactionsResult.result.reactions) {
              const emoji = reaction.type?.emoji || reaction.type?.custom_emoji_id || 'unknown';
              const count = reaction.total_count || 0;
              reactionDetails[emoji] = count;
              totalReactions += count;
            }
            console.log(`Post ${post.id} has ${totalReactions} reactions:`, reactionDetails);
          }

          // For views, Telegram Bot API doesn't directly expose view counts
          // Views are only available in MTProto API, not Bot API
          // We can estimate engagement from reactions + replies
          
          // Check for replies/comments by looking at the linked discussion group
          // This is complex and requires additional API calls

          // Update post with available metrics
          const updateData: any = {
            likes: totalReactions, // Using likes field for reactions
            platform_post_ids: {
              ...platformIds,
              telegram: {
                ...platformIds.telegram,
                reactions: reactionDetails,
                total_reactions: totalReactions,
                metrics_synced_at: new Date().toISOString(),
              }
            },
            metrics_last_synced_at: new Date().toISOString(),
          };

          const { error: updateError } = await supabase
            .from('social_media_posts')
            .update(updateData)
            .eq('id', post.id);

          if (updateError) {
            console.error('Error updating post metrics:', updateError);
          } else {
            syncedCount++;
            metricsResults.push({
              postId: post.id,
              messageId: telegramMessageId,
              reactions: totalReactions,
              reactionDetails,
            });
          }

        } catch (err) {
          console.error('Error fetching metrics for message', telegramMessageId, ':', err);
        }
      }

      // Also sync incoming message metrics from social_conversations
      // Get reaction counts for incoming Telegram messages
      const { data: conversations, error: convError } = await supabase
        .from('social_conversations')
        .select('id, metadata')
        .eq('company_id', companyId)
        .eq('platform', 'telegram')
        .not('metadata->message_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!convError && conversations) {
        console.log(`Found ${conversations.length} Telegram conversations to check`);
      }
    }

    // Get updated chat stats
    const { data: chatStats } = await supabase
      .from('social_conversations')
      .select('id')
      .eq('company_id', companyId)
      .eq('platform', 'telegram');

    const totalMessages = chatStats?.length || 0;

    console.log(`Synced metrics for ${syncedCount} posts`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced: syncedCount,
        totalMessages,
        metrics: metricsResults,
        message: `Synced ${syncedCount} posts with ${metricsResults.reduce((sum, m) => sum + m.reactions, 0)} total reactions`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in sync-telegram-metrics:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
