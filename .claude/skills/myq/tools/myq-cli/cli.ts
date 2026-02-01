#!/usr/bin/env bun
import { myQApi } from "@hjdhjd/myq";

const MYQ_EMAIL = process.env.MYQ_EMAIL;
const MYQ_PASSWORD = process.env.MYQ_PASSWORD;

if (!MYQ_EMAIL || !MYQ_PASSWORD) {
  console.error("Error: MYQ_EMAIL and MYQ_PASSWORD environment variables are required");
  process.exit(1);
}

const api = new myQApi();

async function login(): Promise<boolean> {
  const success = await api.login(MYQ_EMAIL!, MYQ_PASSWORD!);
  if (!success) {
    console.error("Error: Failed to login to myQ API");
    process.exit(1);
  }
  return success;
}

async function listDevices() {
  await login();
  await api.refreshDevices();

  const devices = api.devices.map((device) => ({
    name: device.name,
    serial: device.serial_number,
    type: device.device_type,
    state: device.state?.door_state || device.state?.lamp_state || "unknown",
    online: device.state?.online,
  }));

  console.log(JSON.stringify(devices, null, 2));
}

async function getStatus(identifier: string) {
  await login();
  await api.refreshDevices();

  const device = api.devices.find(
    (d) =>
      d.serial_number === identifier ||
      d.name.toLowerCase() === identifier.toLowerCase()
  );

  if (!device) {
    console.error(`Error: Device not found: ${identifier}`);
    process.exit(1);
  }

  const status = {
    name: device.name,
    serial: device.serial_number,
    type: device.device_type,
    state: device.state?.door_state || device.state?.lamp_state || "unknown",
    online: device.state?.online,
    lastUpdate: device.state?.last_update,
  };

  console.log(JSON.stringify(status, null, 2));
}

async function openDoor(identifier: string) {
  await login();
  await api.refreshDevices();

  const device = api.devices.find(
    (d) =>
      d.serial_number === identifier ||
      d.name.toLowerCase() === identifier.toLowerCase()
  );

  if (!device) {
    console.error(`Error: Device not found: ${identifier}`);
    process.exit(1);
  }

  const success = await api.execute(device, "open");

  if (success) {
    console.log(`Successfully sent open command to ${device.name}`);
  } else {
    console.error(`Failed to open ${device.name}`);
    process.exit(1);
  }
}

async function closeDoor(identifier: string) {
  await login();
  await api.refreshDevices();

  const device = api.devices.find(
    (d) =>
      d.serial_number === identifier ||
      d.name.toLowerCase() === identifier.toLowerCase()
  );

  if (!device) {
    console.error(`Error: Device not found: ${identifier}`);
    process.exit(1);
  }

  const success = await api.execute(device, "close");

  if (success) {
    console.log(`Successfully sent close command to ${device.name}`);
  } else {
    console.error(`Failed to close ${device.name}`);
    process.exit(1);
  }
}

function printUsage() {
  console.log(`
myQ Garage Door CLI

Usage:
  bun run tools/myq/cli.ts <command> [arguments]

Commands:
  list                    List all myQ devices
  status <name|serial>    Get status of a specific device
  open <name|serial>      Open a garage door
  close <name|serial>     Close a garage door
  help                    Show this help message

Environment Variables:
  MYQ_EMAIL              Your myQ account email
  MYQ_PASSWORD           Your myQ account password

Examples:
  bun run tools/myq/cli.ts list
  bun run tools/myq/cli.ts status "Garage Door"
  bun run tools/myq/cli.ts open "Garage Door"
  bun run tools/myq/cli.ts close "Garage Door"
`);
}

// Main
const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "list":
    await listDevices();
    break;
  case "status":
    if (!args[0]) {
      console.error("Error: Device name or serial required");
      process.exit(1);
    }
    await getStatus(args[0]);
    break;
  case "open":
    if (!args[0]) {
      console.error("Error: Device name or serial required");
      process.exit(1);
    }
    await openDoor(args[0]);
    break;
  case "close":
    if (!args[0]) {
      console.error("Error: Device name or serial required");
      process.exit(1);
    }
    await closeDoor(args[0]);
    break;
  case "help":
  case "--help":
  case "-h":
    printUsage();
    break;
  default:
    if (command) {
      console.error(`Error: Unknown command: ${command}`);
    }
    printUsage();
    process.exit(command ? 1 : 0);
}
