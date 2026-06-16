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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Choice = "HEADS" | "TAILS";
type Outcome = "WIN" | "LOSE";

interface BetRecord {
  id: number;
  choice: Choice;
  result: Choice;
  outcome: Outcome;
  amount: number;
  payout: number;
  timestamp: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BETS = [10, 25, 50, 100, 250, 500] as const;
const MULTIPLIER = 1.95;
const FLIP_DURATION = 1200; // ms — matches CSS animation

/* ------------------------------------------------------------------ */
/*  Sound helpers (tiny inline audio)                                  */
/* ------------------------------------------------------------------ */

function playFlipSound() {
  try {
    const ctx = new AudioContext();
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
  } catch {
    /* audio not available */
  }
}

function playWinSound() {
  try {
    const ctx = new AudioContext();
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
  } catch {
    /* audio not available */
  }
}

function playLoseSound() {
  try {
    const ctx = new AudioContext();
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
  } catch {
    /* audio not available */
  }
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function CoinFlipApp() {
  // State
  const [balance, setBalance] = useState(1000);
  const [selectedBet, setSelectedBet] = useState<number>(50);
  const [selectedSide, setSelectedSide] = useState<Choice>("HEADS");
  const [flipping, setFlipping] = useState(false);
  const [coinResult, setCoinResult] = useState<Choice>("HEADS");
  const [lastOutcome, setLastOutcome] = useState<Outcome | null>(null);
  const [lastPayout, setLastPayout] = useState(0);
  const [history, setHistory] = useState<BetRecord[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const flipIdRef = useRef(0);

  // Derived stats
  const stats = useMemo(() => {
    const totalBets = history.length;
    const wins = history.filter((h) => h.outcome === "WIN").length;
    const losses = totalBets - wins;
    const totalWagered = history.reduce((s, h) => s + h.amount, 0);
    const totalPayout = history.reduce((s, h) => s + h.payout, 0);
    const profit = totalPayout - totalWagered;
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

    // Streak
    let currentStreak = 0;
    let streakType: Outcome | null = null;
    for (let i = history.length - 1; i >= 0; i--) {
      if (streakType === null) {
        streakType = history[i].outcome;
        currentStreak = 1;
      } else if (history[i].outcome === streakType) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { totalBets, wins, losses, totalWagered, totalPayout, profit, winRate, currentStreak, streakType };
  }, [history]);

  // Reset balance
  const resetBalance = () => {
    setBalance(1000);
    setHistory([]);
    setLastOutcome(null);
    setShowResult(false);
    setCoinResult("HEADS");
  };

  // Determine coin class during flip — we need to set the target BEFORE flip ends
  // Actually we pick result at the end, so during flip we animate to the selected side
  // But since result is random, we compute it before the timeout and set css immediately
  const [flipAnimClass, setFlipAnimClass] = useState("coin show-heads");

  useEffect(() => {
    if (!flipping) {
      setFlipAnimClass(coinResult === "HEADS" ? "coin show-heads" : "coin show-tails");
    }
  }, [flipping, coinResult]);

  const handleFlip = useCallback(
    (side: Choice) => {
      if (flipping) return;
      if (balance < selectedBet) return;

      setSelectedSide(side);
      setShowResult(false);
      setLastOutcome(null);

      if (soundOn) playFlipSound();

      // Deduct bet
      setBalance((b) => b - selectedBet);

      // Determine result NOW so animation can target it
      const result: Choice = Math.random() < 0.5 ? "HEADS" : "TAILS";
      const won = result === side;
      const payout = won ? Math.round(selectedBet * MULTIPLIER) : 0;

      // Start flip animation toward result
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
          id: Date.now(),
          choice: side,
          result,
          outcome: won ? "WIN" : "LOSE",
          amount: selectedBet,
          payout,
          timestamp: Date.now(),
        };
        setHistory((prev) => [...prev, record]);
      }, FLIP_DURATION);
    },
    [flipping, balance, selectedBet, soundOn]
  );

  const insufficientBalance = balance < selectedBet;

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        {/* ===== HEADER ===== */}
        <header className="flex items-center justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)]">
              <Coins className="h-5 w-5 text-[#3a2508]" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-white sm:text-xl">
                Coin Flip
              </h1>
              <p className="text-xs text-slate-400">Pick a side &amp; flip</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundOn(!soundOn)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--card-border)] bg-white/5 text-slate-400 transition hover:text-white"
              title={soundOn ? "Mute" : "Unmute"}
              id="sound-toggle"
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={resetBalance}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-white/5 px-3 py-2 text-xs text-slate-400 transition hover:text-white"
              title="Reset balance and history"
              id="reset-button"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </header>

        {/* ===== BALANCE BAR ===== */}
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4 sm:flex-row sm:justify-between">
          <div className="text-xs font-medium uppercase tracking-widest text-slate-500">
            Balance
          </div>
          <div className="font-display text-3xl font-bold text-[var(--gold)]">
            ${balance.toLocaleString()}
          </div>
        </div>

        {/* ===== MAIN GAME AREA ===== */}
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Left: Game */}
          <div className="flex flex-col gap-5">
            {/* Coin + Result */}
            <div
              className={`relative flex flex-col items-center gap-6 rounded-2xl border bg-[var(--card)] px-6 py-10 ${
                showResult && lastOutcome === "WIN"
                  ? "border-[var(--green)]/40 result-win"
                  : showResult && lastOutcome === "LOSE"
                  ? "border-[var(--red)]/40 result-lose"
                  : "border-[var(--card-border)]"
              }`}
            >
              {/* Coin */}
              <div className="coin-wrapper">
                <div className={flipAnimClass}>
                  <div className="coin-face coin-heads">
                    <span>H</span>
                  </div>
                  <div className="coin-face coin-tails">
                    <span>T</span>
                  </div>
                </div>
              </div>

              {/* Result message */}
              {showResult && lastOutcome && (
                <div className="animate-fade-in-up text-center">
                  {lastOutcome === "WIN" ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2 text-2xl font-bold text-[var(--green)]">
                        <Trophy className="h-6 w-6" />
                        You Won!
                      </div>
                      <div className="text-lg font-semibold text-[var(--green)]">
                        +${lastPayout.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-[var(--red)]">
                        You Lost
                      </div>
                      <div className="text-lg font-semibold text-[var(--red)]">
                        -${selectedBet.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!showResult && !flipping && (
                <p className="text-sm text-slate-500">
                  Choose a side below and flip!
                </p>
              )}

              {flipping && (
                <p className="text-sm text-slate-400 animate-pulse">
                  Flipping...
                </p>
              )}
            </div>

            {/* Bet Amount Selection */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-5">
              <div className="mb-3 text-xs font-medium uppercase tracking-widest text-slate-500">
                Bet Amount
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {BETS.map((bet) => (
                  <button
                    key={bet}
                    onClick={() => setSelectedBet(bet)}
                    disabled={flipping}
                    className={`rounded-xl px-3 py-3 text-center text-sm font-semibold transition ${
                      selectedBet === bet
                        ? "bg-gradient-to-b from-[var(--gold)] to-[var(--gold-dark)] text-[#3a2508] shadow-lg shadow-[var(--gold)]/20"
                        : "border border-[var(--card-border)] bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                    } ${flipping ? "opacity-50 cursor-not-allowed" : ""}`}
                    id={`bet-${bet}`}
                  >
                    ${bet}
                  </button>
                ))}
              </div>
            </div>

            {/* Flip Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleFlip("HEADS")}
                disabled={flipping || insufficientBalance}
                className={`group relative overflow-hidden rounded-2xl px-6 py-5 text-lg font-bold transition ${
                  flipping || insufficientBalance
                    ? "cursor-not-allowed bg-slate-800 text-slate-600"
                    : "bg-gradient-to-br from-[var(--gold-light)] via-[var(--gold)] to-[var(--gold-dark)] text-[#3a2508] hover:shadow-lg hover:shadow-[var(--gold)]/30 hover:-translate-y-0.5 active:translate-y-0"
                }`}
                id="flip-heads"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  👑 HEADS
                </span>
              </button>
              <button
                onClick={() => handleFlip("TAILS")}
                disabled={flipping || insufficientBalance}
                className={`group relative overflow-hidden rounded-2xl px-6 py-5 text-lg font-bold transition ${
                  flipping || insufficientBalance
                    ? "cursor-not-allowed bg-slate-800 text-slate-600"
                    : "bg-gradient-to-br from-[#e0e0e0] via-[#a0a0a0] to-[#707070] text-[#1a1a1a] hover:shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 active:translate-y-0"
                }`}
                id="flip-tails"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  🪙 TAILS
                </span>
              </button>
            </div>

            {insufficientBalance && !flipping && (
              <div className="animate-fade-in-up rounded-xl border border-[var(--red)]/30 bg-[var(--red)]/10 px-4 py-3 text-center text-sm text-[var(--red)]">
                Insufficient balance. Lower your bet or reset.
              </div>
            )}
          </div>

          {/* Right: Stats + History */}
          <div className="flex flex-col gap-5">
            {/* Stats Grid */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-5">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-500">
                <TrendingUp className="h-3.5 w-3.5" />
                Statistics
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Total Flips" value={String(stats.totalBets)} />
                <StatBox label="Win Rate" value={stats.totalBets > 0 ? `${stats.winRate.toFixed(1)}%` : "--"} />
                <StatBox label="Wins" value={String(stats.wins)} color="green" />
                <StatBox label="Losses" value={String(stats.losses)} color="red" />
                <StatBox
                  label="Profit / Loss"
                  value={`${stats.profit >= 0 ? "+" : ""}$${stats.profit.toLocaleString()}`}
                  color={stats.profit >= 0 ? "green" : "red"}
                />
                <StatBox
                  label="Streak"
                  value={
                    stats.currentStreak > 0
                      ? `${stats.currentStreak} ${stats.streakType === "WIN" ? "W" : "L"}`
                      : "--"
                  }
                  color={stats.streakType === "WIN" ? "green" : stats.streakType === "LOSE" ? "red" : undefined}
                />
              </div>
            </div>

            {/* Quick info */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Win Multiplier</span>
                <span className="font-display text-sm font-bold text-[var(--gold)]">{MULTIPLIER}x</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Potential Win</span>
                <span className="font-display text-sm font-bold text-[var(--green)]">
                  ${Math.round(selectedBet * MULTIPLIER).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Win Chance</span>
                <span className="font-display text-sm font-bold text-white">50%</span>
              </div>
            </div>

            {/* History */}
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-5">
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-slate-500">
                <History className="h-3.5 w-3.5" />
                Recent Flips
              </div>

              {history.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-600">
                  No flips yet. Make your first bet!
                </p>
              ) : (
                <div className="flex max-h-[340px] flex-col gap-2 overflow-y-auto pr-1">
                  {[...history].reverse().map((h) => (
                    <div
                      key={h.id}
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${
                        h.outcome === "WIN"
                          ? "border-[var(--green)]/20 bg-[var(--green)]/5"
                          : "border-[var(--red)]/20 bg-[var(--red)]/5"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                            h.outcome === "WIN"
                              ? "bg-[var(--green)]/20 text-[var(--green)]"
                              : "bg-[var(--red)]/20 text-[var(--red)]"
                          }`}
                        >
                          {h.outcome === "WIN" ? "W" : "L"}
                        </span>
                        <span className="text-slate-400">
                          {h.choice} → {h.result}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-sm font-semibold ${
                          h.outcome === "WIN" ? "text-[var(--green)]" : "text-[var(--red)]"
                        }`}
                      >
                        {h.outcome === "WIN" ? `+$${h.payout}` : `-$${h.amount}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-slate-600">
          This is a simulated coin flip game for entertainment purposes only.
        </footer>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Box                                                            */
/* ------------------------------------------------------------------ */

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "green" | "red";
}) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-white/[0.03] px-3 py-3">
      <div className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
        {label}
      </div>
      <div
        className={`mt-1.5 font-display text-xl font-bold ${
          color === "green"
            ? "text-[var(--green)]"
            : color === "red"
            ? "text-[var(--red)]"
            : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
