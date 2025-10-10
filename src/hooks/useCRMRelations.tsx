import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Fetch all related data for a contact
export function useContactRelations(contactId?: string) {
  return useQuery({
    queryKey: ["contact-relations", contactId],
    queryFn: async () => {
      if (!contactId) return null;

      const accounts = await supabase.from("accounts").select("*").eq("id", contactId).maybeSingle();
      const leads = await supabase.from("leads").select("*").eq("contact_id", contactId);
      const activities = await supabase.from("activities").select("*").eq("related_to_id", contactId).eq("related_to_type", "contact");
      const tickets = await supabase.from("support_tickets").select("*").eq("contact_id", contactId);
      const quotes = await supabase.from("quotes").select("*").eq("contact_id", contactId);

      return {
        account: accounts.data,
        leads: leads.data || [],
        activities: activities.data || [],
        tickets: tickets.data || [],
        quotes: quotes.data || [],
      };
    },
    enabled: !!contactId,
  });
}

// Fetch all related data for an account
export function useAccountRelations(accountId?: string) {
  return useQuery({
    queryKey: ["account-relations", accountId],
    queryFn: async () => {
      if (!accountId) return null;

      const contacts = await supabase.from("contacts").select("*").eq("account_id", accountId);
      const leads = await supabase.from("leads").select("*").eq("account_id", accountId);
      const opportunities = await supabase.from("opportunities").select("*").eq("account_id", accountId);
      const contracts = await supabase.from("contracts").select("*").eq("account_id", accountId);
      const projects = await supabase.from("projects").select("*").eq("account_id", accountId);
      const activities = await supabase.from("activities").select("*").eq("related_to_id", accountId).eq("related_to_type", "account");

      return {
        contacts: contacts.data || [],
        leads: leads.data || [],
        opportunities: opportunities.data || [],
        contracts: contracts.data || [],
        projects: projects.data || [],
        activities: activities.data || [],
      };
    },
    enabled: !!accountId,
  });
}

// Fetch all related data for a lead
export function useLeadRelations(leadId?: string) {
  return useQuery({
    queryKey: ["lead-relations", leadId],
    queryFn: async () => {
      if (!leadId) return null;

      const contact = await supabase.from("contacts").select("*").eq("id", leadId).maybeSingle();
      const account = await supabase.from("accounts").select("*").eq("id", leadId).maybeSingle();
      const activities = await supabase.from("activities").select("*").eq("related_to_id", leadId).eq("related_to_type", "lead");
      const callLogs = await supabase.from("call_logs").select("*").eq("lead_id", leadId);
      const opportunities = await supabase.from("opportunities").select("*").eq("lead_id", leadId);

      return {
        contact: contact.data,
        account: account.data,
        activities: activities.data || [],
        callLogs: callLogs.data || [],
        opportunities: opportunities.data || [],
      };
    },
    enabled: !!leadId,
  });
}

// Fetch all related data for an opportunity
export function useOpportunityRelations(opportunityId?: string) {
  return useQuery({
    queryKey: ["opportunity-relations", opportunityId],
    queryFn: async () => {
      if (!opportunityId) return null;

      const [account, contact, quotes, activities, contracts] = await Promise.all([
        supabase.from("accounts").select("*").eq("id", opportunityId).maybeSingle(),
        supabase.from("contacts").select("*").eq("id", opportunityId).maybeSingle(),
        supabase.from("quotes").select("*").eq("opportunity_id", opportunityId),
        supabase.from("activities").select("*").eq("related_to_id", opportunityId).eq("related_to_type", "opportunity"),
        supabase.from("contracts").select("*").eq("id", opportunityId).maybeSingle(),
      ]);

      return {
        account: account.data,
        contact: contact.data,
        quotes: quotes.data || [],
        activities: activities.data || [],
        contract: contracts.data,
      };
    },
    enabled: !!opportunityId,
  });
}

// Fetch customer 360 view
export function useCustomer360(customerId?: string, type: "contact" | "account" = "contact") {
  return useQuery({
    queryKey: ["customer-360", customerId, type],
    queryFn: async () => {
      if (!customerId) return null;

      const profile = type === "contact"
        ? await supabase.from("contacts").select("*, accounts(*)").eq("id", customerId).maybeSingle()
        : await supabase.from("accounts").select("*").eq("id", customerId).maybeSingle();
      const activities = await supabase.from("activities").select("*").eq("related_to_id", customerId);
      const opportunities = await supabase.from("opportunities").select("*").eq(type === "contact" ? "contact_id" : "account_id", customerId);
      const quotes = await supabase.from("quotes").select("*").eq(type === "contact" ? "contact_id" : "account_id", customerId);
      const tickets = await supabase.from("support_tickets").select("*").eq(type === "contact" ? "contact_id" : "account_id", customerId);
      const contracts = await supabase.from("contracts").select("*").eq("account_id", customerId);
      const projects = await supabase.from("projects").select("*").eq("account_id", customerId);
      const callLogs = await supabase.from("call_logs").select("*").eq("contact_id", customerId);
      const documents = await supabase.from("documents").select("*").eq("related_to_id", customerId);

      return {
        profile: profile.data,
        activities: activities.data || [],
        opportunities: opportunities.data || [],
        quotes: quotes.data || [],
        tickets: tickets.data || [],
        contracts: contracts.data || [],
        projects: projects.data || [],
        callLogs: callLogs.data || [],
        documents: documents.data || [],
      };
    },
    enabled: !!customerId,
  });
}
