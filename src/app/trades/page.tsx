"use client";

import { useEffect, useState } from "react";
import { useTradeStore } from "@/stores/tradeStore";
import { useAuthStore } from "@/stores/authStore";
import { useCollectionStore } from "@/stores/collectionStore";
import { Trade } from "@/types";
import { players } from "@/data/players";
import { resolveLegacyId } from "@/data/legacy-id-map";
import { CreateTradeModal } from "@/components/trade/CreateTradeModal";
import { WishlistSection } from "@/components/trade/WishlistSection";
import { GlowButton } from "@/components/ui/GlowButton";
import {
  ArrowLeftRight,
  Inbox,
  Send,
  Globe,
  Heart,
  Check,
  X,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { formatTokenAmount } from "@/lib/formatters";
import { formatRelativeTime } from "@/lib/formatters";

function resolvePlayerName(playerId: string): string {
  const resolvedId = resolveLegacyId(playerId);
  const player = players.find(
    (p) => p.id === resolvedId || p.id === playerId
  );
  return player?.name ?? playerId;
}

function CardList({ cardIds }: { cardIds: string[] }) {
  if (cardIds.length === 0) return <span className="text-white/30">None</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {cardIds.map((id) => (
        <span
          key={id}
          className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
        >
          {resolvePlayerName(id)}
        </span>
      ))}
    </div>
  );
}

