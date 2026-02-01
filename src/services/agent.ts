import { query } from "@anthropic-ai/claude-agent-sdk";
import type { SDKAssistantMessage, SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import { config } from "../config";
import { log } from "../utils";
import fs from "fs";

// Map from Telegram message ID to Claude session ID
const sessionMap = new Map<number, string>();

export function getSessionId(messageId: number): string | undefined {
  return sessionMap.get(messageId);
}

export function saveSessionId(messageId: number, sessionId: string): void {
  sessionMap.set(messageId, sessionId);
}

export type AgentMessageType = "assistant" | "result";

export type AgentMessage = {
  type: AgentMessageType;
  text: string;
  sessionId: string;
};

export type ImageAttachment = {
  data: string; // base64 encoded
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
};

export async function* queryAgentStream(
  prompt: string,
  existingSessionId?: string,
  images: ImageAttachment[] = []
): AsyncGenerator<AgentMessage, void, unknown> {
  // Build prompt with images if provided
  let fullPrompt: string | { role: "user"; content: unknown[] };

  if (images.length > 0) {
    const content: unknown[] = [];

    // Add images first
    for (const image of images) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: image.mediaType,
          data: image.data,
        },
      });
    }

    // Add text
    content.push({
      type: "text",
      text: prompt,
    });

    fullPrompt = {
      role: "user",
      content,
    };
  } else {
    fullPrompt = prompt;
  }

  const agentQuery = query({
    prompt: fullPrompt as string,
    options: {
      cwd: process.cwd(),
      model: "claude-sonnet-4-20250514",
      maxTurns: 10,
      allowedTools: [
        "WebSearch",
        "WebFetch",
        "Read",
        "Bash",
        "AskUserQuestion",
        "Grep",
        "Glob",
        "Skill",
      ],
      executable: "bun",
      permissionMode: "default",
      maxBudgetUsd: 0.5,
      pathToClaudeCodeExecutable: config.claudeCodePath,
      stderr: (data: string) => {
        log("info", `Claude Code STDERR: ${data}`);
      },
      settingSources: ["project"],
      ...(existingSessionId && { resume: existingSessionId }),
    },
  });

  try {
    for await (const message of agentQuery) {
      const sessionId = message.session_id;
      log("info", `Agent message: ${JSON.stringify(message)}`);

      switch (message.type) {
        case "assistant": {
          const text = formatSDKAssistantMessage(message);
          if (text) {
            yield { type: "assistant", text, sessionId };
          }
          break;
        }
        case "result": {
          const text = formatSDKResultMessage(message);
          if (text) {
            yield { type: "result", text, sessionId };
          }
          break;
        }
      }
    }
  } catch (error) {
    log("error", "Error in queryAgentStream", {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : String(error),
    });
    throw error;
  }
}

function formatSDKResultMessage(message: SDKResultMessage): string {
  switch (message.subtype) {
    case "success":
      return message.result;
    case "error_during_execution":
      return `Error: An error occurred during execution.`;
    case "error_max_turns":
      return `Error: Maximum number of turns reached.`;
    case "error_max_budget_usd":
      return `Error: Maximum budget exceeded.`;
    case "error_max_structured_output_retries":
      return `Error: Maximum structured output retries reached.`;
    default:
      return `Unknown message subtype`;
  }
}

function formatSDKAssistantMessage(message: SDKAssistantMessage): string {
  switch (message.message.type) {
    case "message":
      if (typeof message.message.content === "string") {
        return message.message.content;
      } else if (Array.isArray(message.message.content)) {
        return message.message.content
          .filter((part: { type: string }) => part.type === "text")
          .map((part: { type: string; text: string }) => part.text)
          .join("");
      }
      return "";
    default:
      log(
        "error",
        `Unknown assistant message type: ${message.message.type}: ${JSON.stringify(message)}`
      );
      return "";
  }
}
