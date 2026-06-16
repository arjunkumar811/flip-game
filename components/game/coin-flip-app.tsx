"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Coins,
  History,
  TrendingUp,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

type Choice = "HEADS" | "TAILS";
type Outcome = "WIN" | "LOSE";

interface BetRecord {
  id: string;
  choice: Choice;
  result: Choice;
  outcome: Outcome;
  amount: number;
  payout: number;
  timestamp: number;
}

const BETS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
const FLIP_DURATION = 1200; 

function playFlipSound() {
  try {
    const ctx = new window.AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 600;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

function playWinSound() {
  try {
    const ctx = new window.AudioContext();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {}
}

function playLoseSound() {
  try {
    const ctx = new window.AudioContext();
    [400, 300].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch {}
}

export function CoinFlipApp() {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(10); // Simulated SOL balance for testing
  const [selectedBet, setSelectedBet] = useState<number>(0.1);
  const [selectedSide, setSelectedSide] = useState<Choice>("HEADS");
  const [flipping, setFlipping] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [coinResult, setCoinResult] = useState<Choice>("HEADS");
  const [lastOutcome, setLastOutcome] = useState<Outcome | null>(null);
  const [lastPayout, setLastPayout] = useState(0);
  const [history, setHistory] = useState<BetRecord[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [platformFeePercent, setPlatformFeePercent] = useState<number>(5);
  
  const flipIdRef = useRef(0);
  const walletAddress = publicKey ? publicKey.toBase58() : "GuestWallet123";

  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => setPlatformFeePercent(data.feePercentage))
      .catch(console.error);
  }, []);

  const prizePool = selectedBet * 2;
  const platformFee = (prizePool * platformFeePercent) / 100;
  const potentialWin = prizePool - platformFee;

  const stats = useMemo(() => {
    const totalBets = history.length;
    const wins = history.filter((h) => h.outcome === "WIN").length;
    const losses = totalBets - wins;
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
    
    let profit = 0;
    history.forEach(h => {
        profit += h.outcome === "WIN" ? (h.payout - h.amount) : -h.amount;
    });

    return { totalBets, wins, losses, profit, winRate };
  }, [history]);

  const handleFlip = async (side: Choice) => {
    if (flipping || waiting) return;
    if (balance < selectedBet) return;

    setSelectedSide(side);
    setShowResult(false);
    setLastOutcome(null);
    setWaiting(true);

    if (soundOn) playFlipSound();

    setBalance((b) => b - selectedBet);

    try {
      // 1. Create or join match
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, betAmount: selectedBet, choice: side })
      });
      const data = await res.json();
      let match = data.match;

      // 2. If waiting, simulate opponent joining after a tiny delay
      if (data.action === "created") {
        await new Promise(r => setTimeout(r, 1000)); // wait a bit
        const simRes = await fetch(`/api/matches/${match.id}/simulate-join`, { method: "POST" });
        match = await simRes.json();
      }

      setWaiting(false);
      
      const result: Choice = match.result;
      const won = match.winnerWallet === walletAddress;
      const payout = won ? match.payout : 0;

      setFlipping(true);
      setFlipAnimClass(result === "HEADS" ? "coin flip-to-heads" : "coin flip-to-tails");

      const id = ++flipIdRef.current;

      setTimeout(() => {
        if (flipIdRef.current !== id) return;

        setCoinResult(result);
        setLastOutcome(won ? "WIN" : "LOSE");
        setLastPayout(payout);
        setFlipping(false);
        setShowResult(true);

        if (won) {
          setBalance((b) => b + payout);
          if (soundOn) playWinSound();
        } else {
          if (soundOn) playLoseSound();
        }

        const record: BetRecord = {
          id: match.id,
          choice: side,
          result,
          outcome: won ? "WIN" : "LOSE",
          amount: selectedBet,
          payout,
          timestamp: Date.now(),
        };
        setHistory((prev) => [...prev, record]);
      }, FLIP_DURATION);

    } catch (e) {
      console.error(e);
      setWaiting(false);
      setBalance(b => b + selectedBet); // refund on error
    }
  };

  const [flipAnimClass, setFlipAnimClass] = useState("coin show-heads");
  useEffect(() => {
    if (!flipping) {
      setFlipAnimClass(coinResult === "HEADS" ? "coin show-heads" : "coin show-tails");
    }
  }, [flipping, coinResult]);

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="flex items-center justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)]">
              <Coins className="h-5 w-5 text-[#3a2508]" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-white sm:text-xl">PvP Coin Flip</h1>
              <p className="text-xs text-slate-400">Multiplayer matches</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WalletMultiButton />
          </div>
        </header>

        <div className="flex flex-col items-center gap-1 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 sm:flex-row sm:justify-between">
          <div className="text-xs font-medium uppercase tracking-widest text-slate-500">
            {publicKey ? "Simulated SOL Balance" : "Simulated Guest Balance"}
          </div>
          <div className="font-display text-3xl font-bold text-[var(--gold)]">
            {balance.toFixed(2)} SOL
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5">
            <div className={`relative flex flex-col items-center gap-6 rounded-2xl border bg-[var(--card)] px-6 py-10 ${showResult && lastOutcome === "WIN" ? "border-[var(--green)]/40 result-win" : showResult && lastOutcome === "LOSE" ? "border-[var(--red)]/40 result-lose" : "border-[var(--card-border)]"}`}>
              <div className="coin-wrapper">
                <div className={flipAnimClass}>
                  <div className="coin-face coin-heads"><span>H</span></div>
                  <div className="coin-face coin-tails"><span>T</span></div>
                </div>
              </div>
              {showResult && lastOutcome && (
                <div className="animate-fade-in-up text-center">
                  {lastOutcome === "WIN" ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2 text-2xl font-bold text-[var(--green)]">
                        <Trophy className="h-6 w-6" /> You Won!
                      </div>
                      <div className="text-lg font-semibold text-[var(--green)]">+{lastPayout.toFixed(4)} SOL</div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-[var(--red)]">You Lost</div>
                      <div className="text-lg font-semibold text-[var(--red)]">-{selectedBet.toFixed(2)} SOL</div>
                    </div>
                  )}
                </div>
              )}
              {!showResult && !flipping && !waiting && <p className="text-sm text-slate-500">Choose a side to enter matchmaking!</p>}
              {waiting && <p className="text-sm text-amber-400 animate-pulse">Finding Opponent...</p>}
              {flipping && <p className="text-sm text-slate-400 animate-pulse">Flipping...</p>}
            </div>

            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-5">
              <div className="mb-3 flex justify-between items-center text-xs font-medium uppercase tracking-widest text-slate-500">
                <span>Bet Amount (SOL)</span>
                <span className="text-[var(--gold)]">Fee: {platformFeePercent}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 mb-4">
                {BETS.map((bet) => (
                  <button key={bet} onClick={() => setSelectedBet(bet)} disabled={flipping || waiting} className={`rounded-xl px-2 py-3 text-center text-sm font-semibold transition ${selectedBet === bet ? "bg-gradient-to-b from-[var(--gold)] to-[var(--gold-dark)] text-[#3a2508] shadow-lg shadow-[var(--gold)]/20" : "border border-[var(--card-border)] bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"}`}>
                    {bet}
                  </button>
                ))}
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-4 text-sm border border-slate-700">
                <div className="flex justify-between mb-1"><span className="text-slate-400">Total Prize Pool</span><span>{prizePool.toFixed(2)} SOL</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-400">Platform Fee (-{platformFeePercent}%)</span><span className="text-[var(--red)]">-{platformFee.toFixed(4)} SOL</span></div>
                <div className="flex justify-between font-bold border-t border-slate-700 pt-2 mt-2"><span className="text-white">Winner Payout</span><span className="text-[var(--green)]">{potentialWin.toFixed(4)} SOL</span></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleFlip("HEADS")} disabled={flipping || waiting || balance < selectedBet} className="group relative overflow-hidden rounded-2xl px-6 py-5 text-lg font-bold bg-gradient-to-br from-[var(--gold-light)] via-[var(--gold)] to-[var(--gold-dark)] text-[#3a2508] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">👑 HEADS</button>
              <button onClick={() => handleFlip("TAILS")} disabled={flipping || waiting || balance < selectedBet} className="group relative overflow-hidden rounded-2xl px-6 py-5 text-lg font-bold bg-gradient-to-br from-[#e0e0e0] via-[#a0a0a0] to-[#707070] text-[#1a1a1a] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">🪙 TAILS</button>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-5">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-500"><TrendingUp className="h-3.5 w-3.5" /> Statistics</div>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Win Rate" value={stats.totalBets > 0 ? `${stats.winRate.toFixed(1)}%` : "--"} />
                <StatBox label="Profit / Loss" value={`${stats.profit >= 0 ? "+" : ""}${stats.profit.toFixed(2)}`} color={stats.profit >= 0 ? "green" : "red"} />
                <StatBox label="Wins" value={String(stats.wins)} color="green" />
                <StatBox label="Losses" value={String(stats.losses)} color="red" />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-5">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-500"><History className="h-3.5 w-3.5" /> Recent Flips</div>
              {history.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-600">No flips yet.</p>
              ) : (
                <div className="flex max-h-[340px] flex-col gap-2 overflow-y-auto pr-1">
                  {[...history].reverse().map((h) => (
                    <div key={h.id} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${h.outcome === "WIN" ? "border-[var(--green)]/20 bg-[var(--green)]/5" : "border-[var(--red)]/20 bg-[var(--red)]/5"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${h.outcome === "WIN" ? "bg-[var(--green)]/20 text-[var(--green)]" : "bg-[var(--red)]/20 text-[var(--red)]"}`}>{h.outcome === "WIN" ? "W" : "L"}</span>
                        <span className="text-slate-400">{h.choice} → {h.result}</span>
                      </div>
                      <span className={`font-mono text-sm font-semibold ${h.outcome === "WIN" ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{h.outcome === "WIN" ? `+${h.payout.toFixed(3)}` : `-${h.amount.toFixed(2)}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: "green" | "red" }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-white/[0.03] px-3 py-3">
      <div className="text-[10px] font-medium uppercase tracking-widest text-slate-500">{label}</div>
      <div className={`mt-1.5 font-display text-xl font-bold ${color === "green" ? "text-[var(--green)]" : color === "red" ? "text-[var(--red)]" : "text-white"}`}>{value}</div>
    </div>
  );
}
