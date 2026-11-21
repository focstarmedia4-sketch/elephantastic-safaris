-- ============================================================================
-- Elephantastic Safaris — Supabase Database Schema & Row Level Security (RLS)
-- Paste this entire script into your Supabase SQL Editor and click "Run".
-- Every table enforces row ownership using auth.uid() with RLS enabled.
-- ============================================================================

-- Helper trigger function to automatically update updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 1. PROFILES (Authenticated user profile linked 1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'traveler' check (role in ('traveler', 'operator', 'admin')),
  name text not null default '',
  country text not null default 'United Kingdom',
  phone text,
  preferred_currency text not null default 'USD' check (preferred_currency in ('USD', 'EUR', 'GBP', 'KSH')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2. OPERATORS (Kenyan safari, hotel, and BnB operator business profiles)
-- ----------------------------------------------------------------------------
create table if not exists public.operators (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  business_name text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  categories text[] not null default array['safari'],
  regions text[] not null default array['Maasai Mara'],
  description text default '',
  licence_number text,
  licence_file_name text,
  business_registration_file_name text,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  is_profile_complete boolean not null default true,
  rejection_reason text,
  access_expires_at timestamptz,
  bidding_pass_expires_at timestamptz,
  contact_unlock_expires_at timestamptz,
  rating numeric(2,1) not null default 5.0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_operators_user_id on public.operators(user_id);
alter table public.operators enable row level security;

drop policy if exists "Users can view own operators" on public.operators;
drop policy if exists "Anyone can view operators" on public.operators;
create policy "Anyone can view operators"
  on public.operators for select
  using (true);

drop policy if exists "Users can insert own operators" on public.operators;
create policy "Users can insert own operators"
  on public.operators for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own operators" on public.operators;
create policy "Users can update own operators"
  on public.operators for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own operators" on public.operators;
create policy "Users can delete own operators"
  on public.operators for delete
  using (auth.uid() = user_id);

drop trigger if exists set_operators_updated_at on public.operators;
create trigger set_operators_updated_at
  before update on public.operators
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 3. TRAVEL REQUESTS (Custom safari, hotel, and BnB trip inquiries)
-- ----------------------------------------------------------------------------
create table if not exists public.travel_requests (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  traveler_id text not null,
  traveler_name text not null,
  traveler_country text not null default 'United Kingdom',
  title text not null,
  category text not null check (category in ('safari', 'hotel', 'bnb')),
  start_date text not null,
  end_date text not null,
  flexible_month text,
  adults integer not null default 2,
  children integer not null default 0,
  budget numeric not null,
  currency text not null default 'USD' check (currency in ('USD', 'EUR', 'GBP', 'KSH')),
  budget_usd numeric,
  notes text not null default '',
  safari_details jsonb,
  hotel_details jsonb,
  bnb_details jsonb,
  slot_limit integer not null default 30,
  unlock_limit integer not null default 30,
  unlocks_enabled boolean not null default true,
  bids_only boolean not null default false,
  status text not null default 'open' check (status in ('open', 'locked', 'closed', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  closed_reason text,
  whatsapp_number text,
  call_number text,
  email_address text,
  preferred_contact_method text check (preferred_contact_method in ('whatsapp', 'email', 'phone')),
  preferred_contact_methods text[],
  is_booked boolean not null default false,
  booked_operator_id text,
  booked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_travel_requests_user_id on public.travel_requests(user_id);
alter table public.travel_requests enable row level security;

drop policy if exists "Users can view own travel requests" on public.travel_requests;
drop policy if exists "Anyone can view travel requests" on public.travel_requests;
create policy "Anyone can view travel requests"
  on public.travel_requests for select
  using (true);

drop policy if exists "Users can insert own travel requests" on public.travel_requests;
create policy "Users can insert own travel requests"
  on public.travel_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own travel requests" on public.travel_requests;
create policy "Users can update own travel requests"
  on public.travel_requests for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own travel requests" on public.travel_requests;
create policy "Users can delete own travel requests"
  on public.travel_requests for delete
  using (auth.uid() = user_id);

drop trigger if exists set_travel_requests_updated_at on public.travel_requests;
create trigger set_travel_requests_updated_at
  before update on public.travel_requests
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 4. BIDS (Operator quotes and follow-up messages)
-- ----------------------------------------------------------------------------
create table if not exists public.bids (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  request_id text not null,
  operator_id text not null,
  operator_business_name text not null,
  operator_rating numeric(2,1) not null default 5.0,
  operator_review_count integer not null default 0,
  operator_verified boolean not null default true,
  price numeric not null,
  currency text not null default 'USD' check (currency in ('USD', 'EUR', 'GBP', 'KSH')),
  inclusions text[] not null default array[]::text[],
  message text not null default '',
  follow_ups jsonb not null default '[]'::jsonb,
  valid_until text not null,
  status text not null default 'sent' check (status in ('sent', 'viewed', 'shortlisted', 'contact_shared', 'declined')),
  operator_email text,
  operator_whatsapp text,
  operator_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bids_user_id on public.bids(user_id);
create index if not exists idx_bids_request_id on public.bids(request_id);
alter table public.bids enable row level security;

drop policy if exists "Users can view own bids" on public.bids;
drop policy if exists "Users can view own or received bids" on public.bids;
create policy "Users can view own or received bids"
  on public.bids for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.travel_requests tr
      where tr.id = bids.request_id and tr.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own bids" on public.bids;
create policy "Users can insert own bids"
  on public.bids for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own bids" on public.bids;
drop policy if exists "Users can update own or received bids" on public.bids;
create policy "Users can update own or received bids"
  on public.bids for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.travel_requests tr
      where tr.id = bids.request_id and tr.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.travel_requests tr
      where tr.id = bids.request_id and tr.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete own bids" on public.bids;
create policy "Users can delete own bids"
  on public.bids for delete
  using (auth.uid() = user_id);

drop trigger if exists set_bids_updated_at on public.bids;
create trigger set_bids_updated_at
  before update on public.bids
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 5. BOOKMARKS (Saved travel requests for operators)
-- ----------------------------------------------------------------------------
create table if not exists public.bookmarks (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  operator_id text not null,
  request_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, operator_id, request_id)
);

create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);
alter table public.bookmarks enable row level security;

drop policy if exists "Users can view own bookmarks" on public.bookmarks;
create policy "Users can view own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own bookmarks" on public.bookmarks;
create policy "Users can insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own bookmarks" on public.bookmarks;
create policy "Users can update own bookmarks"
  on public.bookmarks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own bookmarks" on public.bookmarks;
create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. CONTACT UNLOCKS (Unlocked traveler contact details)
-- ----------------------------------------------------------------------------
create table if not exists public.contact_unlocks (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  request_id text not null,
  operator_id text not null,
  tier text not null,
  fee_ksh numeric not null,
  status text not null default 'paid' check (status in ('held', 'paid', 'failed', 'refunded')),
  held_until timestamptz not null default now(),
  paid_at timestamptz,
  request_title text not null,
  request_category text not null check (request_category in ('safari', 'hotel', 'bnb')),
  traveler_country text,
  traveler_contact jsonb,
  mpesa_transaction_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_unlocks_user_id on public.contact_unlocks(user_id);
alter table public.contact_unlocks enable row level security;

drop policy if exists "Users can view own contact unlocks" on public.contact_unlocks;
create policy "Users can view own contact unlocks"
  on public.contact_unlocks for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own contact unlocks" on public.contact_unlocks;
create policy "Users can insert own contact unlocks"
  on public.contact_unlocks for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own contact unlocks" on public.contact_unlocks;
create policy "Users can update own contact unlocks"
  on public.contact_unlocks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own contact unlocks" on public.contact_unlocks;
create policy "Users can delete own contact unlocks"
  on public.contact_unlocks for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 7. PAYMENTS (M-Pesa 24-hour bidding passes and contact unlock payments)
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  operator_id text not null,
  operator_business_name text,
  type text check (type in ('pass', 'unlock')),
  pass_type text,
  request_id text,
  request_title text,
  amount numeric not null,
  currency text not null default 'KSH',
  mpesa_transaction_id text not null,
  phone_number text,
  status text not null default 'completed' check (status in ('paid', 'completed', 'failed')),
  failure_reason text,
  paid_at timestamptz not null default now(),
  pass_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_user_id on public.payments(user_id);
alter table public.payments enable row level security;

drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own payments" on public.payments;
create policy "Users can insert own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own payments" on public.payments;
create policy "Users can update own payments"
  on public.payments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own payments" on public.payments;
create policy "Users can delete own payments"
  on public.payments for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 8. REVIEWS (Traveler ratings and feedback for operators)
-- ----------------------------------------------------------------------------
create table if not exists public.reviews (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  operator_id text not null,
  traveler_id text not null,
  traveler_name text not null,
  traveler_country text not null,
  request_id text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  trip_type text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_user_id on public.reviews(user_id);
alter table public.reviews enable row level security;

drop policy if exists "Users can view own reviews" on public.reviews;
drop policy if exists "Anyone can view reviews" on public.reviews;
create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

drop policy if exists "Users can insert own reviews" on public.reviews;
create policy "Users can insert own reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own reviews" on public.reviews;
create policy "Users can update own reviews"
  on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reviews" on public.reviews;
create policy "Users can delete own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 9. BLOG POSTS (Kenya destination travel guides)
-- ----------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  slug text not null unique,
  title text not null,
  destination text not null,
  category text not null,
  image_url text not null,
  author_name text not null,
  author_role text not null,
  published_at timestamptz not null default now(),
  read_time text not null default '5 min read',
  excerpt text not null default '',
  content text not null default '',
  best_months text not null default '',
  estimated_budget_usd text not null default '',
  recommended_duration text not null default '',
  highlights text[] not null default array[]::text[],
  cta_prompt text,
  cta_button_label text,
  cta_category text check (cta_category in ('safari', 'hotel', 'bnb')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blog_posts_user_id on public.blog_posts(user_id);
alter table public.blog_posts enable row level security;

drop policy if exists "Users can view own blog posts" on public.blog_posts;
drop policy if exists "Anyone can view blog posts" on public.blog_posts;
create policy "Anyone can view blog posts"
  on public.blog_posts for select
  using (true);

drop policy if exists "Users can insert own blog posts" on public.blog_posts;
create policy "Users can insert own blog posts"
  on public.blog_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own blog posts" on public.blog_posts;
create policy "Users can update own blog posts"
  on public.blog_posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own blog posts" on public.blog_posts;
create policy "Users can delete own blog posts"
  on public.blog_posts for delete
  using (auth.uid() = user_id);

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 10. FLAGGED REPORTS (Trust & safety moderation reports)
-- ----------------------------------------------------------------------------
create table if not exists public.flagged_reports (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  reported_by_id text not null,
  reported_by_name text not null,
  target_type text not null check (target_type in ('operator', 'bid', 'request')),
  target_id text not null,
  target_title text not null,
  reason text not null,
  details text not null default '',
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_flagged_reports_user_id on public.flagged_reports(user_id);
alter table public.flagged_reports enable row level security;

drop policy if exists "Users can view own reports" on public.flagged_reports;
create policy "Users can view own reports"
  on public.flagged_reports for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own reports" on public.flagged_reports;
create policy "Users can insert own reports"
  on public.flagged_reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own reports" on public.flagged_reports;
create policy "Users can update own reports"
  on public.flagged_reports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reports" on public.flagged_reports;
create policy "Users can delete own reports"
  on public.flagged_reports for delete
  using (auth.uid() = user_id);

drop trigger if exists set_flagged_reports_updated_at on public.flagged_reports;
create trigger set_flagged_reports_updated_at
  before update on public.flagged_reports
  for each row execute function public.handle_updated_at();
