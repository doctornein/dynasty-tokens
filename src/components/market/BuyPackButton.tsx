"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pack } from "@/types";
import { GlowButton } from "@/components/ui/GlowButton";
import { useAuthStore } from "@/stores/authStore";
import { useMarketStore } from "@/stores/marketStore";
import { formatTokenAmount } from "@/lib/formatters";
import { ShoppingCart, AlertCircle, Loader2 } from "lucide-react";

interface BuyPackButtonProps {
  pack: Pack;
}

export function BuyPackButton({ pack }: BuyPackButtonProps) {
  const router = useRouter();
  const { isAuthenticated, profile } = useAuthStore();
  const purchasePack = useMarketStore((s) => s.purchasePack);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const authenticated = isAuthenticated();
  const balance = profile?.balance ?? 0;
  const canAfford = balance >= pack.price;
  const inStock = pack.remaining > 0;

  const handleBuy = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await purchasePack(pack.id);
      if (result.success) {
        router.push(`/open/${pack.id}`);
      } else {
        setError(result.error ?? "Purchase failed");
      }
    } catch {
      setError("Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <Link href="/signup" className="block">
        <GlowButton variant="gold" size="lg" className="w-full">
          Sign up to purchase
        </GlowButton>
      </Link>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <GlowButton
        onClick={handleBuy}
        disabled={!canAfford || !inStock || loading}
        variant="gold"
        size="lg"
        className="w-full"
      >
        <span className="flex items-center justify-center gap-2">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ShoppingCart className="h-5 w-5" />
          )}
          {loading
            ? "Purchasing..."
            : !inStock
              ? "Sold Out"
              : !canAfford
                ? `Need ${formatTokenAmount(pack.price - balance)} more`
                : `Buy for ${formatTokenAmount(pack.price)}`}
        </span>
      </GlowButton>
    </div>
  );
}
