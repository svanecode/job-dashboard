-- RPC to upsert a weekly insight with items atomically (RLS enforced; runs as INVOKER)
create or replace function public.upsert_weekly_insight_with_items(
  p_week_year int,
  p_week_number int,
  p_title text,
  p_intro text,
  p_published_at timestamptz,
  p_items jsonb,
  p_slug text default null,
  p_tags text[] default null,
  p_hero_image_url text default null,
  p_is_featured boolean default null
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
  v_len int;
  v_idx int;
  v_item jsonb;
  v_highlights text[];
  v_item_id uuid;
  v_jobs_len int;
  v_jobs_idx int;
  v_job_id int;
begin
  -- Upsert weekly_insights on (week_year, week_number)
  insert into public.weekly_insights (week_year, week_number, title, intro, published_at, slug, tags, hero_image_url, is_featured)
  values (p_week_year, p_week_number, p_title, p_intro, p_published_at, p_slug, p_tags, p_hero_image_url, coalesce(p_is_featured, false))
  on conflict (week_year, week_number)
  do update set
    title = excluded.title,
    intro = excluded.intro,
    published_at = coalesce(excluded.published_at, public.weekly_insights.published_at),
    slug = coalesce(excluded.slug, public.weekly_insights.slug),
    tags = coalesce(excluded.tags, public.weekly_insights.tags),
    hero_image_url = coalesce(excluded.hero_image_url, public.weekly_insights.hero_image_url),
    is_featured = coalesce(excluded.is_featured, public.weekly_insights.is_featured),
    updated_at = now()
  returning id into v_id;

  -- Replace items for this insight
  delete from public.weekly_insight_items where insight_id = v_id;

  if p_items is not null then
    v_len := jsonb_array_length(p_items);
    v_idx := 0;
    while v_idx < v_len loop
      v_item := p_items->v_idx;
      -- Extract highlights as text[]
      select coalesce(array_agg(value::text), '{}')
      into v_highlights
      from jsonb_array_elements_text(coalesce(v_item->'highlights', '[]'::jsonb)) as t(value);

      insert into public.weekly_insight_items (
        insight_id, position, company, summary, highlights
      ) values (
        v_id,
        v_idx + 1,
        v_item->>'company',
        v_item->>'summary',
        v_highlights
      ) returning id into v_item_id;

      -- Optional embedded job ids mapping
      if (v_item ? 'job_ids') then
        v_jobs_len := jsonb_array_length(coalesce(v_item->'job_ids', '[]'::jsonb));
        v_jobs_idx := 0;
        while v_jobs_idx < v_jobs_len loop
          v_job_id := (v_item->'job_ids'->>v_jobs_idx)::int;
          if v_job_id is not null then
            insert into public.weekly_insight_item_jobs (insight_item_id, job_id, position)
            values (v_item_id, v_job_id, v_jobs_idx + 1);
          end if;
          v_jobs_idx := v_jobs_idx + 1;
        end loop;
      end if;

      v_idx := v_idx + 1;
    end loop;
  end if;

  return v_id;
end;
$$;

