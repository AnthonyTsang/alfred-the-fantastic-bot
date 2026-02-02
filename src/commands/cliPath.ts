import type TelegramBot from "node-telegram-bot-api";
import { log, isUserAuthorized } from "../utils";
import { config } from "../config";

export const cliPathCommand = {
  command: "cli_path",
  description: "Get the path to Claude Code CLI",
  handler: (bot: TelegramBot) => {
    bot.onText(/\/cli_path/, (msg) => {
      // Check if user is authorized - silently ignore unauthorized users
      if (!isUserAuthorized(msg.from?.id)) {
        return;
      }

      const chatId = msg.chat.id;
      log("info", "Command received", {
        command: "/cli_path",
        chatId,
        messageId: msg.message_id,
      });
      bot.sendMessage(chatId, `Claude Code CLI path: ${config.claudeCodePath}`);
    });
  },
};
