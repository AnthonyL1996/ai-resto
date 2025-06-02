import type { INotificationService } from '../types/service.types';
// You might use a library like react-toastify or Mantine's own notifications
// For this example, we'll just log to console and assume a UI layer handles the display

export class AppNotificationService implements INotificationService {
  showSuccess(message: string): void {
    console.log(`SUCCESS: ${message}`);
    // Here you would trigger the actual UI notification
    // e.g., using Mantine's notifications.show()
  }

  showError(message: string): void {
    console.error(`ERROR: ${message}`);
    // Trigger error UI notification
  }
}

export const notificationService = new AppNotificationService();