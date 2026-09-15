import { buildSitemapIndexXml } from '@/lib/seo/sitemap';
import { xmlResponse } from '@/lib/seo/xml-response';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function GET() {
  return xmlResponse(buildSitemapIndexXml());
}
