import TelegramBot from "node-telegram-bot-api";
import { config } from "./src/config";
import { log } from "./src/utils";
import { registerCommands } from "./src/commands";
import { registerMessageHandler } from "./src/handlers";
import { initNotificationService, notifyError } from "./src/services";

const bot = new TelegramBot(config.telegramBotToken, { polling: true });

// Initialize notification service for admin alerts
initNotificationService(bot);

// Register commands and handlers
registerCommands(bot);
registerMessageHandler(bot);

log("info", "Alfred bot is running...");

// Global error handlers for unhandled errors
process.on("uncaughtException", async (error) => {
  log("error", "Uncaught exception", {
    error: { message: error.message, stack: error.stack },
  });
  await notifyError(`Uncaught exception: ${error.message}`);
});

process.on("unhandledRejection", async (reason, promise) => {
  const errorMessage =
    reason instanceof Error ? reason.message : String(reason);
  log("error", "Unhandled rejection", {
    reason: errorMessage,
  });
  await notifyError(`Unhandled promise rejection: ${errorMessage}`);
});

// Handle bot polling errors
bot.on("polling_error", async (error) => {
  log("error", "Telegram polling error", {
    error: { message: error.message, stack: error.stack },
  });
  await notifyError(`Telegram polling error: ${error.message}`);
});

async function gracefulShutdown(signal: string) {
  log("info", `Received ${signal}. Shutting down gracefully...`);
  await bot.stopPolling();
  log("info", "Bot stopped. Goodbye!");
  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
