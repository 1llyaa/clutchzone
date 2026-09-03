#!/usr/bin/env node
// Exports every translatable UI string to one XLSX for a human translator.
//
// cs drives the sheet: its key order is the row order, and its values are the
// text being translated from. The CS column is editable too — a translator
// reading the whole site is the person most likely to spot bad Czech copy.
// Admin-only text never reaches these files, so it is out of scope by
// construction.
import ExcelJS from 'exceljs';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE = 'cs';
const TARGETS = ['en', 'de', 'ua'];
const OUT = process.argv[2] ?? 'clutchzone-translations.xlsx';

// Namespace → where the translator will see the string. Guessing from the key
// alone leaves them translating blind, which is how UI copy ends up too long
// for its button.
const CONTEXT = {
  nav: 'Top navigation',
  hero: 'Homepage hero',
  features: 'Homepage — feature cards',
  stream: 'Homepage — stream section',
  tournaments: 'Tournaments section + cards',
  tournamentReg: 'Tournament registration form',
  games: 'Games section',
  gallery: 'Gallery section',
  privateEvents: 'Private events section',
  contact: 'Contact section',
  ctaBand: 'Call-to-action band',
  footer: 'Footer',
  cookies: 'Cookie bar and settings',
  booking: 'Booking modal (all steps)',
  ggleap: 'ggLeap account hours lookup',
  calculator: 'Price calculator',
  kredit: 'Hour-package (credit) purchase',
  rezervace: 'Booking management page',
  cancel: 'Booking cancellation page',
  withdraw: 'Contract withdrawal page',
  common: 'Shared buttons and screen-reader labels',
  meta: 'Page titles, SEO and social preview',
  maintenance: 'Maintenance / staff login screen',
  weekdays: 'Weekday names (opening hours)',
  errors: 'Server error messages shown to the customer',
  email: 'Customer e-mails (booking, receipt, credit, tournament)',
};

function flatten(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out.push([key, String(v)]);
  }
  return out;
}

function load(locale) {
  return JSON.parse(readFileSync(resolve('messages', `${locale}.json`), 'utf8'));
}

function lookup(tree, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), tree);
}

const source = load(SOURCE);
const targets = Object.fromEntries(TARGETS.map((l) => [l, load(l)]));
const rows = flatten(source);

const wb = new ExcelJS.Workbook();
wb.creator = 'clutchzone i18n export';
wb.created = new Date();

// ---- instructions sheet ----
const info = wb.addWorksheet('READ ME');
info.columns = [{ width: 110 }];
const lines = [
  ['Clutch Zone — website translation', true],
  ['', false],
  ['Fill in the EN, DE and UA columns on the "Translations" sheet, translating from CS (SOURCE).', false],
  ['You may also correct the Czech itself. The KEY and WHERE columns are locked — leave those alone.', false],
  ['', false],
  ['1. Editable columns: CS (SOURCE), EN, DE and UA. KEY and WHERE are locked so the rows keep matching', false],
  ['      the website code — please do not try to unprotect them.', false],
  ['2. Translate from the CS (SOURCE) column. WHERE tells you where the text appears on the site.', false],
  ['3. Correcting the Czech is welcome. But Czech is the master text: an edit there changes what the Czech', false],
  ['      site actually says, so only rewrite Czech you are confident is wrong. Keep its placeholders intact.', false],
  ['4. Anything in curly braces is a placeholder filled in by the site — copy it EXACTLY, do not translate it.', false],
  ['      Example:  "{available} z {total} stanic volných"  ->  "{available} of {total} stations free"', false],
  ['5. Some rows use plural rules, e.g. {count, plural, one {...} other {...}}. Keep that structure and', false],
  ['      use the plural categories your language needs (English: one/other, German: one/other,', false],
  ['      Czech: one/few/other, Ukrainian: one/few/many/other). The # sign prints the number.', false],
  ['6. Keep -> arrows, the · separator and any <strong> tags exactly as they appear.', false],
  ['7. A row whose target column still shows Czech has not been translated yet — see the NEEDS WORK column.', false],
  ['8. Do not add, delete, reorder or rename rows. Send the file back as .xlsx.', false],
  ['', false],
  [`Exported ${new Date().toISOString().slice(0, 10)} · ${rows.length} strings · source language: Czech`, false],
];
lines.forEach(([text, bold]) => {
  const r = info.addRow([text]);
  r.getCell(1).font = { bold, size: bold ? 14 : 11 };
  r.getCell(1).alignment = { wrapText: true, vertical: 'top' };
});

// ---- translation sheet ----
const ws = wb.addWorksheet('Translations', {
  views: [{ state: 'frozen', ySplit: 1 }],
});
ws.columns = [
  { header: 'KEY', key: 'key', width: 38 },
  { header: 'WHERE', key: 'where', width: 34 },
  { header: 'CS (SOURCE)', key: 'cs', width: 62 },  // editable: see READ ME point 3
  { header: 'EN', key: 'en', width: 62 },
  { header: 'DE', key: 'de', width: 62 },
  { header: 'UA', key: 'ua', width: 62 },
  { header: 'NEEDS WORK', key: 'todo', width: 16 },
];
ws.getRow(1).font = { bold: true };
ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };

for (const [key, csValue] of rows) {
  const values = Object.fromEntries(TARGETS.map((l) => [l, lookup(targets[l], key) ?? '']));
  // Still identical to the Czech source: nobody has translated it yet.
  const untouched = TARGETS.filter((l) => values[l] === csValue);
  const row = ws.addRow({
    key,
    where: CONTEXT[key.split('.')[0]] ?? key.split('.')[0],
    cs: csValue,
    ...values,
    todo: untouched.length ? untouched.join(', ').toUpperCase() : '',
  });
  row.alignment = { wrapText: true, vertical: 'top' };
  // Locked by default in Excel. KEY and WHERE stay locked so rows cannot drift
  // out of sync with the code; the source and target text are all editable.
  [3, 4, 5, 6].forEach((i) => {
    row.getCell(i).protection = { locked: false };
    if (i > 3 && values[TARGETS[i - 4]] === csValue) {
      row.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    }
  });
}

ws.autoFilter = { from: 'A1', to: `G${rows.length + 1}` };
await ws.protect('', { selectLockedCells: true, selectUnlockedCells: true, autoFilter: true });

await wb.xlsx.writeFile(OUT);

const todoCount = rows.filter(([k, v]) =>
  TARGETS.some((l) => (lookup(targets[l], k) ?? '') === v),
).length;
console.log(`Wrote ${OUT}`);
console.log(`  ${rows.length} strings · ${TARGETS.length} target languages`);
console.log(`  ${todoCount} rows still untranslated in at least one language (highlighted)`);
