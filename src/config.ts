import { resolve } from "path";

class Config {
  readonly telegramBotToken: string;
  readonly anthropicApiKey: string;
  readonly claudeCodePath: string;
  readonly assemblyAiApiKey?: string;

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
  }
}

export const config = new Config();
