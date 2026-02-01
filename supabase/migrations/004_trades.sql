-- ============================================================
-- 004: Peer-to-Peer Trading
-- ============================================================

-- -------- Table --------
create table public.trades (
  id text primary key,
  sender_id uuid not null references public.profiles on delete cascade,
  receiver_id uuid not null references public.profiles on delete cascade,
  sender_cards text[] not null,
  receiver_cards text[] not null,
  sender_dt numeric not null default 0,
  receiver_dt numeric not null default 0,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create index trades_sender on public.trades (sender_id);
create index trades_receiver on public.trades (receiver_id);
create index trades_status on public.trades (status);

-- RLS
alter table public.trades enable row level security;

create policy "Users can read own trades"
  on public.trades for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- All mutations via RPCs

-- -------- create_trade --------
create or replace function public.create_trade(
  p_receiver_username text,
  p_sender_cards text[],
  p_receiver_cards text[],
  p_sender_dt numeric default 0,
  p_receiver_dt numeric default 0,
  p_message text default null
)
returns jsonb
language plpgsql security definer
as $$
declare
  v_sender_id uuid := auth.uid();
  v_receiver_id uuid;
  v_trade_id text;
  v_sender_balance numeric;
  v_card text;
begin
  if v_sender_id is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  -- Resolve receiver
  select id into v_receiver_id
    from public.profiles
    where lower(username) = lower(p_receiver_username);

  if v_receiver_id is null then
    return jsonb_build_object('success', false, 'error', 'User not found');
  end if;

  if v_receiver_id = v_sender_id then
    return jsonb_build_object('success', false, 'error', 'Cannot trade with yourself');
  end if;

  -- Validate sender owns their cards
  foreach v_card in array p_sender_cards loop
    if not exists (
      select 1 from public.owned_cards
      where player_id = v_card and user_id = v_sender_id
      limit 1
    ) then
      return jsonb_build_object('success', false, 'error', 'You do not own card: ' || v_card);
    end if;
  end loop;

  -- Must offer something
  if array_length(p_sender_cards, 1) is null
     and array_length(p_receiver_cards, 1) is null
     and p_sender_dt = 0 and p_receiver_dt = 0 then
    return jsonb_build_object('success', false, 'error', 'Trade must include cards or DT');
  end if;

  -- Check sender DT balance and escrow
  if p_sender_dt > 0 then
    select balance into v_sender_balance from public.profiles where id = v_sender_id for update;
    if v_sender_balance < p_sender_dt then
      return jsonb_build_object('success', false, 'error', 'Insufficient DT balance');
    end if;

    update public.profiles set balance = balance - p_sender_dt where id = v_sender_id;

    insert into public.transactions (id, user_id, type, description, amount)
    values (
      'txn_' || gen_random_uuid(),
      v_sender_id,
      'trade_send',
      'DT escrowed for trade offer',
      -p_sender_dt
    );
  end if;

  v_trade_id := 'trd_' || gen_random_uuid();

  insert into public.trades (id, sender_id, receiver_id, sender_cards, receiver_cards, sender_dt, receiver_dt, message)
  values (v_trade_id, v_sender_id, v_receiver_id, p_sender_cards, p_receiver_cards, p_sender_dt, p_receiver_dt, p_message);

  return jsonb_build_object('success', true, 'trade_id', v_trade_id);
end;
$$;

-- -------- accept_trade --------
create or replace function public.accept_trade(p_trade_id text)
returns jsonb
language plpgsql security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_trade record;
  v_card text;
  v_instance_id text;
  v_receiver_balance numeric;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select * into v_trade from public.trades where id = p_trade_id for update;

  if v_trade is null then
    return jsonb_build_object('success', false, 'error', 'Trade not found');
  end if;

  if v_trade.receiver_id != v_user_id then
    return jsonb_build_object('success', false, 'error', 'Not the trade recipient');
  end if;

  if v_trade.status != 'pending' then
    return jsonb_build_object('success', false, 'error', 'Trade is no longer pending');
  end if;

  -- Validate receiver owns their offered cards
  if v_trade.receiver_cards is not null and array_length(v_trade.receiver_cards, 1) > 0 then
    foreach v_card in array v_trade.receiver_cards loop
      if not exists (
        select 1 from public.owned_cards
        where player_id = v_card and user_id = v_user_id
        limit 1
      ) then
        return jsonb_build_object('success', false, 'error', 'You no longer own card: ' || v_card);
      end if;
    end loop;
  end if;

  -- Validate sender still owns their offered cards
  if v_trade.sender_cards is not null and array_length(v_trade.sender_cards, 1) > 0 then
    foreach v_card in array v_trade.sender_cards loop
      if not exists (
        select 1 from public.owned_cards
        where player_id = v_card and user_id = v_trade.sender_id
        limit 1
      ) then
        -- Refund sender DT and cancel
        if v_trade.sender_dt > 0 then
          update public.profiles set balance = balance + v_trade.sender_dt where id = v_trade.sender_id;
          insert into public.transactions (id, user_id, type, description, amount)
          values ('txn_' || gen_random_uuid(), v_trade.sender_id, 'trade_receive', 'DT refunded - trade voided', v_trade.sender_dt);
        end if;
        update public.trades set status = 'cancelled', responded_at = now() where id = p_trade_id;
        return jsonb_build_object('success', false, 'error', 'Sender no longer owns offered cards');
      end if;
    end loop;
  end if;

  -- Handle receiver DT
  if v_trade.receiver_dt > 0 then
    select balance into v_receiver_balance from public.profiles where id = v_user_id for update;
    if v_receiver_balance < v_trade.receiver_dt then
      return jsonb_build_object('success', false, 'error', 'Insufficient DT balance');
    end if;

    -- Deduct from receiver, give to sender
    update public.profiles set balance = balance - v_trade.receiver_dt where id = v_user_id;
    update public.profiles set balance = balance + v_trade.receiver_dt where id = v_trade.sender_id;

    insert into public.transactions (id, user_id, type, description, amount)
    values ('txn_' || gen_random_uuid(), v_user_id, 'trade_send', 'DT sent in trade', -v_trade.receiver_dt);
    insert into public.transactions (id, user_id, type, description, amount)
    values ('txn_' || gen_random_uuid(), v_trade.sender_id, 'trade_receive', 'DT received from trade', v_trade.receiver_dt);
  end if;

  -- Escrowed sender DT goes to receiver
  if v_trade.sender_dt > 0 then
    update public.profiles set balance = balance + v_trade.sender_dt where id = v_user_id;

    insert into public.transactions (id, user_id, type, description, amount)
    values ('txn_' || gen_random_uuid(), v_user_id, 'trade_receive', 'DT received from trade', v_trade.sender_dt);
  end if;

  -- Transfer sender's cards to receiver
  if v_trade.sender_cards is not null and array_length(v_trade.sender_cards, 1) > 0 then
    foreach v_card in array v_trade.sender_cards loop
      select instance_id into v_instance_id
        from public.owned_cards
        where player_id = v_card and user_id = v_trade.sender_id
        limit 1;
      if v_instance_id is not null then
        update public.owned_cards set user_id = v_user_id where instance_id = v_instance_id;
      end if;
    end loop;
  end if;

  -- Transfer receiver's cards to sender
  if v_trade.receiver_cards is not null and array_length(v_trade.receiver_cards, 1) > 0 then
    foreach v_card in array v_trade.receiver_cards loop
      select instance_id into v_instance_id
        from public.owned_cards
        where player_id = v_card and user_id = v_user_id
        limit 1;
      if v_instance_id is not null then
        update public.owned_cards set user_id = v_trade.sender_id where instance_id = v_instance_id;
      end if;
    end loop;
  end if;

  -- Mark trade as accepted
  update public.trades set status = 'accepted', responded_at = now() where id = p_trade_id;

  return jsonb_build_object('success', true);
end;
$$;

-- -------- decline_trade --------
create or replace function public.decline_trade(p_trade_id text)
returns jsonb
language plpgsql security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_trade record;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select * into v_trade from public.trades where id = p_trade_id for update;

  if v_trade is null then
    return jsonb_build_object('success', false, 'error', 'Trade not found');
  end if;

  if v_trade.receiver_id != v_user_id then
    return jsonb_build_object('success', false, 'error', 'Not the trade recipient');
  end if;

  if v_trade.status != 'pending' then
    return jsonb_build_object('success', false, 'error', 'Trade is no longer pending');
  end if;

  -- Refund sender DT
  if v_trade.sender_dt > 0 then
    update public.profiles set balance = balance + v_trade.sender_dt where id = v_trade.sender_id;
    insert into public.transactions (id, user_id, type, description, amount)
    values ('txn_' || gen_random_uuid(), v_trade.sender_id, 'trade_receive', 'DT refunded - trade declined', v_trade.sender_dt);
  end if;

  update public.trades set status = 'declined', responded_at = now() where id = p_trade_id;

  return jsonb_build_object('success', true);
end;
$$;

-- -------- cancel_trade --------
create or replace function public.cancel_trade(p_trade_id text)
returns jsonb
language plpgsql security definer
as $$
declare
  v_user_id uuid := auth.uid();
  v_trade record;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  select * into v_trade from public.trades where id = p_trade_id for update;

  if v_trade is null then
    return jsonb_build_object('success', false, 'error', 'Trade not found');
  end if;

  if v_trade.sender_id != v_user_id then
    return jsonb_build_object('success', false, 'error', 'Not the trade sender');
  end if;

  if v_trade.status != 'pending' then
    return jsonb_build_object('success', false, 'error', 'Trade is no longer pending');
  end if;

  -- Refund sender DT
  if v_trade.sender_dt > 0 then
    update public.profiles set balance = balance + v_trade.sender_dt where id = v_trade.sender_id;
    insert into public.transactions (id, user_id, type, description, amount)
    values ('txn_' || gen_random_uuid(), v_trade.sender_id, 'trade_receive', 'DT refunded - trade cancelled', v_trade.sender_dt);
  end if;

  update public.trades set status = 'cancelled', responded_at = now() where id = p_trade_id;

  return jsonb_build_object('success', true);
end;
$$;
