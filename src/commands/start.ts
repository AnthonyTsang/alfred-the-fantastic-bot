import type TelegramBot from "node-telegram-bot-api";
import { log } from "../utils";

export const startCommand = {
  command: "start",
  description: "Start interacting with the bot",
  handler: (bot: TelegramBot) => {
    bot.onText(/\/start/, (msg) => {
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
