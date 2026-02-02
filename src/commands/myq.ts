import type TelegramBot from "node-telegram-bot-api";
import { log, isUserAuthorized } from "../utils";
import { queryAgentStream, saveSessionId } from "../services";

export const myqCommand = {
  command: "myq",
  description: "Control myQ garage door",
  handler: (bot: TelegramBot) => {
    bot.onText(/\/myq(?:\s+(.+))?/, async (msg, match) => {
      // Check if user is authorized - silently ignore unauthorized users
      if (!isUserAuthorized(msg.from?.id)) {
        return;
      }

      const chatId = msg.chat.id;
      const messageId = msg.message_id;
      const args = match?.[1]?.trim();

      log("info", "Command received", {
        command: "/myq",
        chatId,
        messageId,
        args,
      });

      if (!args) {
        await bot.sendMessage(
          chatId,
          "Usage: /myq <command>\n\nExamples:\n- /myq list devices\n- /myq open garage\n- /myq close garage\n- /myq status",
          { reply_to_message_id: messageId }
        );
        return;
      }

      // Start typing indicator
      await bot.sendChatAction(chatId, "typing");
      const typingInterval = setInterval(() => {
        bot.sendChatAction(chatId, "typing").catch(() => {});
      }, 4000);

      try {
        const prompt = `Use the myQ CLI tool to: ${args}`;
        let lastSessionId = "";
        let responseText = "";

        for await (const agentMsg of queryAgentStream(prompt)) {
          lastSessionId = agentMsg.sessionId;
          responseText = agentMsg.text;
        }

        clearInterval(typingInterval);

        const sentMsg = await bot.sendMessage(
          chatId,
          responseText || "No response from myQ.",
          { reply_to_message_id: messageId }
        );

        if (lastSessionId) {
          saveSessionId(sentMsg.message_id, lastSessionId);
        }
      } catch (error) {
        clearInterval(typingInterval);

        log("error", "myQ command error", {
          chatId,
          messageId,
          error:
            error instanceof Error
              ? { message: error.message, stack: error.stack }
              : String(error),
        });

        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        await bot.sendMessage(chatId, `Error: ${errorMessage}`, {
          reply_to_message_id: messageId,
        });
      }
    });
  },
};
