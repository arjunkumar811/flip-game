"use client";

import { X } from "lucide-react";
import { CoinFlipOutcome } from "@/lib/hooks/use-coin-flip";
import { cn } from "@/lib/utils";

export function ResultModal({
  open,
  onClose,
  result
}: {
  open: boolean;
  onClose: () => void;
  result: CoinFlipOutcome | null;
}) {
  if (!open || !result) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-night p-6 shadow-glow">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Round settled</div>
            <h3 className="mt-2 font-display text-3xl font-semibold text-white">{result.outcome === "WIN" ? "Win" : "Lose"}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <ModalRow label="Choice" value={result.choice} />
          <ModalRow label="Result" value={result.result} />
          <ModalRow label="Bet" value={`${result.amount.toFixed(4)} SOL`} />
          <ModalRow
            label={result.outcome === "WIN" ? "Payout" : "Loss"}
            value={`${(result.outcome === "WIN" ? result.payout : result.amount).toFixed(4)} SOL`}
            emphasize
          />
          <ModalRow label="Signature" value={`${result.signature.slice(0, 8)}...${result.signature.slice(-8)}`} />
        </div>

        <div
          className={cn(
            "mt-6 rounded-[20px] border px-4 py-4 text-sm leading-6",
            result.outcome === "WIN"
              ? "border-mint/30 bg-mint/10 text-mint"
              : "border-ember/30 bg-ember/10 text-ember"
          )}
        >
          {result.outcome === "WIN"
            ? "The contract marked the round as claimable, sent the win payout, and stored the bet record in PostgreSQL."
            : "The contract recorded the loss, the vault retained the stake, and the indexed game row is available in the dashboard."}
        </div>
      </div>
    </div>
  );
}

function ModalRow({
  label,
  value,
  emphasize = false
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={cn("font-mono text-sm text-white", emphasize && "text-base text-cyan")}>{value}</span>
    </div>
  );
}
