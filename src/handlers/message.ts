import TelegramBot from "node-telegram-bot-api";
import { log, splitMessage, markdownToTelegram } from "../utils";
import {
  queryAgentStream,
  getSessionId,
  saveSessionId,
  transcribeAudio,
  type AgentMessageType,
  type ImageAttachment,
} from "../services";
import { config } from "../config";

export function registerMessageHandler(bot: TelegramBot) {
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const messageId = msg.message_id;

    let text: string | undefined;
    let isVoiceMessage = false;
    const images: ImageAttachment[] = [];

    // Handle photo messages
    if (msg.photo && msg.photo.length > 0) {
      try {
        // Get the largest photo (last in the array)
        const largestPhoto = msg.photo[msg.photo.length - 1];
        const fileLink = await bot.getFileLink(largestPhoto.file_id);

        // Download the image and convert to base64
        const response = await fetch(fileLink);
        const arrayBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        // Determine media type from the file extension
        const mediaType = fileLink.endsWith(".png")
          ? "image/png"
          : fileLink.endsWith(".gif")
            ? "image/gif"
            : fileLink.endsWith(".webp")
              ? "image/webp"
              : "image/jpeg";

        images.push({
          data: base64Data,
          mediaType,
        });

        log("info", "Photo received", {
          chatId,
          messageId,
          fileId: largestPhoto.file_id,
          width: largestPhoto.width,
          height: largestPhoto.height,
        });

        // Use caption as text if provided
        text = msg.caption || "What's in this image?";
      } catch (error) {
        log("error", "Error processing photo", {
          chatId,
          messageId,
          error:
            error instanceof Error
              ? { message: error.message, stack: error.stack }
              : String(error),
        });
        await bot.sendMessage(chatId, "Error processing the image.", {
          reply_to_message_id: messageId,
        });
        return;
      }
    }

    // Handle voice messages
    if (msg.voice) {
      isVoiceMessage = true;
      if (!config.assemblyAiApiKey) {
        await bot.sendMessage(
          chatId,
          "Voice messages are not supported. ASSEMBLYAI_API_KEY is not configured.",
          { reply_to_message_id: messageId }
        );
        return;
      }

      try {
        await bot.sendChatAction(chatId, "typing");

        // Get the voice file URL
        const fileId = msg.voice.file_id;
        const fileLink = await bot.getFileLink(fileId);

        log("info", "Voice message received", {
          chatId,
          messageId,
          fileId,
          duration: msg.voice.duration,
        });

        // Transcribe the audio
        text = await transcribeAudio(fileLink);

        if (!text) {
          await bot.sendMessage(
            chatId,
            "Could not transcribe the voice message.",
            { reply_to_message_id: messageId }
          );
          return;
        }

        log("info", "Voice message transcribed", {
          chatId,
          messageId,
          text,
        });
      } catch (error) {
        log("error", "Voice transcription error", {
          chatId,
          messageId,
          error:
            error instanceof Error
              ? { message: error.message, stack: error.stack }
              : String(error),
        });

        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        await bot.sendMessage(
          chatId,
          `Error transcribing voice message: ${errorMessage}`,
          { reply_to_message_id: messageId }
        );
        return;
      }
    } else if (msg.text) {
      // Skip commands
      if (msg.text.startsWith("/")) {
        return;
      }
      text = msg.text;
    } else if (!text) {
      // Ignore other message types (unless text was already set by photo handler)
      return;
    }

    // Check if replying to a message and get the session ID
    const replyToMessageId = msg.reply_to_message?.message_id;
    const existingSessionId = replyToMessageId
      ? getSessionId(replyToMessageId)
      : undefined;

    log("info", "Processing message", {
      chatId,
      messageId,
      text,
      replyToMessageId,
      existingSessionId,
      isVoice: isVoiceMessage,
    });

    // Start typing indicator
    await bot.sendChatAction(chatId, "typing");
    const typingInterval = setInterval(() => {
      bot.sendChatAction(chatId, "typing").catch(() => {});
    }, 4000);

    try {
      // Track current message state
      let currentBotMessageId: number | null = null;
      let leadingText = "";
      let lastMessageType: AgentMessageType | null = null;
      let lastSessionId = "";
      let replyToId = messageId;

      // For voice messages, prepend the transcription notice
      if (isVoiceMessage) {
        leadingText = `I think you are saying: ${text}\n\n`;
      }

      for await (const agentMsg of queryAgentStream(
        text,
        existingSessionId,
        images
      )) {
        lastSessionId = agentMsg.sessionId;

        const result = await reply(
          bot,
          chatId,
          leadingText + agentMsg.text,
          replyToId,
          currentBotMessageId
        );
        replyToId = result.lastMessageId;
        currentBotMessageId = result.lastMessageId;

        lastMessageType = agentMsg.type;
      }

      clearInterval(typingInterval);

      // Save session ID mapped to the last bot message
      if (lastSessionId && currentBotMessageId) {
        saveSessionId(currentBotMessageId, lastSessionId);
        log("info", "Response completed", {
          chatId,
          messageId,
          lastBotMessageId: currentBotMessageId,
          sessionId: lastSessionId,
        });
      }
    } catch (error) {
      clearInterval(typingInterval);

      log("error", "Agent SDK error", {
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
}

type ReplyResult = {
  lastMessageId: number;
};

async function reply(
  bot: TelegramBot,
  chatId: number,
  text: string,
  replyToId: number,
  editingMessageId: number | null
): Promise<ReplyResult> {
  // Convert markdown to Telegram MarkdownV2 format
  const formattedText = markdownToTelegram(text);
  const [firstChunk, ...chunks] = splitMessage(formattedText);
  let lastMessageId: number;

  if (editingMessageId === null) {
    // Send the first chunk as a new message
    const sentMsg = await bot.sendMessage(chatId, firstChunk, {
      reply_to_message_id: replyToId,
      parse_mode: "MarkdownV2",
    });
    lastMessageId = sentMsg.message_id;
  } else {
    // Edit the existing message
    try {
      await bot.editMessageText(firstChunk, {
        chat_id: chatId,
        message_id: editingMessageId,
        parse_mode: "MarkdownV2",
      });
    } catch (error) {
      if (
        error instanceof Error &&
        !error.message.includes("message is not modified")
      ) {
        throw error;
      }
      // Ignore "message is not modified" error
    }
    lastMessageId = editingMessageId;
  }

  // Send remaining chunks as new messages
  for (const chunk of chunks) {
    const sentMsg = await bot.sendMessage(chatId, chunk, {
      reply_to_message_id: lastMessageId,
      parse_mode: "MarkdownV2",
    });
    lastMessageId = sentMsg.message_id;
  }

  return { lastMessageId };
}
