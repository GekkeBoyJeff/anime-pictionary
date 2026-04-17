-- Anime Pictionary — custom hints table
-- Run via Supabase MCP execute_sql or `supabase db push`.

create type anime_category as enum ('Klassieker', 'Modern', 'Nieuwe Hype');

create table public.custom_anime_hints (
  id          uuid primary key default gen_random_uuid(),
  mal_id      integer unique not null,
  title       text not null,
  image_url   text,
  categorie   anime_category not null,
  hint_1      text not null,
  hint_2      text not null,
  hint_3      text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_custom_hints_categorie on public.custom_anime_hints (categorie);

-- RLS
alter table public.custom_anime_hints enable row level security;

create policy "public can read hints"
  on public.custom_anime_hints
  for select
  using (true);

create policy "authenticated users can write hints"
  on public.custom_anime_hints
  for all
  to authenticated
  using (true)
  with check (true);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger custom_anime_hints_set_updated_at
  before update on public.custom_anime_hints
  for each row
  execute function public.set_updated_at();
