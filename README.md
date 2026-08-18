# Clutch Zone

Website for Clutch Zone — an esports gaming club in České Budějovice. Station bookings (PC/PS5), tournaments, pricing, and a small admin back-office.

## Stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) — database, auth, storage
- [Stripe](https://stripe.com) — online payments
- [next-intl](https://next-intl.dev) — cs/en localization

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase/Stripe/SMTP keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Run a production build |
| `npm run lint` | Lint |

## Project layout

```
src/app/[locale]/     pages (cs/en, always locale-prefixed)
src/app/api/          route handlers (bookings, admin, webhooks, ...)
src/components/       UI, sections, admin, reservation flow
src/lib/              Supabase clients, email, shared config
i18n/, messages/      next-intl routing + cs.json/en.json translations
supabase/migrations/  SQL migrations
```

## Environment variables

See [.env.local.example](.env.local.example) for the full list — Supabase keys, Stripe keys, SMTP for booking-notification emails, and the site's public business/legal info used in the footer and structured data.

## Deployment

`output: 'standalone'` in `next.config.ts`; ships via the included `Dockerfile`.
