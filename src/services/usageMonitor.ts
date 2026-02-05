import { config } from "../config";
import { log } from "../utils";
import { notifyAlert } from "./notification";

// Track which thresholds have been alerted for AssemblyAI
const alertedThresholds = new Set<number>();

// AssemblyAI usage tracking (in seconds)
let assemblyAiUsageSeconds = 0;

// Claude credit tracking
let lastKnownClaudeCredit: number | null = null;
const CLAUDE_LOW_CREDIT_THRESHOLD_USD = 5; // Alert when credit drops below $5

/**
 * Track AssemblyAI usage and send alerts at 50%, 70%, and 90% thresholds.
 * @param durationSeconds Duration of the transcribed audio in seconds
 */
export async function trackAssemblyAiUsage(
  durationSeconds: number
): Promise<void> {
  assemblyAiUsageSeconds += durationSeconds;

  const freeMonthlySeconds = config.assemblyAiFreeMonthlyHours * 3600;
  const usagePercentage = (assemblyAiUsageSeconds / freeMonthlySeconds) * 100;

  log("info", "AssemblyAI usage tracked", {
    durationSeconds,
    totalUsageSeconds: assemblyAiUsageSeconds,
    freeMonthlySeconds,
    usagePercentage: usagePercentage.toFixed(2),
  });

  // Check thresholds: 50%, 70%, 90%
  const thresholds = [50, 70, 90];

  for (const threshold of thresholds) {
    if (usagePercentage >= threshold && !alertedThresholds.has(threshold)) {
      alertedThresholds.add(threshold);

      const usedHours = (assemblyAiUsageSeconds / 3600).toFixed(2);
      const totalHours = config.assemblyAiFreeMonthlyHours;

      await notifyAlert(
        `AssemblyAI usage has reached ${threshold}% of the free tier. ` +
          `Used ${usedHours} hours out of ${totalHours} hours.`
      );
    }
  }
}

/**
 * Get current AssemblyAI usage in seconds.
 */
export function getAssemblyAiUsageSeconds(): number {
  return assemblyAiUsageSeconds;
}

/**
 * Reset AssemblyAI usage tracking (e.g., at the start of a new billing period).
 */
export function resetAssemblyAiUsage(): void {
  assemblyAiUsageSeconds = 0;
  alertedThresholds.clear();
  log("info", "AssemblyAI usage tracking reset");
}

/**
 * Track Claude API credit and alert when remaining credit is low.
 * @param remainingCreditUsd Remaining credit in USD (can be obtained from API responses)
 */
export async function trackClaudeCredit(
  remainingCreditUsd: number
): Promise<void> {
  const previousCredit = lastKnownClaudeCredit;
  lastKnownClaudeCredit = remainingCreditUsd;

  log("info", "Claude credit tracked", {
    remainingCreditUsd,
    previousCredit,
  });

  // Alert if credit drops below threshold
  if (remainingCreditUsd < CLAUDE_LOW_CREDIT_THRESHOLD_USD) {
    // Only alert if this is a new drop below threshold (or first time checking)
    if (
      previousCredit === null ||
      previousCredit >= CLAUDE_LOW_CREDIT_THRESHOLD_USD
    ) {
      await notifyAlert(
        `Claude API credit is running low. Remaining credit: $${remainingCreditUsd.toFixed(2)}`
      );
    }
  }
}

/**
 * Get the last known Claude credit amount.
 */
export function getLastKnownClaudeCredit(): number | null {
  return lastKnownClaudeCredit;
}

/**
 * Check if AssemblyAI usage is approaching limit and return current percentage.
 */
export function getAssemblyAiUsagePercentage(): number {
  const freeMonthlySeconds = config.assemblyAiFreeMonthlyHours * 3600;
  return (assemblyAiUsageSeconds / freeMonthlySeconds) * 100;
}
