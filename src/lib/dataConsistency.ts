import { supabase } from "@/integrations/supabase/client";

/**
 * Data Consistency Utilities
 * 
 * These utilities help maintain data integrity across the CRM system by:
 * 1. Checking for duplicate records before creation
 * 2. Validating relationships between entities
 * 3. Ensuring data consistency across modules
 */

export interface DuplicateCheckResult {
  exists: boolean;
  record?: any;
  message?: string;
}

/**
 * Check if a contact with the given email already exists
 */
export async function checkContactDuplicate(
  email: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  if (!email) return { exists: false };

  let query = supabase
    .from("contacts")
    .select("id, first_name, last_name, email")
    .eq("email", email);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;

  if (data) {
    return {
      exists: true,
      record: data,
      message: `Contact with email ${email} already exists: ${data.first_name} ${data.last_name}`,
    };
  }

  return { exists: false };
}

/**
 * Check if a lead with the given email already exists (and is not converted)
 */
export async function checkLeadDuplicate(
  email: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  if (!email) return { exists: false };

  let query = supabase
    .from("leads")
    .select("id, first_name, last_name, email, converted")
    .eq("email", email)
    .eq("converted", false);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;

  if (data) {
    return {
      exists: true,
      record: data,
      message: `Active lead with email ${email} already exists: ${data.first_name} ${data.last_name}`,
    };
  }

  return { exists: false };
}

/**
 * Check if an account with similar name or email already exists
 */
export async function checkAccountDuplicate(
  name: string,
  email?: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  // Check by name
  let nameQuery = supabase
    .from("accounts")
    .select("id, name, email")
    .ilike("name", name);

  if (excludeId) {
    nameQuery = nameQuery.neq("id", excludeId);
  }

  const { data: nameMatch, error: nameError } = await nameQuery.maybeSingle();

  if (nameError) throw nameError;

  if (nameMatch) {
    return {
      exists: true,
      record: nameMatch,
      message: `Account with similar name already exists: ${nameMatch.name}`,
    };
  }

  // Check by email if provided
  if (email) {
    let emailQuery = supabase
      .from("accounts")
      .select("id, name, email")
      .eq("email", email);

    if (excludeId) {
      emailQuery = emailQuery.neq("id", excludeId);
    }

    const { data: emailMatch, error: emailError } = await emailQuery.maybeSingle();

    if (emailError) throw emailError;

    if (emailMatch) {
      return {
        exists: true,
        record: emailMatch,
        message: `Account with email ${email} already exists: ${emailMatch.name}`,
      };
    }
  }

  return { exists: false };
}

/**
 * Validate that an account exists
 */
export async function validateAccountExists(
  accountId: string
): Promise<{ exists: boolean; account?: any }> {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name")
    .eq("id", accountId)
    .maybeSingle();

  if (error) throw error;

  return {
    exists: !!data,
    account: data,
  };
}

/**
 * Validate that a contact exists
 */
export async function validateContactExists(
  contactId: string
): Promise<{ exists: boolean; contact?: any }> {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email")
    .eq("id", contactId)
    .maybeSingle();

  if (error) throw error;

  return {
    exists: !!data,
    contact: data,
  };
}

/**
 * Validate that a lead exists
 */
export async function validateLeadExists(
  leadId: string
): Promise<{ exists: boolean; lead?: any }> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email")
    .eq("id", leadId)
    .maybeSingle();

  if (error) throw error;

  return {
    exists: !!data,
    lead: data,
  };
}

/**
 * Get accessible branch IDs for the current user
 */
export async function getUserAccessibleBranchIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_user_accessible_branches", {
    _user_id: userId,
  });

  if (error) throw error;

  return data?.map((b: any) => b.branch_id) || [];
}

/**
 * Check if user can access a specific branch
 */
export async function canUserAccessBranch(
  userId: string,
  branchId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc("can_access_branch", {
    _user_id: userId,
    _branch_id: branchId,
  });

  if (error) {
    console.error("Error checking branch access:", error);
    return false;
  }

  return data || false;
}
