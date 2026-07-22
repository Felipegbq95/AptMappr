-- ===========================================================================
-- AptMappr database schema
--
-- Paste this into the Supabase SQL editor (Dashboard → SQL → New query → Run).
-- It creates the apartments table and locks every row down so each signed-in
-- user can only ever see and edit their own apartments (row-level security).
-- ===========================================================================

create extension if not exists "pgcrypto";

create table if not exists public.apartments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  title          text not null default '',
  address        text not null default '',
  lat            double precision not null default 0,
  lng            double precision not null default 0,
  status         text not null default 'lead',
  price          numeric,
  posting_url    text not null default '',
  whatsapp       text not null default '',
  notes          text not null default '',
  appointment_at timestamptz,
  bedrooms       integer,
  size_sqm       numeric,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists apartments_user_id_idx on public.apartments (user_id);

-- Keep updated_at fresh on every write.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists apartments_set_updated_at on public.apartments;
create trigger apartments_set_updated_at
  before update on public.apartments
  for each row execute function public.set_updated_at();

-- --- Row Level Security ----------------------------------------------------
alter table public.apartments enable row level security;

drop policy if exists "own apartments – select" on public.apartments;
create policy "own apartments – select"
  on public.apartments for select
  using (auth.uid() = user_id);

drop policy if exists "own apartments – insert" on public.apartments;
create policy "own apartments – insert"
  on public.apartments for insert
  with check (auth.uid() = user_id);

drop policy if exists "own apartments – update" on public.apartments;
create policy "own apartments – update"
  on public.apartments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own apartments – delete" on public.apartments;
create policy "own apartments – delete"
  on public.apartments for delete
  using (auth.uid() = user_id);
