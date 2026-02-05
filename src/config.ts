import { resolve } from "path";

class Config {
  readonly telegramBotToken: string;
  readonly anthropicApiKey: string;
  readonly claudeCodePath: string;
  readonly assemblyAiApiKey?: string;
  readonly adminChatId?: number;
  readonly assemblyAiFreeMonthlyHours: number;

  constructor() {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!telegramBotToken) {
      throw new Error("TELEGRAM_BOT_TOKEN is required");
    }
    this.telegramBotToken = telegramBotToken;

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY is required");
    }
    this.anthropicApiKey = anthropicApiKey;

    // Path to locally installed Claude Code CLI
    this.claudeCodePath = resolve(
      import.meta.dirname,
      "../node_modules/.bin/claude"
    );

    // AssemblyAI API key (optional, for voice message transcription)
    this.assemblyAiApiKey = process.env.ASSEMBLYAI_API_KEY;

    // Admin chat ID for notifications (optional)
    const adminChatIdStr = process.env.ADMIN_CHAT_ID;
    if (adminChatIdStr) {
      this.adminChatId = parseInt(adminChatIdStr, 10);
    }

    // AssemblyAI free tier monthly hours (default: 100 hours)
    this.assemblyAiFreeMonthlyHours = parseInt(
      process.env.ASSEMBLYAI_FREE_MONTHLY_HOURS || "100",
      10
    );
  }
}

export const config = new Config();
