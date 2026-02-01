-- Dynasty Tokens — Auction House Migration
-- Run this in the Supabase SQL Editor after schema.sql

-- ============================================================
-- 1. TABLES
-- ============================================================

-- auctions — card listings
create table public.auctions (
  id text primary key,
  seller_id uuid not null references public.profiles on delete cascade,
  card_instance_id text not null references public.owned_cards(instance_id) on delete cascade,
  player_id text not null,
  starting_bid numeric not null check (starting_bid > 0),
  buy_now_price numeric check (buy_now_price is null or buy_now_price > starting_bid),
  current_bid numeric,
  current_bidder_id uuid references public.profiles on delete set null,
  bid_count int not null default 0,
  status text not null default 'active' check (status in ('active', 'settled', 'cancelled')),
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  settled_at timestamptz
);

-- Prevent double-listing a card
create unique index auctions_active_card on public.auctions (card_instance_id) where status = 'active';
create index auctions_status_ends on public.auctions (status, ends_at);
create index auctions_seller on public.auctions (seller_id);

-- bids — bid history
create table public.bids (
  id text primary key,
  auction_id text not null references public.auctions on delete cascade,
  bidder_id uuid not null references public.profiles on delete cascade,
  amount numeric not null,
  created_at timestamptz not null default now()
);

create index bids_auction on public.bids (auction_id, created_at desc);
create index bids_bidder on public.bids (bidder_id);

-- ============================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================

alter table public.auctions enable row level security;
alter table public.bids enable row level security;

-- auctions: public read
create policy "auctions_select" on public.auctions
  for select using (true);

-- bids: public read
create policy "bids_select" on public.bids
  for select using (true);

-- ============================================================
-- 3. RPC FUNCTIONS
-- ============================================================

