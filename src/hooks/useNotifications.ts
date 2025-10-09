import { createNotification, CreateNotificationParams, NotificationTemplates } from "@/lib/notifications";
import { useAuth } from "./useAuth";

/**
 * Hook for sending notifications
 * Use this throughout your application to send notifications to users
 */
export function useNotifications() {
  const { session } = useAuth();

  const sendNotification = async (params: Omit<CreateNotificationParams, "userId">) => {
    if (!session?.user?.id) return { success: false, error: "No user session" };
    
    return await createNotification({
      ...params,
      userId: session.user.id,
    });
  };

  const sendWelcomeNotification = async () => {
    if (!session?.user?.id) return;
    return await createNotification(NotificationTemplates.welcome(session.user.id));
  };

  const sendLeadAssignedNotification = async (leadName: string) => {
    if (!session?.user?.id) return;
    return await createNotification(
      NotificationTemplates.leadAssigned(session.user.id, leadName)
    );
  };

  const sendTaskDueNotification = async (taskName: string) => {
    if (!session?.user?.id) return;
    return await createNotification(
      NotificationTemplates.taskDue(session.user.id, taskName)
    );
  };

  const sendEventCreatedNotification = async (eventTitle: string) => {
    if (!session?.user?.id) return;
    return await createNotification(
      NotificationTemplates.eventCreated(session.user.id, eventTitle)
    );
  };

  const sendPaymentReceivedNotification = async (amount: string) => {
    if (!session?.user?.id) return;
    return await createNotification(
      NotificationTemplates.paymentReceived(session.user.id, amount)
    );
  };

  return {
    sendNotification,
    sendWelcomeNotification,
    sendLeadAssignedNotification,
    sendTaskDueNotification,
    sendEventCreatedNotification,
    sendPaymentReceivedNotification,
  };
}