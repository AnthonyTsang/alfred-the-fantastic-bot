import type TelegramBot from "node-telegram-bot-api";
import { startCommand } from "./start";
import { cliPathCommand } from "./cliPath";
import { myqCommand } from "./myq";

const commands = [startCommand, cliPathCommand, myqCommand];

export function registerCommands(bot: TelegramBot) {
  // Register command handlers
  for (const cmd of commands) {
    cmd.handler(bot);
  }

  // Set bot commands for Telegram menu
  bot.setMyCommands(
    commands.map((cmd) => ({
      command: cmd.command,
      description: cmd.description,
    }))
  );
}
