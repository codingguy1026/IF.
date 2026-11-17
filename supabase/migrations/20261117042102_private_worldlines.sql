create table public.if_worlds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  description text not null check (char_length(btrim(description)) between 1 and 300),
  start text not null check (char_length(btrim(start)) between 1 and 80),
  rules text not null check (char_length(btrim(rules)) between 1 and 1500),
  policy text not null check (policy in ('OPEN', 'REVIEW', 'INVITE ONLY', 'SOLO')),
  created_at timestamptz not null default now()
);

create table public.if_world_years (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.if_worlds (id) on delete cascade,
  year text not null check (char_length(btrim(year)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (world_id, id),
  unique (world_id, year)
);

create table public.if_world_forks (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.if_worlds (id) on delete cascade,
  -- A null year points to the world's starting date.
  from_year_id uuid,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  premise text not null check (char_length(btrim(premise)) between 1 and 500),
  created_at timestamptz not null default now(),
  foreign key (world_id, from_year_id) references public.if_world_years (world_id, id) on delete cascade
);

create index if_worlds_owner_created_idx on public.if_worlds (owner_id, created_at desc);
create index if_world_years_world_created_idx on public.if_world_years (world_id, created_at, id);
create index if_world_forks_world_created_idx on public.if_world_forks (world_id, created_at, id);
create index if_world_forks_from_year_idx on public.if_world_forks (world_id, from_year_id);

alter table public.if_worlds enable row level security;
alter table public.if_world_years enable row level security;
alter table public.if_world_forks enable row level security;

revoke all on public.if_worlds, public.if_world_years, public.if_world_forks from public, anon, authenticated;
grant select, insert on public.if_worlds, public.if_world_years, public.if_world_forks to authenticated;

create policy if_worlds_owner_select on public.if_worlds
  for select to authenticated using (owner_id = (select auth.uid()));
create policy if_worlds_owner_insert on public.if_worlds
  for insert to authenticated with check (owner_id = (select auth.uid()));

create policy if_world_years_owner_select on public.if_world_years
  for select to authenticated using (
    exists (select 1 from public.if_worlds where id = if_world_years.world_id and owner_id = (select auth.uid()))
  );
create policy if_world_years_owner_insert on public.if_world_years
  for insert to authenticated with check (
    exists (select 1 from public.if_worlds where id = if_world_years.world_id and owner_id = (select auth.uid()))
  );

create policy if_world_forks_owner_select on public.if_world_forks
  for select to authenticated using (
    exists (select 1 from public.if_worlds where id = if_world_forks.world_id and owner_id = (select auth.uid()))
  );
create policy if_world_forks_owner_insert on public.if_world_forks
  for insert to authenticated with check (
    exists (select 1 from public.if_worlds where id = if_world_forks.world_id and owner_id = (select auth.uid()))
  );
