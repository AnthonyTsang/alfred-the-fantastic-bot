import TelegramBot from "node-telegram-bot-api";
import { config } from "../config";
import { log } from "../utils";

/**
 * Notification service for sending admin alerts and error notifications.
 */
export class NotificationService {
  private bot: TelegramBot;

  constructor(bot: TelegramBot) {
    this.bot = bot;
  }

  /**
   * Send an error notification to the admin.
   * The message will start with "Error: " as per requirements.
   */
  async notifyError(message: string): Promise<void> {
    await this.send(`Error: ${message}`, "error");
  }

  /**
   * Send an alert notification to the admin.
   * The message will start with "Alert: " as per requirements.
   */
  async notifyAlert(message: string): Promise<void> {
    await this.send(`Alert: ${message}`, "alert");
  }

  private async send(
    fullMessage: string,
    type: "error" | "alert"
  ): Promise<void> {
    if (!config.adminChatId) {
      log("warn", `ADMIN_CHAT_ID not configured, skipping ${type} notification`, {
        message: fullMessage,
      });
      return;
    }

    try {
      await this.bot.sendMessage(config.adminChatId, fullMessage);
      log("info", `${type.charAt(0).toUpperCase() + type.slice(1)} notification sent to admin`, {
        message: fullMessage,
      });
    } catch (error) {
      log("error", `Failed to send ${type} notification to admin`, {
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : String(error),
        originalMessage: fullMessage,
      });
    }
  }
}

// Singleton instance
let notificationService: NotificationService | null = null;

/**
 * Initialize the notification service with a bot instance.
 * Must be called before using notification functions.
 */
export function initNotificationService(bot: TelegramBot): NotificationService {
  notificationService = new NotificationService(bot);
  return notificationService;
}

/**
 * Get the notification service instance.
 * Throws if not initialized.
 */
export function getNotificationService(): NotificationService {
  if (!notificationService) {
    throw new Error("Notification service not initialized. Call initNotificationService first.");
  }
  return notificationService;
}

// Convenience functions for backward compatibility
export async function notifyError(message: string): Promise<void> {
  if (!notificationService) {
    log("error", "Notification service not initialized");
    return;
  }
  await notificationService.notifyError(message);
}

export async function notifyAlert(message: string): Promise<void> {
  if (!notificationService) {
    log("error", "Notification service not initialized");
    return;
  }
  await notificationService.notifyAlert(message);
}
