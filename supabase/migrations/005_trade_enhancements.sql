-- ============================================================
-- 005: Trade Enhancements — Open Offers + Auto-Accept Wishlist
-- ============================================================

-- -------- A. Open Trades: schema changes --------

-- Allow receiver_id to be NULL (open offers have no specific recipient)
ALTER TABLE public.trades ALTER COLUMN receiver_id DROP NOT NULL;

-- Track who fulfilled an open trade
ALTER TABLE public.trades ADD COLUMN fulfilled_by uuid REFERENCES public.profiles;

-- Index for fast open-offer lookups
CREATE INDEX trades_open_offers ON public.trades (status) WHERE receiver_id IS NULL;

-- Update RLS: open pending trades are publicly readable
DROP POLICY "Users can read own trades" ON public.trades;

CREATE POLICY "Users can read own or open trades"
  ON public.trades FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
    OR (receiver_id IS NULL AND status = 'pending')
  );

-- -------- B. Replace create_trade to support open offers --------

CREATE OR REPLACE FUNCTION public.create_trade(
  p_receiver_username text DEFAULT NULL,
  p_sender_cards text[] DEFAULT '{}',
  p_receiver_cards text[] DEFAULT '{}',
  p_sender_dt numeric DEFAULT 0,
  p_receiver_dt numeric DEFAULT 0,
  p_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_sender_id uuid := auth.uid();
  v_receiver_id uuid;
  v_trade_id text;
  v_sender_balance numeric;
  v_card text;
  v_is_open boolean := (p_receiver_username IS NULL);
  -- auto-accept vars
  v_wishlist record;
  v_auto_accepted boolean := false;
  v_receiver_balance numeric;
  v_instance_id text;
BEGIN
  IF v_sender_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Resolve receiver (NULL = open offer)
  IF NOT v_is_open THEN
    SELECT id INTO v_receiver_id
      FROM public.profiles
      WHERE lower(username) = lower(p_receiver_username);

    IF v_receiver_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    IF v_receiver_id = v_sender_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cannot trade with yourself');
    END IF;
  END IF;

  -- Validate sender owns their cards
  IF p_sender_cards IS NOT NULL AND array_length(p_sender_cards, 1) > 0 THEN
    FOREACH v_card IN ARRAY p_sender_cards LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.owned_cards
        WHERE player_id = v_card AND user_id = v_sender_id
        LIMIT 1
      ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own card: ' || v_card);
      END IF;
    END LOOP;
  END IF;

  -- Open offers must include at least one sender card
  IF v_is_open AND (p_sender_cards IS NULL OR array_length(p_sender_cards, 1) IS NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Open offers must include at least one card');
  END IF;

  -- Must offer something
  IF (p_sender_cards IS NULL OR array_length(p_sender_cards, 1) IS NULL)
     AND (p_receiver_cards IS NULL OR array_length(p_receiver_cards, 1) IS NULL)
     AND p_sender_dt = 0 AND p_receiver_dt = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trade must include cards or DT');
  END IF;

  -- Check sender DT balance and escrow
  IF p_sender_dt > 0 THEN
    SELECT balance INTO v_sender_balance FROM public.profiles WHERE id = v_sender_id FOR UPDATE;
    IF v_sender_balance < p_sender_dt THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient DT balance');
    END IF;

    UPDATE public.profiles SET balance = balance - p_sender_dt WHERE id = v_sender_id;

    INSERT INTO public.transactions (id, user_id, type, description, amount)
    VALUES (
      'txn_' || gen_random_uuid(),
      v_sender_id,
      'trade_send',
      'DT escrowed for trade offer',
      -p_sender_dt
    );
  END IF;

  v_trade_id := 'trd_' || gen_random_uuid();

  INSERT INTO public.trades (id, sender_id, receiver_id, sender_cards, receiver_cards, sender_dt, receiver_dt, message)
  VALUES (v_trade_id, v_sender_id, v_receiver_id, p_sender_cards, p_receiver_cards, p_sender_dt, p_receiver_dt, p_message);

  -- -------- Auto-accept wishlist check (direct trades only) --------
  IF NOT v_is_open AND v_receiver_id IS NOT NULL THEN
    -- Check if receiver has a wishlist entry matching any sender card
    FOR v_wishlist IN
      SELECT tw.* FROM public.trade_wishlists tw
      WHERE tw.user_id = v_receiver_id
        AND tw.enabled = true
        AND tw.player_id = ANY(p_sender_cards)
      LIMIT 1
    LOOP
      -- Verify conditions:
      -- 1. Cards requested from receiver <= max_cards_give (NULL = unlimited)
      IF v_wishlist.max_cards_give IS NOT NULL
         AND (p_receiver_cards IS NOT NULL AND array_length(p_receiver_cards, 1) IS NOT NULL)
         AND array_length(p_receiver_cards, 1) > v_wishlist.max_cards_give THEN
        CONTINUE;
      END IF;

      -- 2. DT requested from receiver <= max_dt_give
      IF p_receiver_dt > v_wishlist.max_dt_give THEN
        CONTINUE;
      END IF;

      -- 3. DT offered by sender >= min_dt_receive
      IF p_sender_dt < v_wishlist.min_dt_receive THEN
        CONTINUE;
      END IF;

      -- 4. Receiver owns requested cards
      IF p_receiver_cards IS NOT NULL AND array_length(p_receiver_cards, 1) > 0 THEN
        DECLARE
          v_missing boolean := false;
        BEGIN
          FOREACH v_card IN ARRAY p_receiver_cards LOOP
            IF NOT EXISTS (
              SELECT 1 FROM public.owned_cards
              WHERE player_id = v_card AND user_id = v_receiver_id
              LIMIT 1
            ) THEN
              v_missing := true;
              EXIT;
            END IF;
          END LOOP;
          IF v_missing THEN
            CONTINUE;
          END IF;
        END;
      END IF;

      -- 5. Receiver has DT balance for receiver_dt
      IF p_receiver_dt > 0 THEN
        SELECT balance INTO v_receiver_balance FROM public.profiles WHERE id = v_receiver_id FOR UPDATE;
        IF v_receiver_balance < p_receiver_dt THEN
          CONTINUE;
        END IF;
      END IF;

      -- All conditions met — auto-accept the trade inline
      -- Handle receiver DT
      IF p_receiver_dt > 0 THEN
        UPDATE public.profiles SET balance = balance - p_receiver_dt WHERE id = v_receiver_id;
        UPDATE public.profiles SET balance = balance + p_receiver_dt WHERE id = v_sender_id;

        INSERT INTO public.transactions (id, user_id, type, description, amount)
        VALUES ('txn_' || gen_random_uuid(), v_receiver_id, 'trade_send', 'DT sent in trade (auto-accepted)', -p_receiver_dt);
        INSERT INTO public.transactions (id, user_id, type, description, amount)
        VALUES ('txn_' || gen_random_uuid(), v_sender_id, 'trade_receive', 'DT received from trade (auto-accepted)', p_receiver_dt);
      END IF;

      -- Escrowed sender DT goes to receiver
      IF p_sender_dt > 0 THEN
        UPDATE public.profiles SET balance = balance + p_sender_dt WHERE id = v_receiver_id;
        INSERT INTO public.transactions (id, user_id, type, description, amount)
        VALUES ('txn_' || gen_random_uuid(), v_receiver_id, 'trade_receive', 'DT received from trade (auto-accepted)', p_sender_dt);
      END IF;

      -- Transfer sender's cards to receiver
      IF p_sender_cards IS NOT NULL AND array_length(p_sender_cards, 1) > 0 THEN
        FOREACH v_card IN ARRAY p_sender_cards LOOP
          SELECT instance_id INTO v_instance_id
            FROM public.owned_cards
            WHERE player_id = v_card AND user_id = v_sender_id
            LIMIT 1;
          IF v_instance_id IS NOT NULL THEN
            UPDATE public.owned_cards SET user_id = v_receiver_id WHERE instance_id = v_instance_id;
          END IF;
        END LOOP;
      END IF;

      -- Transfer receiver's cards to sender
      IF p_receiver_cards IS NOT NULL AND array_length(p_receiver_cards, 1) > 0 THEN
        FOREACH v_card IN ARRAY p_receiver_cards LOOP
          SELECT instance_id INTO v_instance_id
            FROM public.owned_cards
            WHERE player_id = v_card AND user_id = v_receiver_id
            LIMIT 1;
          IF v_instance_id IS NOT NULL THEN
            UPDATE public.owned_cards SET user_id = v_sender_id WHERE instance_id = v_instance_id;
          END IF;
        END LOOP;
      END IF;

      UPDATE public.trades SET status = 'accepted', responded_at = now() WHERE id = v_trade_id;
      v_auto_accepted := true;
      EXIT; -- only process one wishlist match
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'trade_id', v_trade_id, 'auto_accepted', v_auto_accepted);
END;
$$;

-- -------- C. fulfill_open_trade RPC --------

CREATE OR REPLACE FUNCTION public.fulfill_open_trade(p_trade_id text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_trade record;
  v_card text;
  v_instance_id text;
  v_fulfiller_balance numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Lock the trade row
  SELECT * INTO v_trade FROM public.trades WHERE id = p_trade_id FOR UPDATE;

  IF v_trade IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trade not found');
  END IF;

  IF v_trade.receiver_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not an open trade');
  END IF;

  IF v_trade.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trade is no longer available');
  END IF;

  IF v_trade.sender_id = v_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot fulfill your own offer');
  END IF;

  -- Validate sender still owns their offered cards
  IF v_trade.sender_cards IS NOT NULL AND array_length(v_trade.sender_cards, 1) > 0 THEN
    FOREACH v_card IN ARRAY v_trade.sender_cards LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.owned_cards
        WHERE player_id = v_card AND user_id = v_trade.sender_id
        LIMIT 1
      ) THEN
        -- Auto-cancel + refund
        IF v_trade.sender_dt > 0 THEN
          UPDATE public.profiles SET balance = balance + v_trade.sender_dt WHERE id = v_trade.sender_id;
          INSERT INTO public.transactions (id, user_id, type, description, amount)
          VALUES ('txn_' || gen_random_uuid(), v_trade.sender_id, 'trade_receive', 'DT refunded - open offer voided', v_trade.sender_dt);
        END IF;
        UPDATE public.trades SET status = 'cancelled', responded_at = now() WHERE id = p_trade_id;
        RETURN jsonb_build_object('success', false, 'error', 'Offer is no longer available — sender no longer owns offered cards');
      END IF;
    END LOOP;
  END IF;

  -- Validate fulfiller owns requested cards (receiver_cards)
  IF v_trade.receiver_cards IS NOT NULL AND array_length(v_trade.receiver_cards, 1) > 0 THEN
    FOREACH v_card IN ARRAY v_trade.receiver_cards LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.owned_cards
        WHERE player_id = v_card AND user_id = v_user_id
        LIMIT 1
      ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own required card: ' || v_card);
      END IF;
    END LOOP;
  END IF;

  -- Handle fulfiller DT (receiver_dt = what fulfiller must pay)
  IF v_trade.receiver_dt > 0 THEN
    SELECT balance INTO v_fulfiller_balance FROM public.profiles WHERE id = v_user_id FOR UPDATE;
    IF v_fulfiller_balance < v_trade.receiver_dt THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient DT balance');
    END IF;

    UPDATE public.profiles SET balance = balance - v_trade.receiver_dt WHERE id = v_user_id;
    UPDATE public.profiles SET balance = balance + v_trade.receiver_dt WHERE id = v_trade.sender_id;

    INSERT INTO public.transactions (id, user_id, type, description, amount)
    VALUES ('txn_' || gen_random_uuid(), v_user_id, 'trade_send', 'DT sent to fulfill open trade', -v_trade.receiver_dt);
    INSERT INTO public.transactions (id, user_id, type, description, amount)
    VALUES ('txn_' || gen_random_uuid(), v_trade.sender_id, 'trade_receive', 'DT received from open trade fulfillment', v_trade.receiver_dt);
  END IF;

  -- Escrowed sender DT goes to fulfiller
  IF v_trade.sender_dt > 0 THEN
    UPDATE public.profiles SET balance = balance + v_trade.sender_dt WHERE id = v_user_id;
    INSERT INTO public.transactions (id, user_id, type, description, amount)
    VALUES ('txn_' || gen_random_uuid(), v_user_id, 'trade_receive', 'DT received from open trade', v_trade.sender_dt);
  END IF;

  -- Transfer sender's cards to fulfiller
  IF v_trade.sender_cards IS NOT NULL AND array_length(v_trade.sender_cards, 1) > 0 THEN
    FOREACH v_card IN ARRAY v_trade.sender_cards LOOP
      SELECT instance_id INTO v_instance_id
        FROM public.owned_cards
        WHERE player_id = v_card AND user_id = v_trade.sender_id
        LIMIT 1;
      IF v_instance_id IS NOT NULL THEN
        UPDATE public.owned_cards SET user_id = v_user_id WHERE instance_id = v_instance_id;
      END IF;
    END LOOP;
  END IF;

  -- Transfer fulfiller's cards (receiver_cards) to sender
  IF v_trade.receiver_cards IS NOT NULL AND array_length(v_trade.receiver_cards, 1) > 0 THEN
    FOREACH v_card IN ARRAY v_trade.receiver_cards LOOP
      SELECT instance_id INTO v_instance_id
        FROM public.owned_cards
        WHERE player_id = v_card AND user_id = v_user_id
        LIMIT 1;
      IF v_instance_id IS NOT NULL THEN
        UPDATE public.owned_cards SET user_id = v_trade.sender_id WHERE instance_id = v_instance_id;
      END IF;
    END LOOP;
  END IF;

  -- Mark trade as accepted, set receiver and fulfilled_by
  UPDATE public.trades
    SET status = 'accepted',
        receiver_id = v_user_id,
        fulfilled_by = v_user_id,
        responded_at = now()
    WHERE id = p_trade_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- D. Trade Wishlists (Auto-Accept)
-- ============================================================

CREATE TABLE public.trade_wishlists (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  player_id text NOT NULL,
  max_cards_give int,
  max_dt_give numeric NOT NULL DEFAULT 0,
  min_dt_receive numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, player_id)
);

