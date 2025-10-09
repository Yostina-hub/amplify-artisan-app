import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SocialPostsService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    );
  }

  async create(userId: string, createDto: any) {
    const { data, error } = await this.supabase
      .from('social_media_posts')
      .insert([
        {
          user_id: userId,
          content: createDto.content,
          platforms: createDto.platforms || [],
          scheduled_for: createDto.scheduled_for || null,
          status: createDto.scheduled_for ? 'scheduled' : 'published',
          media_urls: createDto.media_urls || [],
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(userId: string, filters?: any) {
    let query = this.supabase
      .from('social_media_posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.platform) {
      query = query.contains('platforms', [filters.platform]);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('social_media_posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, userId: string, updateDto: any) {
    const { data, error } = await this.supabase
      .from('social_media_posts')
      .update(updateDto)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string, userId: string) {
    const { error } = await this.supabase
      .from('social_media_posts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return { message: 'Post deleted successfully' };
  }

  async getScheduledPosts() {
    const { data, error } = await this.supabase
      .from('social_media_posts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString());

    if (error) throw error;
    return data;
  }

  async updateStatus(id: string, status: string, platformPostIds?: any, errorMessage?: string) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    if (platformPostIds) {
      updateData.platform_post_ids = platformPostIds;
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    const { data, error } = await this.supabase
      .from('social_media_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
