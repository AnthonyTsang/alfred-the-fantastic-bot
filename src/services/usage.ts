// Usage tracking service for monitoring API calls and costs

// Bot start time for uptime calculation
const botStartTime = Date.now();

// Claude API usage tracking
interface ClaudeUsageStats {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

const claudeUsage: ClaudeUsageStats = {
  totalCalls: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
};

// AssemblyAI usage tracking
interface AssemblyAIUsageStats {
  totalTranscriptions: number;
  totalDurationSeconds: number;
}

const assemblyAIUsage: AssemblyAIUsageStats = {
  totalTranscriptions: 0,
  totalDurationSeconds: 0,
};

// Claude Sonnet pricing (as of 2024)
// Input: $3 per 1M tokens, Output: $15 per 1M tokens
const CLAUDE_INPUT_COST_PER_TOKEN = 3 / 1_000_000;
const CLAUDE_OUTPUT_COST_PER_TOKEN = 15 / 1_000_000;

// AssemblyAI pricing: $0.00025 per second ($0.015 per minute)
const ASSEMBLYAI_COST_PER_SECOND = 0.00025;

export function getBotStartTime(): number {
  return botStartTime;
}

export function getUptime(): string {
  const uptimeMs = Date.now() - botStartTime;
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
  if (seconds % 60 > 0 || parts.length === 0) parts.push(`${seconds % 60}s`);

  return parts.join(" ");
}

export function trackClaudeCall(inputTokens: number = 0, outputTokens: number = 0): void {
  claudeUsage.totalCalls++;
  claudeUsage.totalInputTokens += inputTokens;
  claudeUsage.totalOutputTokens += outputTokens;
}

export function trackAssemblyAITranscription(durationSeconds: number): void {
  assemblyAIUsage.totalTranscriptions++;
  assemblyAIUsage.totalDurationSeconds += durationSeconds;
}

export function getClaudeUsage(): ClaudeUsageStats & { estimatedCost: number } {
  const inputCost = claudeUsage.totalInputTokens * CLAUDE_INPUT_COST_PER_TOKEN;
  const outputCost = claudeUsage.totalOutputTokens * CLAUDE_OUTPUT_COST_PER_TOKEN;
  const estimatedCost = inputCost + outputCost;

  return {
    ...claudeUsage,
    estimatedCost,
  };
}

export function getAssemblyAIUsage(): AssemblyAIUsageStats & { estimatedCost: number } {
  const estimatedCost = assemblyAIUsage.totalDurationSeconds * ASSEMBLYAI_COST_PER_SECOND;

  return {
    ...assemblyAIUsage,
    estimatedCost,
  };
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

export function getUsageSummary(): string {
  const uptime = getUptime();
  const claude = getClaudeUsage();
  const assemblyAI = getAssemblyAIUsage();

  const lines = [
    "Bot Status",
    "==========",
    `Uptime: ${uptime}`,
    "",
    "Claude API",
    `- Calls: ${claude.totalCalls}`,
    `- Input tokens: ${claude.totalInputTokens.toLocaleString()}`,
    `- Output tokens: ${claude.totalOutputTokens.toLocaleString()}`,
    `- Estimated cost: $${claude.estimatedCost.toFixed(4)}`,
    "",
    "AssemblyAI",
    `- Transcriptions: ${assemblyAI.totalTranscriptions}`,
    `- Total duration: ${formatDuration(assemblyAI.totalDurationSeconds)}`,
    `- Estimated cost: $${assemblyAI.estimatedCost.toFixed(4)}`,
    "",
    `Total estimated cost: $${(claude.estimatedCost + assemblyAI.estimatedCost).toFixed(4)}`,
  ];

  return lines.join("\n");
}
