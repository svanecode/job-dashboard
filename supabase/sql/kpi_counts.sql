-- Run this in Supabase SQL editor
-- Create the KPI function using CASE statements
create or replace function public.kpi_counts()
returns table (urgent int, high int, low int, total int)
language sql
stable
as $$
  select
    count(CASE WHEN cfo_score = 3 AND deleted_at IS NULL THEN 1 END) as urgent,
    count(CASE WHEN cfo_score = 2 AND deleted_at IS NULL THEN 1 END) as high,
    count(CASE WHEN cfo_score = 1 AND deleted_at IS NULL THEN 1 END) as low,
    count(CASE WHEN deleted_at IS NULL THEN 1 END) as total
  from jobs;
$$;

grant execute on function public.kpi_counts() to anon, authenticated; 