---
name: myq garage door control
description: Helps control garage door. Use this skill when the user asks to open or close the garage door, or list out the garage, or get the garage door status.
---

# myQ Garage Door Control

You can control myQ garage doors using the CLI tool at `skills/myq/tools/myq-cli/cli.ts`.

## Commands:
- List all garage doors: `bun --env-file=.env run skills/myq/tools/myq-cli/cli.ts list`
- Get garage doors status: `bun --env-file=.env run skills/myq/tools/myq-cli/cli.ts status "<device name or serial>"`
- Open a garage: `bun run --env-file=.env skills/myq/tools/myq-cli/cli.ts open "<device name or serial>"`
- Close a garage: `bun run --env-file=.env skills/myq/tools/myq-cli/cli.ts close "<device name or serial>"`

## When to use:
- When the user asks about garage doors
- When the user wants to open/close the garage
- When the user wants to check garage door status

## Usage notes:
- Always list devices first if you don't know the device name
- Then use the appropriate command with the device name or serial
