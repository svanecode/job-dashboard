-- Weekly Insights schema with RLS and public view

-- Helper: admin check
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

-- Main insight table (one per week)
create table if not exists public.weekly_insights (
  id uuid primary key default gen_random_uuid(),
  week_year int not null,
  week_number int not null check (week_number between 1 and 53),
  title text not null,
  intro text,
  published_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_year, week_number)
);

-- CMS-style optional fields
alter table public.weekly_insights add column if not exists slug text unique;
alter table public.weekly_insights add column if not exists hero_image_url text;
alter table public.weekly_insights add column if not exists tags text[] default '{}';
alter table public.weekly_insights add column if not exists is_featured boolean default false;
alter table public.weekly_insights add column if not exists updated_by uuid references public.users(id) on delete set null;

-- Items under each weekly insight
create table if not exists public.weekly_insight_items (
  id uuid primary key default gen_random_uuid(),
  insight_id uuid not null references public.weekly_insights(id) on delete cascade,
  position int not null default 0,
  company text not null,
  summary text not null,
  highlights text[] default '{}', -- bullet points like job titles
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optional relation to a concrete job record
alter table public.weekly_insight_items add column if not exists related_job_id int references public.jobs(id);

-- Many-to-many mapping for items to multiple jobs (for clickable embeds)
create table if not exists public.weekly_insight_item_jobs (
  id uuid primary key default gen_random_uuid(),
  insight_item_id uuid not null references public.weekly_insight_items(id) on delete cascade,
  job_id int not null references public.jobs(id),
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.weekly_insight_item_jobs enable row level security;

drop policy if exists weekly_insight_item_jobs_select_public on public.weekly_insight_item_jobs;
create policy weekly_insight_item_jobs_select_public on public.weekly_insight_item_jobs
  for select to anon, authenticated using (
    exists (
      select 1 from public.weekly_insight_items i
      join public.weekly_insights w on w.id = i.insight_id
      where i.id = weekly_insight_item_jobs.insight_item_id and w.published_at is not null
    )
  );

drop policy if exists weekly_insight_item_jobs_write_admin on public.weekly_insight_item_jobs;
create policy weekly_insight_item_jobs_write_admin on public.weekly_insight_item_jobs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Indexes
create index if not exists idx_weekly_insights_published on public.weekly_insights(published_at desc);
create index if not exists idx_weekly_insight_items_insight on public.weekly_insight_items(insight_id, position);

-- Update triggers (idempotent)
drop trigger if exists trg_weekly_insights_updated_at on public.weekly_insights;
create trigger trg_weekly_insights_updated_at
before update on public.weekly_insights
for each row execute function public.update_updated_at_column();

drop trigger if exists trg_weekly_insight_items_updated_at on public.weekly_insight_items;
create trigger trg_weekly_insight_items_updated_at
before update on public.weekly_insight_items
for each row execute function public.update_updated_at_column();

-- RLS
alter table public.weekly_insights enable row level security;
alter table public.weekly_insight_items enable row level security;

-- Public can read only published insights
drop policy if exists weekly_insights_select_public on public.weekly_insights;
create policy weekly_insights_select_public on public.weekly_insights
  for select to anon, authenticated using (published_at is not null);

-- Admins can read all
drop policy if exists weekly_insights_select_admin on public.weekly_insights;
create policy weekly_insights_select_admin on public.weekly_insights
  for select to authenticated using (public.is_admin());

-- Admins can write
drop policy if exists weekly_insights_write_admin on public.weekly_insights;
create policy weekly_insights_write_admin on public.weekly_insights
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Items: public can read items of published insights only
drop policy if exists weekly_insight_items_select_public on public.weekly_insight_items;
create policy weekly_insight_items_select_public on public.weekly_insight_items
  for select to anon, authenticated using (
    exists (
      select 1 from public.weekly_insights w
      where w.id = weekly_insight_items.insight_id and w.published_at is not null
    )
  );

-- Items: admin can write
drop policy if exists weekly_insight_items_write_admin on public.weekly_insight_items;
create policy weekly_insight_items_write_admin on public.weekly_insight_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- View: published insights with embedded items (as JSON)
create or replace view public.weekly_insights_public as
select
  w.id,
  w.week_year,
  w.week_number,
  w.title,
  coalesce(w.intro, '') as intro,
  w.published_at,
  coalesce(
    jsonb_agg(
      (
        jsonb_build_object(
          'id', i.id,
          'company', i.company,
          'summary', i.summary,
          'highlights', i.highlights,
          'position', i.position
        ) || jsonb_build_object(
          'job_ids', coalesce(
            (select jsonb_agg(ij.job_id order by ij.position asc)
             from public.weekly_insight_item_jobs ij
             where ij.insight_item_id = i.id),
            '[]'::jsonb
          )
        )
      )
      order by i.position asc
    ) filter (where i.id is not null),
    '[]'::jsonb
  ) as items
from public.weekly_insights w
left join public.weekly_insight_items i on i.insight_id = w.id
where w.published_at is not null
group by w.id
order by w.published_at desc;

-- Revisions table for CMS history
create table if not exists public.weekly_insight_revisions (
  id uuid primary key default gen_random_uuid(),
  insight_id uuid not null references public.weekly_insights(id) on delete cascade,
  snapshot jsonb not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.weekly_insight_revisions enable row level security;

drop policy if exists weekly_insight_revisions_select on public.weekly_insight_revisions;
create policy weekly_insight_revisions_select on public.weekly_insight_revisions
  for select to authenticated using (public.is_admin());

drop policy if exists weekly_insight_revisions_write on public.weekly_insight_revisions;
create policy weekly_insight_revisions_write on public.weekly_insight_revisions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

