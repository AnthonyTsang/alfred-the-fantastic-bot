FROM oven/bun:1

WORKDIR /app

CMD ["sh", "-c", "bun install && bun run bot.ts"]
