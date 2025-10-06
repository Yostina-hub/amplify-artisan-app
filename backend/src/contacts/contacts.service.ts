import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class ContactsService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  async findAll(companyId: string) {
    const { data, error } = await this.supabase
      .from('contacts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(createData: any) {
    const { data, error } = await this.supabase
      .from('contacts')
      .insert(createData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updateData: any) {
    const { data, error } = await this.supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase.from('contacts').delete().eq('id', id);

    if (error) throw error;
    return { message: 'Contact deleted successfully' };
  }
}
