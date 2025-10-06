import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class CompaniesService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*, industries(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*, industries(name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(createData: any) {
    const { data, error } = await this.supabase
      .from('companies')
      .insert(createData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updateData: any) {
    const { data, error } = await this.supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('companies')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) throw error;
    return { message: 'Company deactivated successfully' };
  }
}
