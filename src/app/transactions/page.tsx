"use client";

import { TransactionList } from "@/components/wallet/TransactionList";
import { Receipt } from "lucide-react";

export default function TransactionsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Receipt className="h-8 w-8 text-white/60" />
        <div>
          <h1 className="text-3xl font-bold text-white">Transaction History</h1>
          <p className="text-sm text-white/40">All your pack purchases and reward redemptions</p>
        </div>
      </div>
      <TransactionList />
    </div>
  );
}
