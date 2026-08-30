#!/usr/bin/env node
/**
 * Pre-deploy safety net. Two independent checks:
 *
 *   1. No secret from .env.local ended up in the client bundle. Only
 *      NEXT_PUBLIC_-prefixed vars are meant to be there; anything else in
 *      .next/static means a value leaked through code we wrote (an API
 *      response, a Server Component prop, an error message) rather than
 *      through Next.js itself.
 *
 *   2. No sensitive table is readable with the public anon key. The anon key
 *      ships in the bundle by design — RLS is what actually protects the data,
 *      so a new table added without RLS is the real risk this guards against.
 *
 * Table list is read live from PostgREST, so tables added later are covered
 * automatically without touching this file — they just have to be classified
 * in PUBLIC_TABLES below.
 *
 * Usage: npm run check:secrets   (run `npm run build` first for check 1)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** Tables whose contents are public website material and may be anon-readable. */
const PUBLIC_TABLES = new Set([
  'stations',
  'hour_tiers',
  'time_passes',
  'opening_hours',
  'pricing_tiers',
  'pc_duration_prices',
  'ps5_duration_prices',
  'gallery_images',
  'gallery_config',
  'games',
  'tournaments',
]);

/** Values shorter than this are too generic to grep for without false hits. */
const MIN_GREPPABLE = 12;

const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', DIM = '\x1b[2m', OFF = '\x1b[0m';
let failed = false;

function fail(msg) { failed = true; console.log(`${RED}  FAIL${OFF} ${msg}`); }
function pass(msg) { console.log(`${GREEN}  ok  ${OFF} ${msg}`); }
function warn(msg) { console.log(`${YELLOW}  warn${OFF} ${msg}`); }

function parseEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

function readAllFiles(dir) {
  let blob = '';
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) blob += readAllFiles(full);
    else { try { blob += readFileSync(full, 'utf8'); } catch { /* binary */ } }
  }
  return blob;
}

function checkBundle(env) {
  console.log('\nSecrets in the client bundle');
  const dir = '.next/static';
  if (!existsSync(dir)) {
    warn('.next/static missing — run `npm run build` first (check skipped)');
    return;
  }
  const blob = readAllFiles(dir);
  console.log(`${DIM}       scanned ${blob.length.toLocaleString()} chars${OFF}`);

  let checked = 0;
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('NEXT_PUBLIC_') || !value) continue;
    if (value.length < MIN_GREPPABLE) { warn(`${key} — value too short to grep safely, verify by hand`); continue; }
    checked++;
    if (blob.includes(value)) fail(`${key} — its value is in the client bundle`);
  }
  if (!failed) pass(`${checked} secrets checked, none present in the bundle`);
}

async function countRows(url, key, table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
    method: 'HEAD',
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact', Range: '0-0' },
  });
  const range = res.headers.get('content-range');
  if (!range) return null;
  const total = Number(range.split('/')[1]);
  return Number.isFinite(total) ? total : null;
}

async function checkRls(env) {
  console.log('\nAnon-key access to Supabase tables');
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) { warn('Supabase env vars missing (check skipped)'); return; }

  const schema = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  }).then((r) => r.json()).catch(() => null);

  const tables = Object.keys(schema?.definitions ?? {}).sort();
  if (!tables.length) { warn('could not read the table list from PostgREST (check skipped)'); return; }

  let guarded = 0;
  for (const table of tables) {
    const [anonRows, serviceRows] = await Promise.all([
      countRows(url, anon, table),
      countRows(url, service, table),
    ]);

    if (PUBLIC_TABLES.has(table)) continue;
    if (anonRows === null || serviceRows === null) { warn(`${table} — could not be read`); continue; }

    if (anonRows > 0) {
      fail(`${table} — readable with the public anon key (${anonRows} rows). Add RLS, or list it in PUBLIC_TABLES if that is intended.`);
    } else if (serviceRows === 0) {
      warn(`${table} — empty, so RLS cannot be confirmed from the outside. Re-run once it has rows.`);
    } else {
      guarded++;
    }
  }
  if (guarded) pass(`${guarded} sensitive tables confirmed unreadable by anon`);

  const unclassified = tables.filter((t) => !PUBLIC_TABLES.has(t));
  console.log(`${DIM}       ${tables.length} tables total, ${tables.length - unclassified.length} intentionally public${OFF}`);
}

const env = parseEnv('.env.local');
await checkBundle(env);
await checkRls(env);

console.log(failed
  ? `\n${RED}Something leaked. Fix it before deploying.${OFF}\n`
  : `\n${GREEN}All checks passed.${OFF}\n`);
process.exit(failed ? 1 : 0);
