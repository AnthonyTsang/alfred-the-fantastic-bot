import type TelegramBot from "node-telegram-bot-api";
import { log } from "../utils";
import { getUsageSummary } from "../services/usage";

export const statusCommand = {
  command: "status",
  description: "Show bot status, uptime, and API usage",
  handler: (bot: TelegramBot) => {
    bot.onText(/\/status/, (msg) => {
      const chatId = msg.chat.id;
      log("info", "Command received", {
        command: "/status",
        chatId,
        messageId: msg.message_id,
      });

      const summary = getUsageSummary();
      bot.sendMessage(chatId, `\`\`\`\n${summary}\n\`\`\``, {
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id,
      });
    });
  },
};
