// Writes public/sitemap.xml from src/lib/seo/sitemap.ts. Run `npm run sitemap`
// after changing the page list or a <lastmod> date, then commit the result —
// the file is served as a plain static asset, not rendered per request.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSitemapXml } from '../src/lib/seo/sitemap';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'public', 'sitemap.xml');

writeFileSync(target, buildSitemapXml(), 'utf8');
console.log(`wrote ${target}`);