function TradeCard({
  trade,
  perspective,
  onAccept,
  onDecline,
  onCancel,
  onFulfill,
  acting,
}: {
  trade: Trade;
  perspective: "incoming" | "outgoing" | "open";
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onFulfill?: () => void;
  acting: boolean;
}) {
  const otherUser =
    perspective === "incoming"
      ? trade.senderUsername
      : perspective === "outgoing"
        ? (trade.receiverUsername ?? (trade.isOpen ? "Open Offer" : "Unknown"))
        : trade.senderUsername;
  const isPending = trade.status === "pending";

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400 bg-yellow-500/10",
    accepted: "text-green-400 bg-green-500/10",
    declined: "text-red-400 bg-red-500/10",
    cancelled: "text-white/40 bg-white/5",
  };

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {trade.isOpen ? (
            <Globe className="h-4 w-4 text-orange-400" />
          ) : (
            <ArrowLeftRight className="h-4 w-4 text-orange-400" />
          )}
          <span className="text-sm font-medium text-white">
            {perspective === "open"
              ? `From ${otherUser}`
              : perspective === "incoming"
                ? `From ${otherUser}`
                : trade.isOpen
                  ? "Open Offer"
                  : `To ${otherUser}`}
          </span>
          {trade.isOpen && perspective !== "open" && (
            <span className="rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-medium text-orange-400">
              Open
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColors[trade.status]}`}
          >
            {trade.status}
          </span>
          <span className="text-[10px] text-white/20">
            {formatRelativeTime(new Date(trade.createdAt))}
          </span>
        </div>
      </div>

      {/* Trade content */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/30">
            {perspective === "incoming"
              ? "They send"
              : perspective === "open"
                ? "They offer"
                : "You send"}
          </div>
          <CardList cardIds={trade.senderCards} />
          {trade.senderDt > 0 && (
            <div className="mt-1 text-xs text-orange-400">
              + {formatTokenAmount(trade.senderDt)}
            </div>
          )}
        </div>
        <div>
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/30">
            {perspective === "incoming"
              ? "You send"
              : perspective === "open"
                ? "They want"
                : "You receive"}
          </div>
          <CardList cardIds={trade.receiverCards} />
          {trade.receiverDt > 0 && (
            <div className="mt-1 text-xs text-orange-400">
              + {formatTokenAmount(trade.receiverDt)}
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      {trade.message && (
        <div className="flex items-start gap-2 rounded-lg bg-white/5 p-2">
          <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-white/30" />
          <span className="text-xs text-white/50">{trade.message}</span>
        </div>
      )}

      {/* Actions */}
      {isPending && (
        <div className="flex gap-2">
          {perspective === "incoming" && onAccept && onDecline && (
            <>
              <button
                onClick={onAccept}
                disabled={acting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-2 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
              >
                {acting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Accept
              </button>
              <button
                onClick={onDecline}
                disabled={acting}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
              >
                <X className="h-3 w-3" />
                Decline
              </button>
            </>
          )}
          {perspective === "outgoing" && onCancel && (
            <button
              onClick={onCancel}
              disabled={acting}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-white/50 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              {acting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
              Cancel Trade
            </button>
          )}
          {perspective === "open" && onFulfill && (
            <button
              onClick={onFulfill}
              disabled={acting}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-orange-500/10 px-3 py-2 text-xs font-medium text-orange-400 transition-colors hover:bg-orange-500/20 disabled:opacity-50"
            >
              {acting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
              Fulfill
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type Tab = "incoming" | "outgoing" | "open" | "wishlist";

export default function TradesPage() {
  const {
    incomingTrades,
    outgoingTrades,
    openTrades,
    loading,
    fetchTrades,
    fetchOpenTrades,
    fetchWishlists,
    acceptTrade,
    declineTrade,
    cancelTrade,
    fulfillOpenTrade,
  } = useTradeStore();
  const user = useAuthStore((s) => s.user);
  const fetchCards = useCollectionStore((s) => s.fetchCards);

  const [tab, setTab] = useState<Tab>("incoming");
  const [createOpen, setCreateOpen] = useState(false);
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTrades();
      fetchOpenTrades();
      fetchWishlists();
      fetchCards(user.id);
    }
  }, [user, fetchTrades, fetchOpenTrades, fetchWishlists, fetchCards]);

  const handleAccept = async (tradeId: string) => {
    setActingOn(tradeId);
    await acceptTrade(tradeId);
    setActingOn(null);
  };

  const handleDecline = async (tradeId: string) => {
    setActingOn(tradeId);
    await declineTrade(tradeId);
    setActingOn(null);
  };

  const handleCancel = async (tradeId: string) => {
    setActingOn(tradeId);
    await cancelTrade(tradeId);
    setActingOn(null);
  };

  const handleFulfill = async (tradeId: string) => {
    setActingOn(tradeId);
    await fulfillOpenTrade(tradeId);
    setActingOn(null);
  };

  const trades: Trade[] =
    tab === "incoming"
      ? incomingTrades
      : tab === "outgoing"
        ? outgoingTrades
        : tab === "open"
          ? openTrades
          : [];

  const pendingIncoming = incomingTrades.filter(
    (t) => t.status === "pending"
  ).length;

  const tabItems: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      key: "incoming",
      label: "Incoming",
      icon: <Inbox className="h-4 w-4" />,
      badge: pendingIncoming > 0 ? pendingIncoming : undefined,
    },
    {
      key: "outgoing",
      label: "Outgoing",
      icon: <Send className="h-4 w-4" />,
    },
    {
      key: "open",
      label: "Open Offers",
      icon: <Globe className="h-4 w-4" />,
      badge: openTrades.length > 0 ? openTrades.length : undefined,
    },
    {
      key: "wishlist",
      label: "Wishlist",
      icon: <Heart className="h-4 w-4" />,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trades</h1>
          <p className="text-sm text-white/40">
            Send and receive card trade offers
          </p>
        </div>
        <GlowButton variant="orange" onClick={() => setCreateOpen(true)}>
          New Trade
        </GlowButton>
      </div>

      {/* Tab bar */}
      <div className="mb-4 flex rounded-lg border border-white/10 p-0.5">
        {tabItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors sm:gap-2 sm:text-sm ${
              tab === item.key
                ? "bg-orange-500/20 text-orange-400"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {item.icon}
            <span className="hidden sm:inline">{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "wishlist" ? (
        <WishlistSection />
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      ) : trades.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          {tab === "open" ? (
            <Globe className="h-10 w-10 text-white/20" />
          ) : (
            <ArrowLeftRight className="h-10 w-10 text-white/20" />
          )}
          <p className="text-sm text-white/40">
            {tab === "incoming"
              ? "No incoming trades"
              : tab === "outgoing"
                ? "No outgoing trades"
                : "No open offers available"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trades.map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              perspective={tab as "incoming" | "outgoing" | "open"}
              acting={actingOn === trade.id}
              onAccept={
                tab === "incoming" ? () => handleAccept(trade.id) : undefined
              }
              onDecline={
                tab === "incoming" ? () => handleDecline(trade.id) : undefined
              }
              onCancel={
                tab === "outgoing" ? () => handleCancel(trade.id) : undefined
              }
              onFulfill={
                tab === "open" ? () => handleFulfill(trade.id) : undefined
              }
            />
          ))}
        </div>
      )}

      <CreateTradeModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
