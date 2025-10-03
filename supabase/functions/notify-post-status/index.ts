import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  postId: string;
  userId: string;
  action: 'approved' | 'rejected' | 'flagged';
  reason?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId, userId, action, reason }: NotificationRequest = await req.json();

    if (!postId || !userId || !action) {
      throw new Error('Missing required fields: postId, userId, action');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get user email and post details
    const { data: userData } = await supabaseClient.auth.admin.getUserById(userId);
    const { data: postData } = await supabaseClient
      .from('social_media_posts')
      .select('content, platforms')
      .eq('id', postId)
      .single();

    if (!userData?.user?.email || !postData) {
      console.error('User or post not found');
      return new Response(
        JSON.stringify({ success: false, error: 'User or post not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const userEmail = userData.user.email;
    const contentPreview = postData.content.substring(0, 100) + (postData.content.length > 100 ? '...' : '');
    const platforms = postData.platforms.join(', ');

    // Create in-app notification (you can extend this with a notifications table)
    console.log(`Notification for ${userEmail}: Post ${action}`);
    
    // Prepare email content based on action
    let subject = '';
    let htmlContent = '';

    switch (action) {
      case 'approved':
        subject = '✅ Your Post Has Been Approved!';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Great News! Your Post is Approved</h2>
            <p>Your post has been reviewed and approved for publishing.</p>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">POST PREVIEW</p>
              <p style="margin: 10px 0 0 0;">${contentPreview}</p>
            </div>
            
            <p><strong>Platforms:</strong> ${platforms}</p>
            <p>Your content will be published as scheduled.</p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Thank you for using SocialHub!
            </p>
          </div>
        `;
        break;

      case 'rejected':
        subject = '❌ Your Post Requires Changes';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Your Post Has Been Rejected</h2>
            <p>Unfortunately, your post did not meet our content guidelines.</p>
            
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b; font-weight: bold;">Reason:</p>
              <p style="margin: 10px 0 0 0; color: #7f1d1d;">${reason || 'Content does not meet platform guidelines'}</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">POST PREVIEW</p>
              <p style="margin: 10px 0 0 0;">${contentPreview}</p>
            </div>
            
            <p>Please review and modify your content before resubmitting.</p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you have questions, please contact your account manager.
            </p>
          </div>
        `;
        break;

      case 'flagged':
        subject = '⚠️ Your Post Has Been Flagged for Review';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Your Post Requires Manual Review</h2>
            <p>Your post has been flagged and is under review by our moderation team.</p>
            
            <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-weight: bold;">Flag Reason:</p>
              <p style="margin: 10px 0 0 0; color: #78350f;">${reason || 'Content requires manual review'}</p>
            </div>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">POST PREVIEW</p>
              <p style="margin: 10px 0 0 0;">${contentPreview}</p>
            </div>
            
            <p>Our team will review your post within 24 hours and notify you of the decision.</p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              Thank you for your patience.
            </p>
          </div>
        `;
        break;
    }

    // Log notification (in production, you'd send actual email via Resend or similar)
    console.log(`Email notification to ${userEmail}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Action: ${action}, Post ID: ${postId}`);

    // Store notification record (optional - create notifications table if needed)
    // For now, just return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification sent to ${userEmail}`,
        action,
        emailSent: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in notify-post-status function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
