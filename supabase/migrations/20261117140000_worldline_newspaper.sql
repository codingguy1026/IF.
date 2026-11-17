-- Main worldline = null fork_id; point of origin = null year_id.
-- Both are scoped by the stable world UUID, never by a display name/date.
alter table public.if_world_forks add constraint if_world_forks_world_id_id_key unique (world_id, id);

create table public.if_newspaper_articles (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.if_worlds (id) on delete cascade,
  fork_id uuid,
  year_id uuid,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  newspaper_name text not null check (char_length(btrim(newspaper_name)) between 1 and 100),
  -- Text deliberately supports fictional calendars, eras, and year-only dates.
  published_on text not null check (char_length(btrim(published_on)) between 1 and 80),
  headline text not null check (char_length(btrim(headline)) between 1 and 240),
  body text not null check (char_length(btrim(body)) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (world_id, fork_id) references public.if_world_forks (world_id, id) on delete cascade,
  foreign key (world_id, year_id) references public.if_world_years (world_id, id) on delete cascade,
  -- PostgreSQL 15+: null sentinels also participate in the one-article rule.
  unique nulls not distinct (world_id, fork_id, year_id)
);

create function public.if_newspaper_touch_updated_at() returns trigger
  language plpgsql set search_path = public as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

create trigger if_newspaper_touch_updated_at before update on public.if_newspaper_articles
  for each row execute function public.if_newspaper_touch_updated_at();

alter table public.if_newspaper_articles enable row level security;
revoke all on public.if_newspaper_articles from public, anon, authenticated;
grant select, insert on public.if_newspaper_articles to authenticated;
-- Article relationships, author, and creation timestamp stay immutable.
grant update (newspaper_name, published_on, headline, body) on public.if_newspaper_articles to authenticated;

create policy if_newspaper_owner_select on public.if_newspaper_articles
  for select to authenticated using (
    exists (select 1 from public.if_worlds where id = if_newspaper_articles.world_id and owner_id = (select auth.uid()))
  );
create policy if_newspaper_author_insert on public.if_newspaper_articles
  for insert to authenticated with check (
    author_id = (select auth.uid()) and
    exists (select 1 from public.if_worlds where id = if_newspaper_articles.world_id and owner_id = (select auth.uid()))
  );
create policy if_newspaper_author_update on public.if_newspaper_articles
  for update to authenticated using (
    author_id = (select auth.uid()) and
    exists (select 1 from public.if_worlds where id = if_newspaper_articles.world_id and owner_id = (select auth.uid()))
  ) with check (
    author_id = (select auth.uid()) and
    exists (select 1 from public.if_worlds where id = if_newspaper_articles.world_id and owner_id = (select auth.uid()))
  );