CREATE INDEX trade_wishlists_user ON public.trade_wishlists (user_id);
CREATE INDEX trade_wishlists_player ON public.trade_wishlists (player_id);

-- RLS: public read, mutations via RPCs
ALTER TABLE public.trade_wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read wishlists"
  ON public.trade_wishlists FOR SELECT
  USING (true);

-- -------- upsert_trade_wishlist --------
CREATE OR REPLACE FUNCTION public.upsert_trade_wishlist(
  p_player_id text,
  p_max_cards_give int DEFAULT NULL,
  p_max_dt_give numeric DEFAULT 0,
  p_min_dt_receive numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_id text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  v_id := 'twl_' || gen_random_uuid();

  INSERT INTO public.trade_wishlists (id, user_id, player_id, max_cards_give, max_dt_give, min_dt_receive)
  VALUES (v_id, v_user_id, p_player_id, p_max_cards_give, p_max_dt_give, p_min_dt_receive)
  ON CONFLICT (user_id, player_id)
  DO UPDATE SET
    max_cards_give = EXCLUDED.max_cards_give,
    max_dt_give = EXCLUDED.max_dt_give,
    min_dt_receive = EXCLUDED.min_dt_receive,
    enabled = true;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- -------- remove_trade_wishlist --------
CREATE OR REPLACE FUNCTION public.remove_trade_wishlist(p_player_id text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  DELETE FROM public.trade_wishlists
  WHERE user_id = v_user_id AND player_id = p_player_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
