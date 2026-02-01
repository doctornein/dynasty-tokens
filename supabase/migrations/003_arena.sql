-- Dynasty Tokens — Arena (Fantasy Matchups) Migration
-- Run this in the Supabase SQL Editor after 002_auctions.sql

-- ============================================================
-- 1. TABLE
-- ============================================================

create table public.arena_matches (
  id text primary key,
  game_type text not null check (game_type in ('1v1', '3v3', '5v5')),
  stat_categories text[] not null,
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  wager numeric not null check (wager >= 5),
  challenger_id uuid not null references public.profiles on delete cascade,
  opponent_id uuid references public.profiles on delete cascade,
  invited_username text,
  status text not null default 'open'
    check (status in ('open', 'matched', 'settled', 'voided', 'cancelled')),
  challenger_cards text[] not null,
  opponent_cards text[],
  challenger_score numeric,
  opponent_score numeric,
  winner_id uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  settled_at timestamptz,

  -- Card count must match game type
  constraint arena_challenger_card_count check (
    (game_type = '1v1' and array_length(challenger_cards, 1) = 1) or
    (game_type = '3v3' and array_length(challenger_cards, 1) = 3) or
    (game_type = '5v5' and array_length(challenger_cards, 1) = 5)
  )
);

create index arena_status_end on public.arena_matches (status, end_date);
create index arena_challenger on public.arena_matches (challenger_id);
create index arena_opponent on public.arena_matches (opponent_id);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

alter table public.arena_matches enable row level security;

-- Public read
create policy "arena_matches_select" on public.arena_matches
  for select using (true);

-- All mutations through security definer RPCs only

-- ============================================================
-- 3. RPC FUNCTIONS
-- ============================================================

