#!/usr/bin/env node
// Reads the translated XLSX back into messages/{cs,en,de,ua}.json.
//
// The CS column is editable, so Czech source copy can come back changed too.
// Those edits are reported line by line at the end: cs is the master text and
// the fallback every other locale is measured against, so it is the one column
// worth a human glance before committing.
//
// Nothing is written unless every row validates. A translated string that drops
// a placeholder or breaks a plural block does not fail at build time — it fails
// in front of a customer, at runtime, in a language nobody on the team reads.
import ExcelJS from 'exceljs';
import { parse } from '@formatjs/icu-messageformat-parser';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE = 'cs';
const TARGETS = ['en', 'de', 'ua'];
const FILE = process.argv[2];

if (!FILE) {
  console.error('usage: node scripts/i18n-import.mjs <translated.xlsx>');
  process.exit(1);
}

const load = (l) => JSON.parse(readFileSync(resolve('messages', `${l}.json`), 'utf8'));

function flatten(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out.set(key, String(v));
  }
  return out;
}

function setDeep(tree, key, value) {
  const parts = key.split('.');
  let node = tree;
  for (const p of parts.slice(0, -1)) node = node[p];
  node[parts.at(-1)] = value;
}

// Every {name} the message feeds from code, plural/select blocks included.
function argsOf(message) {
  const found = new Set();
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.value !== undefined && n.type === 1) found.add(n.value);
      if (n.type === 2 || n.type === 3 || n.type === 4) found.add(n.value);
      if (n.type === 5 || n.type === 6) {
        found.add(n.value);
        for (const opt of Object.values(n.options)) walk(opt.value);
      }
    }
  };
  walk(parse(message));
  return found;
}

const sourceTree = load(SOURCE);
const sourceFlat = flatten(sourceTree);
const trees = Object.fromEntries(TARGETS.map((l) => [l, load(l)]));
trees[SOURCE] = sourceTree;

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(FILE);
const ws = wb.getWorksheet('Translations');
if (!ws) {
  console.error('No "Translations" sheet in that file — is it the exported workbook?');
  process.exit(1);
}

const header = ws.getRow(1).values.map((v) => String(v ?? '').trim().toUpperCase());
const col = (name) => header.indexOf(name);
const KEY_COL = col('KEY');
const CS_COL = col('CS (SOURCE)');
const COLS = Object.fromEntries(TARGETS.map((l) => [l, col(l.toUpperCase())]));
if (KEY_COL < 0 || CS_COL < 0 || Object.values(COLS).some((c) => c < 0)) {
  console.error(`Missing columns. Found header: ${header.filter(Boolean).join(' | ')}`);
  process.exit(1);
}

const errors = [];
const changes = Object.fromEntries([SOURCE, ...TARGETS].map((l) => [l, 0]));
const sourceEdits = [];
const staleTargets = [];
const seen = new Set();
const cellText = (row, i) => {
  const v = row.getCell(i).value;
  if (v == null) return '';
  if (typeof v === 'object' && 'richText' in v) return v.richText.map((r) => r.text).join('');
  if (typeof v === 'object' && 'text' in v) return String(v.text);
  return String(v);
};

