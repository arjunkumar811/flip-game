"use client";

import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Coins, LoaderCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Choice, useCoinFlip } from "@/lib/hooks/use-coin-flip";
import { ResultModal } from "./result-modal";

const bets = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6] as const;

export function GamePanel() {
  const { publicKey } = useWallet();
  const [selectedBet, setSelectedBet] = useState<number>(0.1);
  const [selectedSide, setSelectedSide] = useState<Choice>("HEADS");
  const [modalOpen, setModalOpen] = useState(false);
  const { error, pending, result, play } = useCoinFlip();
  const displayedFace = pending ? selectedSide : result?.result ?? selectedSide;

  const currentState = useMemo(() => {
    if (!result) {
      return {
        title: "Awaiting your call",
        message: "Pick heads or tails, sign once, and the on-chain flow handles the rest."
      };
    }

    return result.outcome === "WIN"
      ? {
          title: "You won",
          message: `Payout ${result.payout.toFixed(4)} SOL sent after settlement.`
        }
      : {
          title: "House took this one",
          message: `Result landed ${result.result.toLowerCase()}. Better luck on the next block.`
        };
  }, [result]);

  async function handlePlay(side: Choice) {
    setSelectedSide(side);
    const settled = await play({ amount: selectedBet, choice: side });
    if (settled) {
      setModalOpen(true);
    }
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-glow backdrop-blur lg:p-8">
        <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-cyan/10 blur-3xl" />
        <div className="absolute bottom-4 right-4 h-56 w-56 rounded-full bg-ember/10 blur-3xl" />

        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-mint" />
                Main table
              </div>
              <h2 className="font-display text-3xl font-semibold text-white">Choose the wager. Call the side. Send it on-chain.</h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-300">
                Each win pays <span className="font-mono text-cyan">bet x 1.998</span>. Randomness is requested through VRF and the contract blocks replay, double claims, and out-of-range bets.
              </p>
            </div>

            <div className="grid gap-3 rounded-[24px] border border-white/10 bg-night/70 p-4 text-sm text-slate-300 sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Bet</div>
                <div className="mt-2 font-mono text-lg text-white">{selectedBet.toFixed(1)} SOL</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Side</div>
                <div className="mt-2 font-mono text-lg text-white">{selectedSide}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {bets.map((bet) => (
                  <button
                    key={bet}
                    type="button"
                    onClick={() => setSelectedBet(bet)}
                    className={cn(
                      "rounded-[22px] border px-4 py-4 text-left transition duration-200",
                      selectedBet === bet
                        ? "border-cyan/60 bg-cyan/15 text-white shadow-[0_0_0_1px_rgba(94,242,255,0.24)]"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                    )}
                  >
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Stake</div>
                    <div className="mt-2 font-display text-2xl font-semibold">{bet.toFixed(1)}</div>
                    <div className="mt-1 text-xs text-slate-400">SOL</div>
                  </button>
                ))}
              </div>

              <div className="rounded-[24px] border border-white/10 bg-night/60 p-4">
                <div className="mb-3 inline-flex items-center gap-2 text-sm text-slate-300">
                  <Coins className="h-4 w-4 text-cyan" />
                  Heads or tails
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["HEADS", "TAILS"] as Choice[]).map((side) => (
                    <button
                      key={side}
                      type="button"
                      disabled={pending || !publicKey || Boolean(error)}
                      onClick={() => void handlePlay(side)}
                      className={cn(
                        "rounded-[24px] px-5 py-5 text-lg font-semibold transition",
                        pending || !publicKey
                          ? "cursor-not-allowed border border-white/10 bg-white/5 text-slate-500"
                          : side === "HEADS"
                            ? "bg-[linear-gradient(135deg,#5ef2ff,#5bffa5)] text-slate-950 hover:-translate-y-0.5"
                            : "bg-[linear-gradient(135deg,#ffd36d,#ff9766)] text-slate-950 hover:-translate-y-0.5"
                      )}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {pending && selectedSide === side ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
                        {side}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="grid min-h-[340px] place-items-center rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(94,242,255,0.15),rgba(255,255,255,0.04)_42%,rgba(255,255,255,0.02)_100%)] p-6">
                <div className="relative grid place-items-center">
                  <div className={cn("grid h-56 w-56 place-items-center rounded-full border-[14px] border-[#f2d27a] bg-[linear-gradient(135deg,#fff7bf,#dda52b_48%,#795712)] text-7xl font-black text-slate-900 shadow-2xl", pending && "animate-flip")}>
                    {displayedFace === "HEADS" ? "H" : "T"}
                  </div>
                  {pending ? <div className="absolute h-60 w-60 rounded-full animate-pulseRing" /> : null}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Status</div>
                <div className="mt-3 font-display text-2xl text-white">{currentState.title}</div>
                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-300">{currentState.message}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Stat label="Wallet" value={publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : "Connect"} />
                  <Stat label="House Edge" value="0.1%" />
                  <Stat label="Max Payout" value={`${(selectedBet * 1.998).toFixed(4)} SOL`} />
                </div>
                {error ? <p className="mt-4 text-sm text-amber-300">{error}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ResultModal open={modalOpen} onClose={() => setModalOpen(false)} result={result} />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-night/70 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 font-mono text-sm text-white">{value}</div>
    </div>
  );
}