-- 3a. create_arena_match
create or replace function public.create_arena_match(
  p_game_type text,
  p_stat_categories text[],
  p_start_date date,
  p_end_date date,
  p_wager numeric,
  p_cards text[],
  p_invited_username text default null
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_balance numeric;
  v_match_id text;
  v_tx_id text;
  v_expected_count int;
  v_invited_id uuid;
  v_cat text;
  v_card text;
  v_valid_cats text[] := array['PTS','REB','AST','STL','BLK'];
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  -- Validate game type and card count
  if p_game_type = '1v1' then v_expected_count := 1;
  elsif p_game_type = '3v3' then v_expected_count := 3;
  elsif p_game_type = '5v5' then v_expected_count := 5;
  else
    return jsonb_build_object('success', false, 'error', 'Invalid game type');
  end if;

  if array_length(p_cards, 1) is null or array_length(p_cards, 1) != v_expected_count then
    return jsonb_build_object('success', false, 'error', 'Card count must be ' || v_expected_count);
  end if;

  -- Check for duplicate players in lineup
  if (select count(distinct c) from unnest(p_cards) c) != array_length(p_cards, 1) then
    return jsonb_build_object('success', false, 'error', 'Duplicate players in lineup');
  end if;

  -- Validate stat categories (1-5 valid categories)
  if array_length(p_stat_categories, 1) is null or array_length(p_stat_categories, 1) < 1 then
    return jsonb_build_object('success', false, 'error', 'At least one stat category required');
  end if;

  foreach v_cat in array p_stat_categories loop
    if not (v_cat = any(v_valid_cats)) then
      return jsonb_build_object('success', false, 'error', 'Invalid stat category: ' || v_cat);
    end if;
  end loop;

  -- Validate dates
  if p_start_date < current_date then
    return jsonb_build_object('success', false, 'error', 'Start date cannot be in the past');
  end if;

  if p_end_date < p_start_date then
    return jsonb_build_object('success', false, 'error', 'End date must be on or after start date');
  end if;

  -- Validate wager
  if p_wager < 5 then
    return jsonb_build_object('success', false, 'error', 'Minimum wager is 5 DT');
  end if;

  -- Verify ownership of each player card
  foreach v_card in array p_cards loop
    if not exists (
      select 1 from public.owned_cards
      where user_id = v_uid and player_id = v_card
    ) then
      return jsonb_build_object('success', false, 'error', 'You do not own a card for player ' || v_card);
    end if;
  end loop;

  -- Resolve invited username if provided
  if p_invited_username is not null and p_invited_username != '' then
    select id into v_invited_id
    from public.profiles
    where lower(username) = lower(p_invited_username);

    if v_invited_id is null then
      return jsonb_build_object('success', false, 'error', 'User not found: ' || p_invited_username);
    end if;

    if v_invited_id = v_uid then
      return jsonb_build_object('success', false, 'error', 'Cannot challenge yourself');
    end if;
  end if;

  -- Check balance and escrow wager (lock profile)
  select balance into v_balance
  from public.profiles
  where id = v_uid
  for update;

  if v_balance is null or v_balance < p_wager then
    return jsonb_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  -- Deduct wager
  update public.profiles
  set balance = balance - p_wager, updated_at = now()
  where id = v_uid;

  -- Generate IDs
  v_match_id := 'arena-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);
  v_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

  -- Record transaction
  insert into public.transactions (id, user_id, type, description, amount, created_at)
  values (v_tx_id, v_uid, 'arena_wager', 'Arena wager: ' || p_game_type || ' match', -p_wager, now());

  -- Insert match
  insert into public.arena_matches (
    id, game_type, stat_categories, start_date, end_date, wager,
    challenger_id, invited_username, status, challenger_cards, created_at
  ) values (
    v_match_id, p_game_type, p_stat_categories, p_start_date, p_end_date, p_wager,
    v_uid, p_invited_username, 'open', p_cards, now()
  );

  return jsonb_build_object('success', true, 'match_id', v_match_id);
end;
$$;

-- 3b. accept_arena_match
create or replace function public.accept_arena_match(
  p_match_id text,
  p_cards text[]
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_match record;
  v_balance numeric;
  v_tx_id text;
  v_expected_count int;
  v_card text;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  -- Lock and fetch match
  select * into v_match
  from public.arena_matches
  where id = p_match_id
  for update;

  if v_match is null then
    return jsonb_build_object('success', false, 'error', 'Match not found');
  end if;

  if v_match.status != 'open' then
    return jsonb_build_object('success', false, 'error', 'Match is not open');
  end if;

  if v_match.challenger_id = v_uid then
    return jsonb_build_object('success', false, 'error', 'Cannot accept your own challenge');
  end if;

  -- Check invite restriction
  if v_match.invited_username is not null then
    if not exists (
      select 1 from public.profiles
      where id = v_uid and lower(username) = lower(v_match.invited_username)
    ) then
      return jsonb_build_object('success', false, 'error', 'This challenge is for a specific player');
    end if;
  end if;

  -- Validate card count
  if v_match.game_type = '1v1' then v_expected_count := 1;
  elsif v_match.game_type = '3v3' then v_expected_count := 3;
  else v_expected_count := 5;
  end if;

  if array_length(p_cards, 1) is null or array_length(p_cards, 1) != v_expected_count then
    return jsonb_build_object('success', false, 'error', 'Card count must be ' || v_expected_count);
  end if;

  -- Check for duplicate players in lineup
  if (select count(distinct c) from unnest(p_cards) c) != array_length(p_cards, 1) then
    return jsonb_build_object('success', false, 'error', 'Duplicate players in lineup');
  end if;

  -- Verify ownership of each player card
  foreach v_card in array p_cards loop
    if not exists (
      select 1 from public.owned_cards
      where user_id = v_uid and player_id = v_card
    ) then
      return jsonb_build_object('success', false, 'error', 'You do not own a card for player ' || v_card);
    end if;
  end loop;

  -- Check balance and escrow wager (lock profile)
  select balance into v_balance
  from public.profiles
  where id = v_uid
  for update;

  if v_balance is null or v_balance < v_match.wager then
    return jsonb_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  -- Deduct wager
  update public.profiles
  set balance = balance - v_match.wager, updated_at = now()
  where id = v_uid;

  v_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.transactions (id, user_id, type, description, amount, created_at)
  values (v_tx_id, v_uid, 'arena_wager', 'Arena wager accepted: ' || p_match_id, -v_match.wager, now());

  -- Update match
  update public.arena_matches
  set opponent_id = v_uid,
      opponent_cards = p_cards,
      status = 'matched',
      accepted_at = now()
  where id = p_match_id;

  return jsonb_build_object('success', true);
end;
$$;

-- 3c. cancel_arena_match
create or replace function public.cancel_arena_match(
  p_match_id text
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_match record;
  v_tx_id text;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  -- Lock and fetch match
  select * into v_match
  from public.arena_matches
  where id = p_match_id
  for update;

  if v_match is null then
    return jsonb_build_object('success', false, 'error', 'Match not found');
  end if;

  if v_match.challenger_id != v_uid then
    return jsonb_build_object('success', false, 'error', 'Only the challenger can cancel');
  end if;

  if v_match.status != 'open' then
    return jsonb_build_object('success', false, 'error', 'Match is not open');
  end if;

  -- Refund wager
  update public.profiles
  set balance = balance + v_match.wager, updated_at = now()
  where id = v_uid;

  v_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.transactions (id, user_id, type, description, amount, created_at)
  values (v_tx_id, v_uid, 'arena_refund', 'Arena cancel refund: ' || p_match_id, v_match.wager, now());

  -- Cancel match
  update public.arena_matches
  set status = 'cancelled'
  where id = p_match_id;

  return jsonb_build_object('success', true);
end;
$$;

-- 3d. settle_arena_match (called by settlement API, no auth.uid())
create or replace function public.settle_arena_match(
  p_match_id text,
  p_challenger_score numeric,
  p_opponent_score numeric,
  p_voided boolean default false
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_match record;
  v_winner_id uuid;
  v_pot numeric;
  v_tx_id text;
  v_tx_id2 text;
begin
  -- Lock and fetch match
  select * into v_match
  from public.arena_matches
  where id = p_match_id
  for update;

  if v_match is null then
    return jsonb_build_object('success', false, 'error', 'Match not found');
  end if;

  if v_match.status != 'matched' then
    return jsonb_build_object('success', true, 'already_settled', true);
  end if;

  v_pot := v_match.wager * 2;

  if p_voided then
    -- Refund both players
    update public.profiles
    set balance = balance + v_match.wager, updated_at = now()
    where id = v_match.challenger_id;

    update public.profiles
    set balance = balance + v_match.wager, updated_at = now()
    where id = v_match.opponent_id;

    v_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);
    v_tx_id2 := 'tx-' || (extract(epoch from now())::bigint + 1) || '-' || substr(gen_random_uuid()::text, 1, 6);

    insert into public.transactions (id, user_id, type, description, amount, created_at)
    values
      (v_tx_id, v_match.challenger_id, 'arena_refund', 'Arena voided (DNP): ' || p_match_id, v_match.wager, now()),
      (v_tx_id2, v_match.opponent_id, 'arena_refund', 'Arena voided (DNP): ' || p_match_id, v_match.wager, now());

    update public.arena_matches
    set status = 'voided',
        challenger_score = p_challenger_score,
        opponent_score = p_opponent_score,
        settled_at = now()
    where id = p_match_id;

    return jsonb_build_object('success', true, 'result', 'voided');

  elsif p_challenger_score = p_opponent_score then
    -- Tie: refund both
    update public.profiles
    set balance = balance + v_match.wager, updated_at = now()
    where id = v_match.challenger_id;

    update public.profiles
    set balance = balance + v_match.wager, updated_at = now()
    where id = v_match.opponent_id;

    v_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);
    v_tx_id2 := 'tx-' || (extract(epoch from now())::bigint + 1) || '-' || substr(gen_random_uuid()::text, 1, 6);

    insert into public.transactions (id, user_id, type, description, amount, created_at)
    values
      (v_tx_id, v_match.challenger_id, 'arena_refund', 'Arena tie refund: ' || p_match_id, v_match.wager, now()),
      (v_tx_id2, v_match.opponent_id, 'arena_refund', 'Arena tie refund: ' || p_match_id, v_match.wager, now());

    update public.arena_matches
    set status = 'settled',
        challenger_score = p_challenger_score,
        opponent_score = p_opponent_score,
        winner_id = null,
        settled_at = now()
    where id = p_match_id;

    return jsonb_build_object('success', true, 'result', 'tie');

  else
    -- Winner takes pot
    if p_challenger_score > p_opponent_score then
      v_winner_id := v_match.challenger_id;
    else
      v_winner_id := v_match.opponent_id;
    end if;

    update public.profiles
    set balance = balance + v_pot, updated_at = now()
    where id = v_winner_id;

    v_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

    insert into public.transactions (id, user_id, type, description, amount, created_at)
    values (v_tx_id, v_winner_id, 'arena_win', 'Arena win: ' || p_match_id, v_pot, now());

    update public.arena_matches
    set status = 'settled',
        challenger_score = p_challenger_score,
        opponent_score = p_opponent_score,
        winner_id = v_winner_id,
        settled_at = now()
    where id = p_match_id;

    return jsonb_build_object('success', true, 'result', 'winner', 'winner_id', v_winner_id::text);
  end if;
end;
$$;

-- 3e. expire_unmatched_arena (batch cleanup)
create or replace function public.expire_unmatched_arena()
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_match record;
  v_expired int := 0;
  v_tx_id text;
begin
  for v_match in
    select * from public.arena_matches
    where status = 'open' and end_date < current_date
    order by end_date
    limit 100
    for update skip locked
  loop
    -- Refund challenger
    update public.profiles
    set balance = balance + v_match.wager, updated_at = now()
    where id = v_match.challenger_id;

    v_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

    insert into public.transactions (id, user_id, type, description, amount, created_at)
    values (v_tx_id, v_match.challenger_id, 'arena_refund', 'Arena expired (unmatched): ' || v_match.id, v_match.wager, now());

    update public.arena_matches
    set status = 'cancelled'
    where id = v_match.id;

    v_expired := v_expired + 1;
  end loop;

  return jsonb_build_object('success', true, 'expired_count', v_expired);
end;
$$;
