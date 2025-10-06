import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AnalyticsService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  async getDashboardStats(companyId: string) {
    const [leads, contacts, deals, activities] = await Promise.all([
      this.supabase.from('leads').select('count').eq('company_id', companyId).single(),
      this.supabase.from('contacts').select('count').eq('company_id', companyId).single(),
      this.supabase.from('deals').select('count').eq('company_id', companyId).single(),
      this.supabase.from('activities').select('count').eq('company_id', companyId).single(),
    ]);

    return {
      leads: leads.data?.count || 0,
      contacts: contacts.data?.count || 0,
      deals: deals.data?.count || 0,
      activities: activities.data?.count || 0,
    };
  }

  async getRevenueAnalytics(companyId: string, dateRange?: any) {
    const { data, error } = await this.supabase
      .from('deals')
      .select('amount, closed_at, status')
      .eq('company_id', companyId)
      .eq('status', 'won');

    if (error) throw error;
    return data;
  }
}