-- 3a. create_auction
create or replace function public.create_auction(
  p_card_instance_id text,
  p_player_id text,
  p_starting_bid numeric,
  p_buy_now_price numeric default null,
  p_duration_hours int default 24
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_auction_id text;
begin
  -- Validate inputs
  if p_starting_bid <= 0 then
    return jsonb_build_object('success', false, 'error', 'Starting bid must be greater than 0');
  end if;

  if p_buy_now_price is not null and p_buy_now_price <= p_starting_bid then
    return jsonb_build_object('success', false, 'error', 'Buy-now price must exceed starting bid');
  end if;

  if p_duration_hours < 1 or p_duration_hours > 72 then
    return jsonb_build_object('success', false, 'error', 'Duration must be between 1 and 72 hours');
  end if;

  -- Verify caller owns the card
  select user_id into v_owner_id
  from public.owned_cards
  where instance_id = p_card_instance_id
  for update;

  if v_owner_id is null then
    return jsonb_build_object('success', false, 'error', 'Card not found');
  end if;

  if v_owner_id != auth.uid() then
    return jsonb_build_object('success', false, 'error', 'You do not own this card');
  end if;

  -- Check card not already listed (unique index will also catch this, but give a nicer error)
  if exists (
    select 1 from public.auctions
    where card_instance_id = p_card_instance_id and status = 'active'
  ) then
    return jsonb_build_object('success', false, 'error', 'Card is already listed in an active auction');
  end if;

  -- Generate auction ID
  v_auction_id := 'auc-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

  -- Insert auction
  insert into public.auctions (id, seller_id, card_instance_id, player_id, starting_bid, buy_now_price, status, ends_at, created_at)
  values (
    v_auction_id,
    auth.uid(),
    p_card_instance_id,
    p_player_id,
    p_starting_bid,
    p_buy_now_price,
    'active',
    now() + (p_duration_hours || ' hours')::interval,
    now()
  );

  return jsonb_build_object('success', true, 'auction_id', v_auction_id);
end;
$$;

-- 3b. place_bid
create or replace function public.place_bid(
  p_auction_id text,
  p_amount numeric
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_auction record;
  v_bidder_balance numeric;
  v_bid_id text;
  v_tx_id text;
  v_refund_tx_id text;
begin
  -- Lock and fetch auction
  select * into v_auction
  from public.auctions
  where id = p_auction_id
  for update;

  if v_auction is null then
    return jsonb_build_object('success', false, 'error', 'Auction not found');
  end if;

  if v_auction.status != 'active' then
    return jsonb_build_object('success', false, 'error', 'Auction is not active');
  end if;

  if v_auction.ends_at <= now() then
    return jsonb_build_object('success', false, 'error', 'Auction has expired');
  end if;

  if v_auction.seller_id = auth.uid() then
    return jsonb_build_object('success', false, 'error', 'Cannot bid on your own auction');
  end if;

  if v_auction.current_bidder_id = auth.uid() then
    return jsonb_build_object('success', false, 'error', 'You are already the highest bidder');
  end if;

  -- Validate bid amount
  if v_auction.current_bid is not null and p_amount <= v_auction.current_bid then
    return jsonb_build_object('success', false, 'error', 'Bid must exceed current bid of ' || v_auction.current_bid);
  end if;

  if v_auction.current_bid is null and p_amount < v_auction.starting_bid then
    return jsonb_build_object('success', false, 'error', 'Bid must be at least the starting bid of ' || v_auction.starting_bid);
  end if;

  -- Check bidder balance (lock their profile)
  select balance into v_bidder_balance
  from public.profiles
  where id = auth.uid()
  for update;

  if v_bidder_balance is null or v_bidder_balance < p_amount then
    return jsonb_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  -- Escrow: deduct bid from bidder
  update public.profiles
  set balance = balance - p_amount, updated_at = now()
  where id = auth.uid();

  v_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.transactions (id, user_id, type, description, amount, created_at)
  values (v_tx_id, auth.uid(), 'auction_bid', 'Bid on auction ' || p_auction_id, -p_amount, now());

  -- Refund previous bidder if any
  if v_auction.current_bidder_id is not null and v_auction.current_bid is not null then
    update public.profiles
    set balance = balance + v_auction.current_bid, updated_at = now()
    where id = v_auction.current_bidder_id;

    v_refund_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

    insert into public.transactions (id, user_id, type, description, amount, created_at)
    values (v_refund_tx_id, v_auction.current_bidder_id, 'auction_refund', 'Outbid refund for auction ' || p_auction_id, v_auction.current_bid, now());
  end if;

  -- Update auction
  update public.auctions
  set current_bid = p_amount,
      current_bidder_id = auth.uid(),
      bid_count = bid_count + 1
  where id = p_auction_id;

  -- Insert bid record
  v_bid_id := 'bid-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.bids (id, auction_id, bidder_id, amount, created_at)
  values (v_bid_id, p_auction_id, auth.uid(), p_amount, now());

  return jsonb_build_object('success', true, 'bid_id', v_bid_id);
end;
$$;

-- 3c. buy_now
create or replace function public.buy_now(
  p_auction_id text
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_auction record;
  v_buyer_balance numeric;
  v_tx_id text;
  v_seller_tx_id text;
  v_refund_tx_id text;
begin
  -- Lock and fetch auction
  select * into v_auction
  from public.auctions
  where id = p_auction_id
  for update;

  if v_auction is null then
    return jsonb_build_object('success', false, 'error', 'Auction not found');
  end if;

  if v_auction.status != 'active' then
    return jsonb_build_object('success', false, 'error', 'Auction is not active');
  end if;

  if v_auction.ends_at <= now() then
    return jsonb_build_object('success', false, 'error', 'Auction has expired');
  end if;

  if v_auction.buy_now_price is null then
    return jsonb_build_object('success', false, 'error', 'This auction does not have a buy-now price');
  end if;

  if v_auction.seller_id = auth.uid() then
    return jsonb_build_object('success', false, 'error', 'Cannot buy your own auction');
  end if;

  -- Check buyer balance
  select balance into v_buyer_balance
  from public.profiles
  where id = auth.uid()
  for update;

  if v_buyer_balance is null or v_buyer_balance < v_auction.buy_now_price then
    return jsonb_build_object('success', false, 'error', 'Insufficient balance');
  end if;

  -- Deduct from buyer
  update public.profiles
  set balance = balance - v_auction.buy_now_price, updated_at = now()
  where id = auth.uid();

  v_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.transactions (id, user_id, type, description, amount, created_at)
  values (v_tx_id, auth.uid(), 'auction_buy', 'Bought now: auction ' || p_auction_id, -v_auction.buy_now_price, now());

  -- Pay seller
  update public.profiles
  set balance = balance + v_auction.buy_now_price, updated_at = now()
  where id = v_auction.seller_id;

  v_seller_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

  insert into public.transactions (id, user_id, type, description, amount, created_at)
  values (v_seller_tx_id, v_auction.seller_id, 'auction_sale', 'Card sold: auction ' || p_auction_id, v_auction.buy_now_price, now());

  -- Refund previous bidder if any
  if v_auction.current_bidder_id is not null and v_auction.current_bid is not null then
    update public.profiles
    set balance = balance + v_auction.current_bid, updated_at = now()
    where id = v_auction.current_bidder_id;

    v_refund_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

    insert into public.transactions (id, user_id, type, description, amount, created_at)
    values (v_refund_tx_id, v_auction.current_bidder_id, 'auction_refund', 'Buy-now refund for auction ' || p_auction_id, v_auction.current_bid, now());
  end if;

  -- Transfer card to buyer
  update public.owned_cards
  set user_id = auth.uid()
  where instance_id = v_auction.card_instance_id;

  -- Mark auction settled
  update public.auctions
  set status = 'settled',
      current_bid = v_auction.buy_now_price,
      current_bidder_id = auth.uid(),
      settled_at = now()
  where id = p_auction_id;

  return jsonb_build_object('success', true);
end;
$$;

-- 3d. settle_auction
create or replace function public.settle_auction(
  p_auction_id text
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_auction record;
  v_seller_tx_id text;
begin
  -- Lock and fetch auction
  select * into v_auction
  from public.auctions
  where id = p_auction_id
  for update;

  if v_auction is null then
    return jsonb_build_object('success', false, 'error', 'Auction not found');
  end if;

  -- Already settled or cancelled — idempotent
  if v_auction.status != 'active' then
    return jsonb_build_object('success', true, 'already_settled', true);
  end if;

  -- Must be expired
  if v_auction.ends_at > now() then
    return jsonb_build_object('success', false, 'error', 'Auction has not expired yet');
  end if;

  if v_auction.current_bidder_id is not null and v_auction.current_bid is not null then
    -- Winner exists: pay seller from escrowed funds, transfer card
    update public.profiles
    set balance = balance + v_auction.current_bid, updated_at = now()
    where id = v_auction.seller_id;

    v_seller_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

    insert into public.transactions (id, user_id, type, description, amount, created_at)
    values (v_seller_tx_id, v_auction.seller_id, 'auction_sale', 'Auction settled: ' || p_auction_id, v_auction.current_bid, now());

    -- Transfer card to winner
    update public.owned_cards
    set user_id = v_auction.current_bidder_id
    where instance_id = v_auction.card_instance_id;
  end if;
  -- If no bids, card stays with seller — nothing to do

  -- Mark settled
  update public.auctions
  set status = 'settled', settled_at = now()
  where id = p_auction_id;

  return jsonb_build_object('success', true);
end;
$$;

-- 3e. cancel_auction
create or replace function public.cancel_auction(
  p_auction_id text
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_auction record;
begin
  -- Lock and fetch auction
  select * into v_auction
  from public.auctions
  where id = p_auction_id
  for update;

  if v_auction is null then
    return jsonb_build_object('success', false, 'error', 'Auction not found');
  end if;

  if v_auction.seller_id != auth.uid() then
    return jsonb_build_object('success', false, 'error', 'Only the seller can cancel');
  end if;

  if v_auction.status != 'active' then
    return jsonb_build_object('success', false, 'error', 'Auction is not active');
  end if;

  if v_auction.bid_count > 0 then
    return jsonb_build_object('success', false, 'error', 'Cannot cancel auction with bids');
  end if;

  update public.auctions
  set status = 'cancelled', settled_at = now()
  where id = p_auction_id;

  return jsonb_build_object('success', true);
end;
$$;

-- 3f. settle_expired_auctions (batch, for cron)
create or replace function public.settle_expired_auctions()
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_auction record;
  v_settled int := 0;
  v_seller_tx_id text;
begin
  for v_auction in
    select * from public.auctions
    where status = 'active' and ends_at <= now()
    order by ends_at
    limit 50
    for update skip locked
  loop
    if v_auction.current_bidder_id is not null and v_auction.current_bid is not null then
      -- Pay seller
      update public.profiles
      set balance = balance + v_auction.current_bid, updated_at = now()
      where id = v_auction.seller_id;

      v_seller_tx_id := 'tx-' || extract(epoch from now())::bigint || '-' || substr(gen_random_uuid()::text, 1, 6);

      insert into public.transactions (id, user_id, type, description, amount, created_at)
      values (v_seller_tx_id, v_auction.seller_id, 'auction_sale', 'Auction settled: ' || v_auction.id, v_auction.current_bid, now());

      -- Transfer card
      update public.owned_cards
      set user_id = v_auction.current_bidder_id
      where instance_id = v_auction.card_instance_id;
    end if;

    -- Mark settled
    update public.auctions
    set status = 'settled', settled_at = now()
    where id = v_auction.id;

    v_settled := v_settled + 1;
  end loop;

  return jsonb_build_object('success', true, 'settled_count', v_settled);
end;
$$;

-- ============================================================
-- 4. RLS UPDATE: Allow owned_cards user_id to be updated by security definer functions
-- ============================================================
-- The security definer functions above handle card transfers directly.
-- No additional RLS policies needed since the RPCs run as the function owner.
