import { supabase } from "@/integrations/supabase/client";

export interface CreateNotificationParams {
  userId: string;
  companyId?: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification for a specific user
 * This can be called from anywhere in the system to send notifications
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: params.userId,
        company_id: params.companyId,
        title: params.title,
        message: params.message,
        type: params.type,
        action_url: params.actionUrl,
        action_label: params.actionLabel,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationParams, "userId">
) {
  try {
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      company_id: notification.companyId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      action_url: notification.actionUrl,
      action_label: notification.actionLabel,
      metadata: notification.metadata || {},
    }));

    const { data, error } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return { success: false, error };
  }
}

/**
 * Notify all users in a company
 */
export async function notifyCompany(
  companyId: string,
  notification: Omit<CreateNotificationParams, "userId" | "companyId">
) {
  try {
    // Get all users in the company
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .eq("company_id", companyId);

    if (profilesError) throw profilesError;

    const userIds = profiles?.map((p) => p.id) || [];
    
    if (userIds.length === 0) return { success: true, data: [] };

    return await createBulkNotifications(userIds, {
      ...notification,
      companyId,
    });
  } catch (error) {
    console.error("Error notifying company:", error);
    return { success: false, error };
  }
}

  /**
   * System notification templates for common events
   */
  export const NotificationTemplates = {
    welcome: (userId: string): CreateNotificationParams => ({
      userId,
      title: "Welcome to the Platform!",
      message: "Explore all the cutting-edge features available to you.",
      type: "info",
      actionUrl: "/layout-showcase",
      actionLabel: "Take a Tour",
    }),

    leadAssigned: (userId: string, leadName: string): CreateNotificationParams => ({
      userId,
      title: "New Lead Assigned",
      message: `You have been assigned a new lead: ${leadName}`,
      type: "success",
      actionUrl: "/leads",
      actionLabel: "View Lead",
    }),

    taskDue: (userId: string, taskName: string): CreateNotificationParams => ({
      userId,
      title: "Task Due Soon",
      message: `Task "${taskName}" is due within 24 hours`,
      type: "warning",
      actionUrl: "/activities",
      actionLabel: "View Tasks",
    }),

    eventCreated: (userId: string, eventTitle: string): CreateNotificationParams => ({
      userId,
      title: "Event Created",
      message: `New event "${eventTitle}" has been added to your calendar`,
      type: "success",
      actionUrl: "/calendar",
      actionLabel: "View Calendar",
    }),

    paymentReceived: (userId: string, amount: string): CreateNotificationParams => ({
      userId,
      title: "Payment Received",
      message: `Payment of ${amount} has been successfully processed`,
      type: "success",
      actionUrl: "/payments",
      actionLabel: "View Payments",
    }),

    systemMaintenance: (userId: string, scheduledTime: string): CreateNotificationParams => ({
      userId,
      title: "Scheduled Maintenance",
      message: `System maintenance scheduled for ${scheduledTime}`,
      type: "warning",
    }),

    contentFlagged: (userId: string, reason: string, severity: string): CreateNotificationParams => ({
      userId,
      title: "Content Flagged by AI",
      message: `Your post has been flagged for review. Reason: ${reason} (Severity: ${severity})`,
      type: "warning",
      actionUrl: "/composer",
      actionLabel: "View Post",
    }),
  };