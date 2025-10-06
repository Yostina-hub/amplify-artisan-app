import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { createClient } from '@supabase/supabase-js';

@Processor('social-posts')
export class SocialProcessor {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  @Process('publish-post')
  async handlePublishPost(job: Job) {
    const { postId } = job.data;

    const { data: post } = await this.supabase
      .from('social_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (!post) {
      throw new Error('Post not found');
    }

    await this.supabase
      .from('social_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', postId);

    console.log(`Published post ${postId} to ${post.platform}`);
    return { success: true };
  }

  @Process('sync-metrics')
  async handleSyncMetrics(job: Job) {
    const { companyId, platform } = job.data;

    console.log(`Syncing metrics for company ${companyId} on ${platform}`);
    return { success: true };
  }
}
