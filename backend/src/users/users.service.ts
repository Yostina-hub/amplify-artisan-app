import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class UsersService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  async findAll(companyId?: string, branchId?: string) {
    let query = this.supabase
      .from('users')
      .select('*, companies(name), branches(name)');

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*, companies(name), branches(name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updateData: any) {
    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from('users')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) throw error;
    return { message: 'User deactivated successfully' };
  }
}
