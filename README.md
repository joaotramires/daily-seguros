# daily — Next.js App

Full-stack insurance broker. Next.js 14 + TypeScript + Tailwind + Supabase + Stripe + Framer Motion.

## Import to StackBlitz

1. Go to **stackblitz.com**
2. Click **"Import from GitHub"** or drag this folder as a ZIP
3. StackBlitz will detect Next.js and run `npm install` automatically
4. Create a `.env.local` file with your keys (see below)

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Get Supabase keys from: Dashboard → Project Settings → API
Get Stripe keys from: dashboard.stripe.com → Developers → API keys

## Database Setup

Run the SQL in `src/lib/supabase.ts` (copy the comments block) in your Supabase SQL editor.

## Stripe Webhook (local dev)

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

## Stack

- **Next.js 14** App Router
- **TypeScript** throughout
- **Tailwind CSS** with custom sand palette tokens
- **Framer Motion** — spring toggles, sheet animations, stagger reveals, count-up
- **Supabase** — Auth (magic link), customers, policies, claims, referrals
- **Stripe** — subscriptions (home/car/pet), one-time (travel), webhooks

## Screens

| Route | Screen |
|---|---|
| `/` | Landing — dark gradient, Direction A copy |
| `/onboarding` | Magic link signup |
| `/app` | Home — toggles, loyalty, bundle discount |
| `/app/claims` | Claims — timeline, new claim form |
| `/app/impact` | Impact — donations, Luna adoption |
| `/app/account` | Account — profile edit, payment methods, FAQ |
"# daily-seguros" 
