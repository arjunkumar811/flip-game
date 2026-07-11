"use client";

import React from "react";
import { Crown, Shield, Coins, ArrowUpRight, AlertCircle, ShieldAlert } from "lucide-react";
import type { Choice } from "./coin-3d";

const QUICK_CHIPS = [1, 5, 10, 25, 50, 100, 250];

interface FlipControlsProps {
  betAmount: number;
  setBetAmount: (amount: number) => void;
  balance: number;
  minBet: number;
  maxBet: number;
  isFlipping: boolean;
  onFlip: (choice: Choice) => void;
  errorMessage?: string | null;
}

export function FlipControls({
  betAmount,
  setBetAmount,
  balance,
  minBet,
  maxBet,
  isFlipping,
  onFlip,
  errorMessage,
}: FlipControlsProps) {
  const isInsufficient = betAmount > balance;
  const isBelowMin = betAmount < minBet;
  const isAboveMax = betAmount > maxBet;
  const isInvalid = isNaN(betAmount) || betAmount <= 0 || isBelowMin || isAboveMax || isInsufficient;

  const handleHalf = () => {
    setBetAmount(Math.max(minBet, Math.floor(betAmount / 2)));
  };

  const handleDouble = () => {
    setBetAmount(Math.min(maxBet, betAmount * 2));
  };

  const handleMaxLimit = () => {
    setBetAmount(Math.min(balance, maxBet));
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      {/* 1. BET AMOUNT SELECTION PANEL */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-700/60 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <label className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Wager Amount (USDT)</span>
            </label>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 font-mono">
              Limits: ${minBet} - ${maxBet}
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-300">
            Payout (1.98x):{" "}
            <span className="text-emerald-400 font-bold">
              ${(isNaN(betAmount) || betAmount <= 0 ? 0 : betAmount * 1.98).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* Input box + multiplier actions */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              $
            </span>
            <input
              type="number"
              min={minBet}
              max={maxBet}
              step="any"
              value={betAmount || ""}
              disabled={isFlipping}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setBetAmount(isNaN(val) ? 0 : val);
              }}
              className="w-full bg-slate-900/80 border border-slate-700 focus:border-amber-500 rounded-xl py-3 pl-8 pr-4 font-bold text-lg text-white outline-none transition-all disabled:opacity-50"
              placeholder="Enter USDT..."
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={isFlipping}
              onClick={handleHalf}
              className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors disabled:opacity-40"
            >
              ½x
            </button>
            <button
              type="button"
              disabled={isFlipping}
              onClick={handleDouble}
              className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors disabled:opacity-40"
            >
              2x
            </button>
            <button
              type="button"
              disabled={isFlipping}
              onClick={handleMaxLimit}
              className="px-3.5 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-colors disabled:opacity-40"
              title={`Set to dynamic Max Bet limit ($${maxBet})`}
            >
              MAX ({maxBet})
            </button>
          </div>
        </div>

        {/* Quick chip buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_CHIPS.filter((chip) => chip <= maxBet || chip === 10 || chip === 25).map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={isFlipping}
              onClick={() => setBetAmount(chip)}
              className={`flex-1 min-w-[56px] py-2 rounded-lg text-xs font-bold border transition-all ${
                betAmount === chip
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 scale-105"
                  : "bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-slate-700/80"
              } disabled:opacity-40`}
            >
              ${chip}
            </button>
          ))}
        </div>

        {/* Error / Validation Feedback */}
        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!errorMessage && isAboveMax && (
          <div className="mt-3 flex items-center gap-2 text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Maximum bet is currently {maxBet} USDT (5% of House Bankroll).</span>
          </div>
        )}

        {!errorMessage && isBelowMin && (
          <div className="mt-3 flex items-center gap-2 text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Minimum bet is currently {minBet} USDT.</span>
          </div>
        )}

        {!errorMessage && isInsufficient && (
          <div className="mt-3 flex items-center gap-2 text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Wager exceeds your current balance of ${balance.toFixed(2)} USDT.</span>
          </div>
        )}
      </div>

      {/* 2. TWO PRIMARY ACTION BUTTONS ('HEADS' and 'TAILS') */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* HEADS BUTTON */}
        <button
          type="button"
          disabled={isFlipping || isInvalid}
          onClick={() => onFlip("HEADS")}
          className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 glass-panel-gold hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                <Crown className="w-8 h-8 text-amber-400" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-white tracking-wide">
                    FLIP HEADS
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono">
                    [H]
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                  <span>Bet ${betAmount || 0}</span>
                  <span className="text-amber-400 font-bold">
                    → Win ${(isNaN(betAmount) ? 0 : betAmount * 1.98).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowUpRight className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </button>

        {/* TAILS BUTTON */}
        <button
          type="button"
          disabled={isFlipping || isInvalid}
          onClick={() => onFlip("TAILS")}
          className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 glass-panel-silver hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-400/10 via-transparent to-slate-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-700/40 border border-slate-400/40 flex items-center justify-center group-hover:bg-slate-700/60 transition-colors">
                <Shield className="w-8 h-8 text-slate-200" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold text-white tracking-wide">
                    FLIP TAILS
                  </span>
                  <span className="text-[10px] bg-slate-700/60 text-slate-300 border border-slate-500/40 px-1.5 py-0.5 rounded font-mono">
                    [T]
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                  <span>Bet ${betAmount || 0}</span>
                  <span className="text-slate-200 font-bold">
                    → Win ${(isNaN(betAmount) ? 0 : betAmount * 1.98).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowUpRight className="w-5 h-5 text-slate-200" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
