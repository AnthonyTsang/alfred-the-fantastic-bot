import type TelegramBot from "node-telegram-bot-api";
import { log, isUserAuthorized } from "../utils";

export const startCommand = {
  command: "start",
  description: "Start interacting with the bot",
  handler: (bot: TelegramBot) => {
    bot.onText(/\/start/, (msg) => {
      // Check if user is authorized - silently ignore unauthorized users
      if (!isUserAuthorized(msg.from?.id)) {
        return;
      }

      const chatId = msg.chat.id;
      log("info", "Command received", {
        command: "/start",
        chatId,
        messageId: msg.message_id,
      });
      bot.sendMessage(chatId, "Yo, I am Alfred the fantastic bot.");
    });
  },
};
