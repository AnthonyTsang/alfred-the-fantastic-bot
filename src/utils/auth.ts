import { config } from "../config";
import { log } from "./logger";

/**
 * Checks if a user is authorized to interact with the bot.
 * If ALLOWED_USERS is empty or not set, all users are allowed.
 * @param userId - The Telegram user ID to check
 * @returns true if the user is authorized, false otherwise
 */
export function isUserAuthorized(userId: number | undefined): boolean {
  // If no user ID provided, deny access
  if (userId === undefined) {
    return false;
  }

  // If no allowed users are configured, allow all users (development mode)
  if (config.allowedUsers.length === 0) {
    return true;
  }

  const isAllowed = config.allowedUsers.includes(userId);

  if (!isAllowed) {
    log("warn", "Unauthorized user attempted to access the bot", { userId });
  }

  return isAllowed;
}
