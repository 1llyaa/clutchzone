// Route handlers, not the app/sitemap.ts metadata convention. Two reasons:
// the built-in serializer orders <xhtml:link> in a way sitemap.xsd rejects (see
// src/lib/seo/sitemap.ts), and generateSitemaps() produces children without an
// index, which is the part we actually wanted.
//
// A route handler also answers with a plain Response, so none of the
// `Vary: rsc, next-router-state-tree` headers that made the old app/sitemap.ts
// route uncacheable behind the CDN appear here.
export function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
