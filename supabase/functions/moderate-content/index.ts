import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const moderationRequestSchema = z.object({
  postId: z.string().uuid("Invalid post ID format").optional(),
  content: z.string()
    .min(1, "Content cannot be empty")
    .max(10000, "Content too long (max 10000 characters)"),
  platforms: z.array(z.string())
    .min(1, "At least one platform required")
    .max(10, "Too many platforms specified"),
});

interface ModerationRequest {
  postId?: string;
  content: string;
  platforms: string[];
}

interface ModerationResult {
  shouldFlag: boolean;
  flagReason: string | null;
  violations: string[];
  severity: 'low' | 'medium' | 'high' | 'none';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input
    const validationResult = moderationRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return new Response(
        JSON.stringify({ error: `Validation failed: ${errors}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { postId, content, platforms } = validationResult.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Moderating post ${postId}...`);

    const systemPrompt = `You are a content moderation AI. Analyze social media posts and identify policy violations.

Check for:
1. Hate speech, harassment, or violence
2. Spam or misleading claims (fake discounts, false promises)
3. Adult/inappropriate content
4. Scams or phishing attempts
5. Copyright violations or impersonation

Respond ONLY with valid JSON in this exact format:
{
  "shouldFlag": boolean,
  "flagReason": "specific reason or null",
  "violations": ["array", "of", "violation", "types"],
  "severity": "none" | "low" | "medium" | "high"
}`;

    const userPrompt = `Analyze this social media post for ${platforms.join(', ')}:

"${content}"

Provide your analysis in JSON format.`;

    // Use Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI moderation error:', aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits exhausted. Please add funds to continue.');
      }
      throw new Error(`AI moderation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No response from AI moderation');
    }

    console.log('AI moderation response:', aiContent);

    // Parse AI response
    let moderationResult: ModerationResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiContent.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, aiContent];
      const jsonStr = jsonMatch[1] || aiContent;
      moderationResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Default to safe - flag for manual review
      moderationResult = {
        shouldFlag: true,
        flagReason: 'AI analysis inconclusive - requires manual review',
        violations: ['parse_error'],
        severity: 'medium'
      };
    }

    // Update post in database if flagged
    if (moderationResult.shouldFlag && postId) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );

      const { error: updateError } = await supabaseClient
        .from('social_media_posts')
        .update({
          flagged: true,
          flag_reason: moderationResult.flagReason,
        })
        .eq('id', postId);

      if (updateError) {
        console.error('Failed to update post:', updateError);
      } else {
        console.log(`Post ${postId} flagged: ${moderationResult.flagReason}`);
        
        // Get post details to send notifications
        const { data: post, error: postError } = await supabaseClient
          .from('social_media_posts')
          .select('user_id, company_id')
          .eq('id', postId)
          .single();

        if (!postError && post) {
          // Notify post creator
          if (post.user_id) {
            await supabaseClient
              .from('notifications')
              .insert({
                user_id: post.user_id,
                company_id: post.company_id,
                title: 'Content Flagged by AI',
                message: `Your post has been flagged for review. Reason: ${moderationResult.flagReason} (Severity: ${moderationResult.severity})`,
                type: 'warning',
                action_url: '/composer',
                action_label: 'View Post',
                metadata: { 
                  postId, 
                  violations: moderationResult.violations,
                  severity: moderationResult.severity 
                }
              });
          }

          // Notify admins/supervisors
          const { data: adminUsers } = await supabaseClient
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin');

          if (adminUsers && adminUsers.length > 0) {
            const notifications = adminUsers.map(admin => ({
              user_id: admin.user_id,
              company_id: post.company_id,
              title: 'Content Flagged by AI',
              message: `A post has been flagged for review. Reason: ${moderationResult.flagReason} (Severity: ${moderationResult.severity})`,
              type: 'warning',
              action_url: '/admin/moderation',
              action_label: 'Review Content',
              metadata: { 
                postId, 
                violations: moderationResult.violations,
                severity: moderationResult.severity 
              }
            }));

            await supabaseClient
              .from('notifications')
              .insert(notifications);
          }
        }
      }
    }

    return new Response(
      JSON.stringify(moderationResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in moderate-content function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        shouldFlag: false,
        severity: 'none'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
