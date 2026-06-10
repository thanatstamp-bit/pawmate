-- =============================================================
-- PawMate — initial schema
-- Run this in the Supabase Dashboard SQL Editor (or supabase db push).
-- Creates all tables, indexes, RLS policies, and enables realtime
-- on messages for the chat feature.
-- =============================================================

-- -------------------------------------------------------------
-- profiles: one row per auth user (id mirrors auth.users.id)
-- -------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  line_id text,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------
-- pets: one pet per account (enforced in UI, not here)
-- -------------------------------------------------------------
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  species text not null check (species in ('dog', 'cat')),
  breed text not null,
  sex text not null check (sex in ('male', 'female')),
  birth_month date not null,
  photos text[] not null default '{}',
  personality_tags text[] not null default '{}',
  province text not null,
  district text,
  modes text[] not null default '{playdate}'
    check (modes <@ array['playdate', 'breeding'] and array_length(modes, 1) >= 1),
  vaccinated boolean,
  neutered boolean,
  bio text,
  created_at timestamptz not null default now()
);

create index pets_owner_id_idx on public.pets (owner_id);
create index pets_species_province_idx on public.pets (species, province);

-- -------------------------------------------------------------
-- likes: directional swipe-right; mutual likes become a match
-- -------------------------------------------------------------
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  from_pet_id uuid not null references public.pets (id) on delete cascade,
  to_pet_id uuid not null references public.pets (id) on delete cascade,
  mode text not null check (mode in ('playdate', 'breeding')),
  created_at timestamptz not null default now(),
  constraint likes_no_self check (from_pet_id <> to_pet_id),
  constraint likes_unique unique (from_pet_id, to_pet_id, mode)
);

create index likes_to_pet_id_idx on public.likes (to_pet_id, mode);

-- -------------------------------------------------------------
-- matches: created when likes exist in both directions, same mode
-- -------------------------------------------------------------
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  pet_a_id uuid not null references public.pets (id) on delete cascade,
  pet_b_id uuid not null references public.pets (id) on delete cascade,
  mode text not null check (mode in ('playdate', 'breeding')),
  created_at timestamptz not null default now(),
  constraint matches_no_self check (pet_a_id <> pet_b_id),
  -- least/greatest ordering prevents duplicate (A,B) / (B,A) matches
  constraint matches_unique unique (pet_a_id, pet_b_id, mode)
);

create index matches_pet_a_idx on public.matches (pet_a_id);
create index matches_pet_b_idx on public.matches (pet_b_id);

-- -------------------------------------------------------------
-- messages: chat inside a match
-- -------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_pet_id uuid not null references public.pets (id) on delete cascade,
  content text not null check (length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_match_id_idx on public.messages (match_id, created_at);

-- =============================================================
-- Row Level Security
-- Principle: anyone signed in can READ pets/profiles (needed for
-- the swipe feed); users can only WRITE rows that belong to them
-- (ownership flows through pets.owner_id = auth.uid()).
-- =============================================================

-- Helper: does the current user own this pet?
create or replace function public.owns_pet(pet_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.pets
    where id = pet_id and owner_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

-- profiles ----------------------------------------------------
create policy "profiles are readable by signed-in users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

create policy "users can delete their own profile"
  on public.profiles for delete
  to authenticated
  using (id = auth.uid());

-- pets --------------------------------------------------------
create policy "pets are readable by signed-in users"
  on public.pets for select
  to authenticated
  using (true);

create policy "users can insert their own pet"
  on public.pets for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "users can update their own pet"
  on public.pets for update
  to authenticated
  using (owner_id = auth.uid());

create policy "users can delete their own pet"
  on public.pets for delete
  to authenticated
  using (owner_id = auth.uid());

-- likes -------------------------------------------------------
-- Readable when the user's pet is on either side: the receiver
-- side is needed for the mutual-like check on swipe.
create policy "likes involving my pet are readable"
  on public.likes for select
  to authenticated
  using (public.owns_pet(from_pet_id) or public.owns_pet(to_pet_id));

create policy "users can like from their own pet"
  on public.likes for insert
  to authenticated
  with check (public.owns_pet(from_pet_id));

create policy "users can remove their own likes"
  on public.likes for delete
  to authenticated
  using (public.owns_pet(from_pet_id));

-- matches -----------------------------------------------------
create policy "matches involving my pet are readable"
  on public.matches for select
  to authenticated
  using (public.owns_pet(pet_a_id) or public.owns_pet(pet_b_id));

-- The client creates the match right after detecting a mutual like,
-- so the inserting user must own one side of it.
create policy "users can create matches involving their pet"
  on public.matches for insert
  to authenticated
  with check (public.owns_pet(pet_a_id) or public.owns_pet(pet_b_id));

create policy "users can delete matches involving their pet"
  on public.matches for delete
  to authenticated
  using (public.owns_pet(pet_a_id) or public.owns_pet(pet_b_id));

-- messages ----------------------------------------------------
-- Helper: is the current user's pet part of this match?
create or replace function public.is_in_match(p_match_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.matches m
    join public.pets p on p.id in (m.pet_a_id, m.pet_b_id)
    where m.id = p_match_id and p.owner_id = auth.uid()
  );
$$;

create policy "messages in my matches are readable"
  on public.messages for select
  to authenticated
  using (public.is_in_match(match_id));

create policy "users can send messages as their pet in their matches"
  on public.messages for insert
  to authenticated
  with check (public.owns_pet(sender_pet_id) and public.is_in_match(match_id));

-- =============================================================
-- Realtime: broadcast new messages for live chat (Phase 4)
-- =============================================================
alter publication supabase_realtime add table public.messages;
