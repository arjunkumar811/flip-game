"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ShieldCheck } from "lucide-react";
import { WalletBalance } from "@/components/solana/wallet-balance";

export function Header() {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Solana Coin Flip
          </div>
          <div className="max-w-2xl space-y-1">
            <h1 className="font-display text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
              Simple one-page coin flip app
            </h1>
            <p className="text-sm text-slate-600">
              Connect a wallet, choose a side, place a bet, and review the latest stats in one screen.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <WalletBalance />
          <WalletMultiButton />
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            On-chain settlement
          </div>
        </div>
      </div>
    </header>
  );
}
