import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://clutchzone.club';

// Non-public / user-specific routes. The page routes are locale-prefixed
// because localePrefix is 'always', hence the leading `/*/`.
//
// `/api` is NOT in that group: the middleware matcher excludes `api`, so the
// route handlers live at `/api/...` and never gain a locale segment. A `/*/api`
// pattern needs a slash before `api` and therefore matches none of them —
// which is what this list used to say, leaving every API route crawlable.
const DISALLOW = [
  '/api',
  '/*/admin',
  '/*/booking',
  '/*/bookings',
  // Per-reservation and per-order pages (/*/rezervace/<id>, /*/kredit/<orderId>)
  // are as user-specific as /bookings and have nothing to index.
  '/*/rezervace',
  '/*/kredit',
];

// Named explicitly per the site owner's request to keep the door open for AI
// crawlers/agents (answer engines, assistants) in addition to normal search bots.
const AI_USER_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      ...AI_USER_AGENTS.map((userAgent) => ({ userAgent, allow: '/', disallow: DISALLOW })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
