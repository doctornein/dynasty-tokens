"use client";

import { useAuthStore } from "@/stores/authStore";
import { formatTokenAmount, formatRelativeTime } from "@/lib/formatters";
import { Transaction } from "@/types";
import { ShoppingCart, Gift, ArrowDownRight, ArrowUpRight, Trophy, Coins, Gavel, Swords } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useEffect, useState } from "react";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pack_purchase: ShoppingCart,
  airdrop_claim: Gift,
  airdrop_redeem: Coins,
  reward_claim: Trophy,
  reward_redeem: Coins,
  auction_bid: Gavel,
  auction_refund: ArrowDownRight,
  auction_sale: Coins,
  auction_buy: Gavel,
  arena_wager: Swords,
  arena_win: Swords,
  arena_refund: Swords,
};

const PAGE_SIZE = 10;

export function TransactionList() {
  const { transactions, isAuthenticated, fetchTransactions } = useAuthStore();
  const [page, setPage] = useState(0);
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (authenticated) {
      fetchTransactions();
    }
  }, [authenticated, fetchTransactions]);

  if (!authenticated) {
    return (
      <div className="py-20 text-center text-white/40">
        Sign in to view transaction history.
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-20 text-center text-white/40">
        No transactions yet. Buy a pack to get started!
      </div>
    );
  }

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const paginated = transactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div>
      <div className="space-y-3">
        {paginated.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-lg px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-sm text-white/40">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/10 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const Icon = typeIcons[tx.type] ?? ShoppingCart;
  const isDebit = tx.amount < 0;

  return (
    <GlassPanel className="flex items-center gap-4 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isDebit ? "bg-red-500/10" : tx.amount > 0 ? "bg-emerald-500/10" : "bg-white/10"}`}>
        <Icon className={`h-5 w-5 ${isDebit ? "text-red-400" : tx.amount > 0 ? "text-emerald-400" : "text-white/40"}`} />
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium text-white">{tx.description}</p>
        <p className="text-xs text-white/30">{formatRelativeTime(new Date(tx.timestamp))}</p>
      </div>

      {tx.amount !== 0 && (
        <div className="flex items-center gap-1">
          {isDebit ? (
            <ArrowUpRight className="h-4 w-4 text-red-400" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-emerald-400" />
          )}
          <span className={`text-sm font-bold ${isDebit ? "text-red-400" : "text-emerald-400"}`}>
            {isDebit ? "-" : "+"}{formatTokenAmount(Math.abs(tx.amount))}
          </span>
        </div>
      )}
    </GlassPanel>
  );
}