ws.eachRow({ includeEmpty: false }, (row, n) => {
  if (n === 1) return;
  const key = cellText(row, KEY_COL).trim();
  if (!key) return;

  const currentSource = sourceFlat.get(key);
  if (currentSource === undefined) {
    errors.push(`row ${n}: unknown key "${key}" — not in messages/${SOURCE}.json`);
    return;
  }
  seen.add(key);

  let currentArgs;
  try {
    currentArgs = argsOf(currentSource);
  } catch (err) {
    errors.push(`row ${n}: source "${key}" does not parse — ${err.message}`);
    return;
  }

  // The Czech cell may have been rewritten. Take it as the new source, but only
  // once it proves it still feeds the same values the code passes in.
  const csCell = cellText(row, CS_COL).trim();
  let sourceValue = currentSource;
  let expected = currentArgs;
  if (csCell && csCell !== currentSource) {
    let newArgs;
    try {
      newArgs = argsOf(csCell);
    } catch (err) {
      errors.push(`row ${n} [cs] "${key}": broken ICU syntax — ${err.message}`);
      return;
    }
    const lost = [...currentArgs].filter((a) => !newArgs.has(a));
    const gained = [...newArgs].filter((a) => !currentArgs.has(a));
    if (lost.length) {
      errors.push(`row ${n} [cs] "${key}": placeholder(s) dropped from the Czech source: ${lost.map((m) => `{${m}}`).join(', ')}`);
    }
    if (gained.length) {
      errors.push(`row ${n} [cs] "${key}": Czech source adds placeholder(s) the code does not supply: ${gained.map((m) => `{${m}}`).join(', ')}`);
    }
    if (lost.length || gained.length) return;

    sourceValue = csCell;
    expected = newArgs;
    setDeep(trees[SOURCE], key, csCell);
    changes[SOURCE] += 1;
    sourceEdits.push({ key, before: currentSource, after: csCell });
  }

  for (const locale of TARGETS) {
    const value = cellText(row, COLS[locale]).trim();
    // Blank means "not translated yet"; the existing value stays.
    if (!value) continue;

    let got;
    try {
      got = argsOf(value);
    } catch (err) {
      errors.push(`row ${n} [${locale}] "${key}": broken ICU syntax — ${err.message}`);
      continue;
    }

    const missing = [...expected].filter((a) => !got.has(a));
    const extra = [...got].filter((a) => !expected.has(a));
    if (missing.length) {
      errors.push(`row ${n} [${locale}] "${key}": placeholder(s) dropped: ${missing.map((m) => `{${m}}`).join(', ')}`);
    }
    if (extra.length) {
      errors.push(`row ${n} [${locale}] "${key}": unknown placeholder(s): ${extra.map((m) => `{${m}}`).join(', ')}`);
    }
    if (missing.length || extra.length) continue;

    if (flatten(trees[locale]).get(key) !== value) {
      setDeep(trees[locale], key, value);
      changes[locale] += 1;
    }
  }

  // Czech was rewritten but this language still carries the old Czech verbatim,
  // i.e. it was never translated and now mirrors text that no longer exists.
  if (sourceValue !== currentSource) {
    for (const locale of TARGETS) {
      if (flatten(trees[locale]).get(key) === currentSource) staleTargets.push(`${key} [${locale}]`);
    }
  }
});

const absent = [...sourceFlat.keys()].filter((k) => !seen.has(k));

if (errors.length) {
  console.error(`\n${errors.length} problem(s) — nothing written:\n`);
  for (const e of errors) console.error('  ' + e);
  console.error('\nFix these in the spreadsheet and run again.');
  process.exit(1);
}

for (const locale of [SOURCE, ...TARGETS]) {
  writeFileSync(resolve('messages', `${locale}.json`), JSON.stringify(trees[locale], null, 2) + '\n');
}

console.log('Imported from', FILE);
for (const l of [SOURCE, ...TARGETS]) console.log(`  ${l}: ${changes[l]} string(s) updated`);

if (sourceEdits.length) {
  console.log(`\n  Czech source text changed in ${sourceEdits.length} place(s) — review before committing:`);
  for (const e of sourceEdits) {
    console.log(`    ${e.key}`);
    console.log(`      before: ${e.before}`);
    console.log(`      after:  ${e.after}`);
  }
}

if (staleTargets.length) {
  console.log(`\n  ${staleTargets.length} untranslated cell(s) still hold the OLD Czech after a source edit:`);
  for (const k of staleTargets.slice(0, 15)) console.log('    ' + k);
  if (staleTargets.length > 15) console.log(`    … and ${staleTargets.length - 15} more`);
}
if (absent.length) {
  console.log(`\n  ${absent.length} key(s) were not in the sheet and kept their current value:`);
  for (const k of absent.slice(0, 10)) console.log('    ' + k);
  if (absent.length > 10) console.log(`    … and ${absent.length - 10} more`);
}
