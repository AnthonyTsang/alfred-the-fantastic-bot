import { convert } from "telegram-markdown-v2";

/**
 * Convert standard markdown to Telegram MarkdownV2 format
 */
export function markdownToTelegram(text: string): string {
  try {
    return convert(text, "escape");
  } catch {
    // If conversion fails, escape special characters manually
    return escapeMarkdownV2(text);
  }
}

/**
 * Escape special characters for Telegram MarkdownV2
 */
function escapeMarkdownV2(text: string): string {
  const specialChars = [
    "_",
    "*",
    "[",
    "]",
    "(",
    ")",
    "~",
    "`",
    ">",
    "#",
    "+",
    "-",
    "=",
    "|",
    "{",
    "}",
    ".",
    "!",
  ];
  let escaped = text;
  for (const char of specialChars) {
    escaped = escaped.replace(new RegExp(`\\${char}`, "g"), `\\${char}`);
  }
  return escaped;
}
