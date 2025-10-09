import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class CompaniesService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    );
  }

  async findAll(filters?: any) {
    let query = this.supabase
      .from('companies')
      .select('*, pricing_plans(name, slug, price, billing_period)')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.industry) {
      query = query.eq('industry', filters.industry);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*, pricing_plans(name, slug, price, billing_period, features)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*, pricing_plans(name, slug, price, billing_period)')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(createData: any) {
    const { data, error } = await this.supabase
      .from('companies')
      .insert({
        name: createData.name,
        email: createData.email,
        phone: createData.phone || null,
        website: createData.website || null,
        industry: createData.industry || null,
        company_size: createData.company_size || null,
        address: createData.address || null,
        pricing_plan_id: createData.pricing_plan_id || null,
        status: 'pending',
        is_active: false,
      })
      .select('*, pricing_plans(name, slug, price, billing_period)')
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updateData: any) {
    const { data, error } = await this.supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select('*, pricing_plans(name, slug, price, billing_period)')
      .single();

    if (error) throw error;
    return data;
  }

  async approve(id: string, adminUserId: string) {
    const { data, error } = await this.supabase
      .from('companies')
      .update({
        status: 'approved',
        is_active: true,
        approved_at: new Date().toISOString(),
        approved_by: adminUserId,
      })
      .eq('id', id)
      .select('*, pricing_plans(name, slug, price, billing_period)')
      .single();

    if (error) throw error;
    return data;
  }

  async reject(id: string, adminUserId: string) {
    const { data, error } = await this.supabase
      .from('companies')
      .update({
        status: 'rejected',
        is_active: false,
        approved_by: adminUserId,
      })
      .eq('id', id)
      .select('*, pricing_plans(name, slug, price, billing_period)')
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { message: 'Company deleted successfully' };
  }

  async getPendingApplications() {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*, pricing_plans(name, slug, price, billing_period)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getStats() {
    const [totalResult, activeResult, pendingResult] = await Promise.all([
      this.supabase.from('companies').select('id', { count: 'exact', head: true }),
      this.supabase.from('companies').select('id', { count: 'exact', head: true }).eq('is_active', true),
      this.supabase.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    return {
      total: totalResult.count || 0,
      active: activeResult.count || 0,
      pending: pendingResult.count || 0,
    };
  }
}
