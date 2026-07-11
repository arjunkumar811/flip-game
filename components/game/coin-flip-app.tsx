"use client";

import React, { useCallback, useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  Volume2,
  VolumeX,
  Flame,
  PlusCircle,
  RotateCcw,
  Wallet,
  Sparkles,
  Crown,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

import { Coin3D, type Choice, type Outcome } from "./coin-3d";
import { FlipControls } from "./flip-controls";
import { FlipHistory, type FlipRecord } from "./flip-history";
import { soundEngine } from "./sound-utils";

export function CoinFlipApp() {
  // Game State
  const [balance, setBalance] = useState<number>(1000);
  const [betAmount, setBetAmount] = useState<number>(50);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [targetFace, setTargetFace] = useState<Choice>("HEADS");
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [history, setHistory] = useState<FlipRecord[]>([]);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Trigger celebration confetti on Win
  const triggerWinConfetti = useCallback(() => {
    try {
      const count = 180;
      const defaults = {
        origin: { y: 0.65 },
        zIndex: 1000,
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ["#f59e0b", "#10b981", "#fbbf24"],
      });
      fire(0.2, {
        spread: 60,
        colors: ["#f59e0b", "#38bdf8"],
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
    } catch {
      // Gracefully handle any canvas confetti error
    }
  }, []);

  // MASTER COIN FLIP HANDLER
  const handleFlip = useCallback(
    (choice: Choice) => {
      if (isFlipping) return;
      if (betAmount > balance || betAmount <= 0) return;

      soundEngine.playClick();
      setIsFlipping(true);
      setSelectedChoice(choice);
      setOutcome(null);

      // Deduct wager immediately from balance when button is clicked
      setBalance((prev) => prev - betAmount);

      // Play coin whirring audio
      soundEngine.playFlipSpin();

      // Cryptographically secure 50/50 fair result
      const cryptoArray = new Uint32Array(1);
      window.crypto.getRandomValues(cryptoArray);
      const isLandedHeads = cryptoArray[0] % 2 === 0;
      const landedResult: Choice = isLandedHeads ? "HEADS" : "TAILS";

      setTargetFace(landedResult);

      // Animation finishes after 1600ms
      setTimeout(() => {
        setIsFlipping(false);

        const didWin = choice === landedResult;
        const payout = didWin ? betAmount * 2 : 0;

        if (didWin) {
          setOutcome("WIN");
          setBalance((prev) => prev + payout);
          setStreak((prev) => {
            const next = prev + 1;
            if (next > bestStreak) setBestStreak(next);
            return next;
          });
          soundEngine.playWin();
          triggerWinConfetti();
        } else {
          setOutcome("LOSE");
          setStreak(0);
          soundEngine.playLose();
        }

        // Add record to flip history log
        const newRecord: FlipRecord = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          choice,
          result: landedResult,
          outcome: didWin ? "WIN" : "LOSE",
          wager: betAmount,
          payout,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        };

        setHistory((prev) => [newRecord, ...prev]);
      }, 1600);
    },
    [isFlipping, betAmount, balance, bestStreak, triggerWinConfetti]
  );

  // Keyboard shortcut listener ('H' for Heads, 'T' for Tails)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        handleFlip("HEADS");
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        handleFlip("TAILS");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFlip]);

  // Balance reload & reset helpers
  const handleTopUp = () => {
    soundEngine.playClick();
    setBalance((prev) => prev + 500);
  };

  const handleResetBalance = () => {
    soundEngine.playClick();
    setBalance(1000);
  };

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* RULES MODAL */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl max-w-md w-full p-6 border border-slate-700 relative shadow-2xl">
            <h3 className="text-xl font-extrabold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>How To Play & Game Rules</span>
            </h3>

            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                1. <strong className="text-white">Choose Your Wager:</strong> Pick any amount up to your current balance.
              </p>
              <p>
                2. <strong className="text-white">Pick Heads or Tails:</strong> Click the <span className="text-amber-400 font-bold">FLIP HEADS</span> or <span className="text-slate-200 font-bold">FLIP TAILS</span> button to immediately launch the coin.
              </p>
              <p>
                3. <strong className="text-emerald-400">If You Win:</strong> Your wager is <strong className="text-white">DOUBLED (2× payout)</strong> and credited to your balance instantly!
              </p>
              <p>
                4. <strong className="text-rose-400">If You Lose:</strong> You keep nothing ($0.00) from that flip wager.
              </p>
              <p>
                5. <strong className="text-amber-300">Never Run Out:</strong> You can click <strong className="text-white">+ Add $500</strong> anytime to reload your demo bankroll.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors"
              >
                Let&apos;s Flip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER NAV */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-wider text-white">
                  AETHER FLIP
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  2× PAYOUT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Provably Fair • Double or Nothing Coin Flip
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Streak indicator */}
            {streak > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>{streak} Streak</span>
              </div>
            )}

            {/* Wallet / Balance Pill */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1.5 pl-3.5 shadow-md">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <div className="text-xs">
                  <span className="text-slate-400 block sm:inline mr-1">Balance:</span>
                  <span className="font-extrabold text-white text-sm">
                    ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 ml-1 border-l border-slate-800 pl-2">
                <button
                  type="button"
                  onClick={handleTopUp}
                  disabled={isFlipping}
                  className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-500/30 transition-colors disabled:opacity-40"
                  title="Add $500 Free Chips"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">+$500</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetBalance}
                  disabled={isFlipping}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-40"
                  title="Reset Balance to $1,000"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Rules button */}
            <button
              type="button"
              onClick={() => setShowRulesModal(true)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Game Rules"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN GAME ARENA */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Hero Headline */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Flip The Coin.{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
              Double Your Money.
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mt-2">
            Choose <strong className="text-amber-400">Heads</strong> or{" "}
            <strong className="text-slate-200">Tails</strong> below. Win to double your wager instantly, or lose and keep nothing.
          </p>
        </div>

        {/* Center 3D Coin Display */}
        <Coin3D
          isFlipping={isFlipping}
          targetFace={targetFace}
          outcome={outcome}
          selectedChoice={selectedChoice}
        />

        {/* Wager Selection & HEADS / TAILS Action Buttons */}
        <FlipControls
          betAmount={betAmount}
          setBetAmount={setBetAmount}
          balance={balance}
          isFlipping={isFlipping}
          onFlip={handleFlip}
        />

        {/* Flip History & Provably Fair Audit Log */}
        <FlipHistory records={history} onClear={() => setHistory([])} />
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">AETHER FLIP</span>
            <span>•</span>
            <span>Provably Fair 50/50 RNG</span>
            <span>•</span>
            <span>Instant 2× Payouts</span>
          </div>
          <div className="text-slate-400">
            Press <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">[H]</code> for Heads or{" "}
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">[T]</code> for Tails
          </div>
        </div>
      </footer>
    </div>
  );
}
