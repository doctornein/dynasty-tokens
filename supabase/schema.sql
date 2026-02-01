-- Dynasty Tokens — Supabase Schema
-- Run this in the Supabase SQL Editor

-- ============================================================
-- 1. TABLES
-- ============================================================

-- profiles — extends auth.users
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  header_url text,
  bio text,
  social_twitter text,
  social_instagram text,
  social_youtube text,
  balance numeric not null default 300,
  packs_opened int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case-insensitive uniqueness on username
create unique index profiles_username_ci on public.profiles (lower(username));

-- owned_cards — replaces localStorage collection
create table public.owned_cards (
  instance_id text primary key,
  user_id uuid not null references public.profiles on delete cascade,
  player_id text not null,
  pack_id text not null,
  acquired_at timestamptz not null default now()
);

create index owned_cards_user_id on public.owned_cards (user_id);

-- transactions — replaces localStorage transactions
create table public.transactions (
  id text primary key,
  user_id uuid not null references public.profiles on delete cascade,
  type text not null,
  description text not null,
  amount numeric not null,
  pack_id text,
  created_at timestamptz not null default now()
);

create index transactions_user_id on public.transactions (user_id, created_at desc);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.owned_cards enable row level security;
alter table public.transactions enable row level security;

-- profiles: anyone can read (public pages), users update/insert own only
create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- owned_cards: anyone can read (public collections), insert own only
create policy "owned_cards_select" on public.owned_cards
  for select using (true);

create policy "owned_cards_insert" on public.owned_cards
  for insert with check (auth.uid() = user_id);

-- transactions: read/insert own only
create policy "transactions_select" on public.transactions
  for select using (auth.uid() = user_id);

create policy "transactions_insert" on public.transactions
  for insert with check (auth.uid() = user_id);

-- ============================================================
-- 3. STORAGE
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder
create policy "avatars_auth_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own files
create policy "avatars_auth_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
create policy "avatars_auth_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 4. DATABASE FUNCTIONS
-- ============================================================

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      'user_' || substr(new.id::text, 1, 8)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      'New Player'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      null
    )
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Atomic pack purchase
create or replace function public.purchase_pack(
  p_pack_id text,
  p_pack_name text,
  p_price numeric,
  p_cards jsonb -- array of {instance_id, player_id}
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_balance numeric;
  v_tx_id text;
  v_card jsonb;
begin
  -- Lock the profile row and check balance
  select balance into v_balance
  from public.profiles
  where id = auth.uid()
  for update;

  if v_balance is null then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  if v_balance < p_price then
    return jsonb_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  -- Deduct balance and increment packs_opened
  update public.profiles
  set balance = balance - p_price,
      packs_opened = packs_opened + 1,
      updated_at = now()
  where id = auth.uid();

  -- Insert cards
  for v_card in select * from jsonb_array_elements(p_cards)
  loop
    insert into public.owned_cards (instance_id, user_id, player_id, pack_id, acquired_at)
    values (
      v_card ->> 'instance_id',
      auth.uid(),
      v_card ->> 'player_id',
      p_pack_id,
      now()
    );
  end loop;

  -- Insert transaction
  v_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.transactions (id, user_id, type, description, amount, pack_id, created_at)
  values (v_tx_id, auth.uid(), 'pack_purchase', 'Purchased: ' || p_pack_name, -p_price, p_pack_id, now());

  return jsonb_build_object('success', true, 'transaction_id', v_tx_id);
end;
$$;

-- Add balance (for reward redemptions)
create or replace function public.add_balance(
  p_amount numeric,
  p_description text,
  p_type text default 'reward_redeem'
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_tx_id text;
  v_new_balance numeric;
begin
  update public.profiles
  set balance = balance + p_amount,
      updated_at = now()
  where id = auth.uid()
  returning balance into v_new_balance;

  if v_new_balance is null then
    return jsonb_build_object('success', false, 'error', 'Profile not found');
  end if;

  v_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.transactions (id, user_id, type, description, amount, created_at)
  values (v_tx_id, auth.uid(), p_type, p_description, p_amount, now());

  return jsonb_build_object('success', true, 'new_balance', v_new_balance, 'transaction_id', v_tx_id);
end;
$$;

-- ============================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
