import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SocialService {
  private supabase;

  constructor(
    @InjectQueue('social-posts') private socialQueue: Queue,
  ) {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  async getPosts(companyId: string, filters?: any) {
    let query = this.supabase
      .from('social_posts')
      .select('*')
      .eq('company_id', companyId);

    if (filters?.platform) {
      query = query.eq('platform', filters.platform);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createPost(postData: any) {
    const { data, error } = await this.supabase
      .from('social_posts')
      .insert(postData)
      .select()
      .single();

    if (error) throw error;

    if (postData.scheduled_for) {
      const scheduledDate = new Date(postData.scheduled_for);
      const delay = scheduledDate.getTime() - Date.now();

      if (delay > 0) {
        await this.socialQueue.add(
          'publish-post',
          { postId: data.id },
          { delay },
        );
      }
    }

    return data;
  }

  async publishPost(postId: string) {
    const { data: post, error } = await this.supabase
      .from('social_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;

    const { error: updateError } = await this.supabase
      .from('social_posts')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', postId);

    if (updateError) throw updateError;

    return { message: 'Post published successfully' };
  }

  async getMetrics(companyId: string, platform?: string) {
    let query = this.supabase
      .from('social_metrics')
      .select('*')
      .eq('company_id', companyId);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw error;
    return data;
  }

  async syncMetrics(companyId: string, platform: string) {
    await this.socialQueue.add('sync-metrics', { companyId, platform });
    return { message: 'Metrics sync initiated' };
  }
}
