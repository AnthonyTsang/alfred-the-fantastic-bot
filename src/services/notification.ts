import TelegramBot from "node-telegram-bot-api";
import { config } from "../config";
import { log } from "../utils";

let botInstance: TelegramBot | null = null;

/**
 * Initialize the notification service with a bot instance.
 * Must be called before using notification functions.
 */
export function initNotificationService(bot: TelegramBot): void {
  botInstance = bot;
}

/**
 * Send an error notification to the admin.
 * The message will start with "Error: " as per requirements.
 */
export async function notifyError(message: string): Promise<void> {
  if (!config.adminChatId) {
    log("warn", "ADMIN_CHAT_ID not configured, skipping error notification", {
      message,
    });
    return;
  }

  if (!botInstance) {
    log("error", "Notification service not initialized");
    return;
  }

  const fullMessage = `Error: ${message}`;

  try {
    await botInstance.sendMessage(config.adminChatId, fullMessage);
    log("info", "Error notification sent to admin", { message: fullMessage });
  } catch (error) {
    log("error", "Failed to send error notification to admin", {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : String(error),
      originalMessage: fullMessage,
    });
  }
}

/**
 * Send an alert notification to the admin.
 * The message will start with "Alert: " as per requirements.
 */
export async function notifyAlert(message: string): Promise<void> {
  if (!config.adminChatId) {
    log("warn", "ADMIN_CHAT_ID not configured, skipping alert notification", {
      message,
    });
    return;
  }

  if (!botInstance) {
    log("error", "Notification service not initialized");
    return;
  }

  const fullMessage = `Alert: ${message}`;

  try {
    await botInstance.sendMessage(config.adminChatId, fullMessage);
    log("info", "Alert notification sent to admin", { message: fullMessage });
  } catch (error) {
    log("error", "Failed to send alert notification to admin", {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : String(error),
      originalMessage: fullMessage,
    });
  }
}
