-- Table for Insights newsletter subscribers
create table if not exists public.insights_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Basic RLS
alter table public.insights_subscribers enable row level security;

-- Allow anonymous inserts (newsletter signups)
drop policy if exists insights_subscribers_insert on public.insights_subscribers;
create policy insights_subscribers_insert on public.insights_subscribers
  for insert to anon, authenticated
  with check (true);

-- Disallow selects by default; add admin-only policies separately if needed

