import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

// ── SCHEMA (run in Supabase SQL editor) ──────────────────────────────────────
// 
// create table customers (
//   id uuid default gen_random_uuid() primary key,
//   created_at timestamptz default now(),
//   email text unique not null,
//   phone text,
//   name text not null,
//   age int,
//   city text,
//   referral_code text unique default substring(md5(random()::text), 1, 8),
//   referred_by text,
//   stripe_customer_id text,
//   loyalty_months int default 0,
//   fcm_token text
// );
// 
// create table policies (
//   id uuid default gen_random_uuid() primary key,
//   created_at timestamptz default now(),
//   customer_id uuid references customers(id),
//   product text check (product in ('home','car','pet','travel')),
//   status text check (status in ('active','cancelled','pending')) default 'pending',
//   monthly_premium numeric not null,
//   annual_premium numeric not null,
//   answers jsonb,
//   stripe_subscription_id text,
//   starts_at timestamptz,
//   cancelled_at timestamptz,
//   loyalty_months int default 0
// );
// 
// create table claims (
//   id uuid default gen_random_uuid() primary key,
//   created_at timestamptz default now(),
//   policy_id uuid references policies(id),
//   customer_id uuid references customers(id),
//   status text check (status in ('received','in_review','with_mapfre','with_assessor','resolved')) default 'received',
//   description text,
//   resolution_deadline timestamptz,
//   resolved_at timestamptz,
//   notes text,
//   media_urls text[] default '{}'
// );
//
// -- Run this if the table already exists:
// -- alter table claims add column if not exists media_urls text[] default '{}';
//
// -- Storage bucket for claim media (run in Supabase dashboard → Storage):
// -- create bucket 'claim-media' with public access enabled
// 
// create table referrals (
//   id uuid default gen_random_uuid() primary key,
//   created_at timestamptz default now(),
//   referrer_id uuid references customers(id),
//   referred_email text,
//   converted bool default false,
//   converted_at timestamptz
// );
// 
// alter table customers enable row level security;
// alter table policies enable row level security;
// alter table claims enable row level security;
// alter table referrals enable row level security;
// 
// -- Allow authenticated users to read/write their own data
// create policy "Own data" on customers for all using (auth.uid() = id);
// create policy "Own policies" on policies for all using (auth.uid() = customer_id);
// create policy "Own claims" on claims for all using (auth.uid() = customer_id);
