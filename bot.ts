import TelegramBot from "node-telegram-bot-api";
import { config } from "./src/config";
import { log } from "./src/utils";
import { registerCommands } from "./src/commands";
import { registerMessageHandler } from "./src/handlers";

const bot = new TelegramBot(config.telegramBotToken, { polling: true });

// Register commands and handlers
registerCommands(bot);
registerMessageHandler(bot);

log("info", "Alfred bot is running...");

async function gracefulShutdown(signal: string) {
  log("info", `Received ${signal}. Shutting down gracefully...`);
  await bot.stopPolling();
  log("info", "Bot stopped. Goodbye!");
  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
