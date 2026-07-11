"use client";

import React, { useState } from "react";
import {
  History,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  TrendingUp,
  Award,
  Flame,
} from "lucide-react";
import type { Choice, Outcome } from "./coin-3d";

export interface FlipRecord {
  id: string;
  choice: Choice;
  result: Choice;
  outcome: Outcome;
  wager: number;
  payout: number;
  timestamp: string;
}

interface FlipHistoryProps {
  records: FlipRecord[];
  onClear: () => void;
}

export function FlipHistory({ records, onClear }: FlipHistoryProps) {
  const [filter, setFilter] = useState<"ALL" | "WIN" | "LOSE">("ALL");
  const [showFairModal, setShowFairModal] = useState(false);

  const filteredRecords = records.filter((rec) => {
    if (filter === "ALL") return true;
    return rec.outcome === filter;
  });

  const totalFlips = records.length;
  const totalWins = records.filter((r) => r.outcome === "WIN").length;
  const winRate = totalFlips > 0 ? ((totalWins / totalFlips) * 100).toFixed(1) : "0.0";

  const netProfit = records.reduce((acc, r) => acc + (r.payout - r.wager), 0);

  return (
    <div className="w-full max-w-4xl mx-auto mt-10">
      {/* Provably Fair Modal */}
      {showFairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl max-w-lg w-full p-6 border border-slate-700 relative shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Provably Fair Verification
                </h3>
                <p className="text-xs text-slate-400">
                  Cryptographically secure random number generation
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                Every coin flip on <span className="text-amber-400 font-bold">Aether Flip</span> uses the standard browser-native{" "}
                <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">
                  window.crypto.getRandomValues()
                </code>{" "}
                API.
              </p>
              <p>
                Unlike standard <code className="bg-slate-800 px-1 text-slate-300">Math.random()</code>, Web Crypto produces true hardware/OS cryptographic randomness.
              </p>
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
                {`// Cryptographic 50/50 Coin Flip Logic
const array = new Uint32Array(1);
window.crypto.getRandomValues(array);
const isHeads = (array[0] % 2 === 0);`}
              </div>
              <p>
                When you win, your payout is exactly <strong className="text-white">2× your wager</strong>. When you lose, you keep nothing ($0.00).
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFairModal(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-panel rounded-2xl p-4 border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Flips</span>
            <History className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">{totalFlips}</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Win Rate</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{winRate}%</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Net Session P/L</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div
            className={`text-2xl font-extrabold mt-1 ${
              netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {netProfit >= 0 ? "+" : ""}${netProfit.toFixed(2)}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Fairness Audit</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <button
            type="button"
            onClick={() => setShowFairModal(true)}
            className="mt-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4"
          >
            Verify Cryptography →
          </button>
        </div>
      </div>

      {/* HISTORY TABLE PANEL */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <span>Flip History Log</span>
            </h3>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              {records.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filter === "ALL" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("WIN")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filter === "WIN" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Wins
              </button>
              <button
                type="button"
                onClick={() => setFilter("LOSE")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filter === "LOSE" ? "bg-rose-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Losses
              </button>
            </div>

            {records.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors"
                title="Clear History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No coin flip records yet. Choose <strong className="text-amber-400">Heads</strong> or{" "}
            <strong className="text-slate-200">Tails</strong> above to start!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3">Your Choice</th>
                  <th className="py-3 px-3">Coin Landed</th>
                  <th className="py-3 px-3">Wager</th>
                  <th className="py-3 px-3">Payout</th>
                  <th className="py-3 px-3 text-right">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-xs text-slate-400 font-mono">
                      {rec.timestamp}
                    </td>
                    <td className="py-3 px-3 font-semibold">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          rec.choice === "HEADS"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-700/60 text-slate-200 border border-slate-500/30"
                        }`}
                      >
                        {rec.choice}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          rec.result === "HEADS"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-slate-700/60 text-slate-200 border border-slate-500/30"
                        }`}
                      >
                        {rec.result}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono">
                      ${rec.wager.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-3 font-mono font-bold ${
                        rec.outcome === "WIN" ? "text-emerald-400" : "text-slate-400"
                      }`}
                    >
                      ${rec.payout.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {rec.outcome === "WIN" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>DOUBLED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>KEPT NOTHING</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
