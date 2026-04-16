#!/usr/bin/env npx tsx
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// Config from .env
// ---------------------------------------------------------------------------

const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const APP_ID = env.SUNMI_APP_ID;
const APP_KEY = env.SUNMI_APP_KEY;
const PRINTER_SN = env.SUNMI_PRINTER_SN;
const BASE_URL = 'https://openapi.sunmi.com';

if (!APP_ID || !APP_KEY) {
  console.error('Error: SUNMI_APP_ID and SUNMI_APP_KEY must be set in .env');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// V2 API helpers
// ---------------------------------------------------------------------------

function sign(jsonBody: string, ts: string, nonce: string): string {
  return createHmac('sha256', APP_KEY).update(jsonBody + APP_ID + ts + nonce).digest('hex');
}

function nonce(): string {
  return Math.random().toString().slice(2, 8);
}

async function api(path: string, body: Record<string, unknown>) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const n = nonce();
  const json = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sunmi-Appid': APP_ID,
      'Sunmi-Timestamp': ts,
      'Sunmi-Nonce': n,
      'Sunmi-Sign': sign(json, ts, n),
      'Source': 'openapi',
    },
    body: json,
  });

  return (await res.json()) as { code: number; msg: string; data: unknown };
}

function ok(result: { code: number }): boolean {
  return result.code === 1 || result.code === 10000;
}

function sn(override?: string): string {
  const serial = override || PRINTER_SN;
  if (!serial) {
    console.error('Error: No printer SN. Pass it as an argument or set SUNMI_PRINTER_SN in .env');
    process.exit(1);
  }
  return serial;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdStatus(args: string[]) {
  const serial = sn(args[0]);
  console.log(`Querying status for ${serial}...`);
  const result = await api('/v2/printer/open/open/device/onlineStatus', { sn: serial });

  if (!ok(result)) {
    console.log('Failed:', result.msg, `(code: ${result.code})`);
    return;
  }

  const data = result.data as { list: { sn: string; msn: string; is_online: number }[] } | null;
  if (!data?.list?.length) {
    console.log('Printer not found — it may not be assigned to this channel.');
    return;
  }

  for (const d of data.list) {
    console.log(`  SN: ${d.sn}  Online: ${d.is_online === 1 ? 'YES' : 'NO'}`);
  }
}

async function cmdList(args: string[]) {
  const page = parseInt(args[0] || '1', 10);
  const pageSize = parseInt(args[1] || '100', 10);
  console.log(`Listing devices (page ${page}, size ${pageSize})...`);
  const result = await api('/v2/printer/open/open/device/onlineStatus', { page_no: page, page_size: pageSize });

  if (!ok(result)) {
    console.log('Failed:', result.msg, `(code: ${result.code})`);
    return;
  }

  const data = result.data as { list: { sn: string; msn: string; is_online: number }[]; page: { total: number } } | null;
  if (!data?.list?.length) {
    console.log('No devices found.');
    return;
  }

  console.log(`Total: ${data.page.total}`);
  for (const d of data.list) {
    const isDefault = d.sn === PRINTER_SN;
    console.log(`  ${isDefault ? '>' : ' '} SN: ${d.sn}  Online: ${d.is_online === 1 ? 'YES' : 'NO'}${isDefault ? '  (default)' : ''}`);
  }
}

async function cmdBind(args: string[]) {
  const shopId = parseInt(args[0], 10);
  const serial = sn(args[1]);

  if (!shopId && shopId !== 0) {
    console.error('Usage: bind <shop_id> [sn]');
    return;
  }

  console.log(`Binding ${serial} to shop ${shopId}...`);
  const result = await api('/v2/printer/open/open/device/bindShop', { sn: serial, shop_id: shopId });

  if (ok(result)) {
    console.log('Bound successfully.');
  } else {
    console.log('Failed:', result.msg, `(code: ${result.code})`);
  }
}

async function cmdUnbind(args: string[]) {
  const shopId = parseInt(args[0], 10);
  const serial = sn(args[1]);

  if (!shopId && shopId !== 0) {
    console.error('Usage: unbind <shop_id> [sn]');
    return;
  }

  console.log(`Unbinding ${serial} from shop ${shopId}...`);
  const result = await api('/v2/printer/open/open/device/unbindShop', { sn: serial, shop_id: shopId });

  if (ok(result)) {
    console.log('Unbound successfully.');
  } else {
    console.log('Failed:', result.msg, `(code: ${result.code})`);
  }
}

async function cmdPrint(args: string[]) {
  const text = args.join(' ') || 'Test print from sunmi-cli';
  const serial = sn();

  const parts: Buffer[] = [];
  parts.push(Buffer.from([0x1b, 0x40]));           // Init
  parts.push(Buffer.from([0x1b, 0x61, 0x01]));     // Center
  parts.push(Buffer.from([0x1b, 0x21, 0x30]));     // Large
  parts.push(Buffer.from(text + '\n', 'utf-8'));
  parts.push(Buffer.from([0x1b, 0x21, 0x00]));     // Normal
  parts.push(Buffer.from([0x1b, 0x61, 0x00]));     // Left
  parts.push(Buffer.from('================================\n', 'utf-8'));
  parts.push(Buffer.from(`SN: ${serial}\n`, 'utf-8'));
  parts.push(Buffer.from(`Date: ${new Date().toLocaleString()}\n`, 'utf-8'));
  parts.push(Buffer.from('================================\n', 'utf-8'));
  parts.push(Buffer.from('\n\n\n'));
  parts.push(Buffer.from([0x1d, 0x56, 0x42, 0x00])); // Cut

  const tradeNo = 'cli_' + Date.now();
  console.log(`Printing to ${serial} (trade_no: ${tradeNo})...`);

  const result = await api('/v2/printer/open/open/device/pushContent', {
    sn: serial,
    trade_no: tradeNo,
    count: 1,
    content: Buffer.concat(parts).toString('hex'),
  });

  if (ok(result)) {
    console.log('Print job sent.');
  } else {
    console.log('Failed:', result.msg, `(code: ${result.code})`);
  }
}

async function cmdPrintStatus(args: string[]) {
  const tradeNo = args[0];
  if (!tradeNo) {
    console.error('Usage: print-status <trade_no>');
    return;
  }

  console.log(`Querying print status for ${tradeNo}...`);
  const result = await api('/v2/printer/open/open/ticket/printStatus', { trade_no: tradeNo });

  if (!ok(result)) {
    console.log('Failed:', result.msg, `(code: ${result.code})`);
    return;
  }

  const data = result.data as { sn: string; is_print: number; print_time: number } | null;
  if (!data) {
    console.log('No data returned.');
    return;
  }

  const status = data.is_print === 1 ? 'Printed' : data.is_print === 2 ? 'Deleted' : 'Not printed';
  const time = data.print_time ? new Date(data.print_time * 1000).toLocaleString() : '-';
  console.log(`  SN: ${data.sn}  Status: ${status}  Time: ${time}`);
}

async function cmdClear(args: string[]) {
  const serial = sn(args[0]);
  console.log(`Clearing print queue for ${serial}...`);
  const result = await api('/v2/printer/open/open/device/clearPrintJob', { sn: serial });

  if (ok(result)) {
    console.log('Queue cleared.');
  } else {
    console.log('Failed:', result.msg, `(code: ${result.code})`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const COMMANDS: Record<string, { fn: (args: string[]) => Promise<void>; usage: string }> = {
  status:         { fn: cmdStatus,      usage: 'status [sn]                 — Check printer online status' },
  list:           { fn: cmdList,        usage: 'list [page] [size]          — List all bound devices' },
  bind:           { fn: cmdBind,        usage: 'bind <shop_id> [sn]         — Bind printer to a shop' },
  unbind:         { fn: cmdUnbind,      usage: 'unbind <shop_id> [sn]       — Unbind printer from a shop' },
  print:          { fn: cmdPrint,       usage: 'print [text...]             — Send a test print' },
  'print-status': { fn: cmdPrintStatus, usage: 'print-status <trade_no>     — Check if a print job was printed' },
  clear:          { fn: cmdClear,       usage: 'clear [sn]                  — Clear the print queue' },
};

function help() {
  console.log('Sunmi Cloud Printer CLI (V2 API)\n');
  console.log('Usage: npx tsx sunmi-cli.ts <command> [args...]\n');
  console.log('Commands:');
  for (const cmd of Object.values(COMMANDS)) {
    console.log(`  ${cmd.usage}`);
  }
  console.log(`\nDefault printer SN: ${PRINTER_SN || '(not set)'}`);
}

const [cmd, ...args] = process.argv.slice(2);

if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
  help();
  process.exit(0);
}

const command = COMMANDS[cmd];
if (!command) {
  console.error(`Unknown command: ${cmd}\n`);
  help();
  process.exit(1);
}

command.fn(args).catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
