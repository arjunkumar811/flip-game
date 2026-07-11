"use client";

import React from "react";
import { Crown, Shield, Sparkles } from "lucide-react";

export type Choice = "HEADS" | "TAILS";
export type Outcome = "WIN" | "LOSE" | null;

interface Coin3DProps {
  isFlipping: boolean;
  targetFace: Choice;
  outcome: Outcome;
  selectedChoice: Choice | null;
}

export function Coin3D({ isFlipping, targetFace, outcome, selectedChoice }: Coin3DProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 select-none">
      {/* Dynamic Status Pill above coin */}
      <div className="mb-6 h-8 flex items-center justify-center">
        {isFlipping ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-sm font-semibold animate-pulse shadow-lg shadow-amber-500/10">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Coin flipping in mid-air... Calling {selectedChoice}!</span>
          </div>
        ) : outcome === "WIN" ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm font-bold shadow-lg shadow-emerald-500/20">
            <span>🎉 VICTORY! Landed on {targetFace} — Payout DOUBLED!</span>
          </div>
        ) : outcome === "LOSE" ? (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-sm font-bold shadow-lg shadow-rose-500/20">
            <span>💥 Landed on {targetFace} — Better luck next flip!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs md:text-sm">
            <span>Pick Heads or Tails below to launch the coin</span>
          </div>
        )}
      </div>

      {/* 3D Coin Arena */}
      <div className="coin-container my-4 relative flex items-center justify-center">
        {/* Ambient background glow behind coin */}
        <div
          className={`absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none ${
            outcome === "WIN"
              ? "bg-emerald-500/35 scale-125"
              : outcome === "LOSE"
              ? "bg-rose-500/30 scale-110"
              : isFlipping
              ? "bg-amber-500/30 scale-125 animate-pulse"
              : targetFace === "HEADS"
              ? "bg-amber-500/20"
              : "bg-slate-400/20"
          }`}
          style={{ width: "260px", height: "260px" }}
        />

        {/* The 3D Coin element */}
        <div
          className={`coin-3d ${
            isFlipping
              ? targetFace === "HEADS"
                ? "anim-flip-heads"
                : "anim-flip-tails"
              : !isFlipping
              ? "coin-idle-float"
              : ""
          } ${outcome === "WIN" ? "glow-win" : outcome === "LOSE" ? "glow-lose" : ""}`}
          style={{
            transform: isFlipping
              ? undefined
              : targetFace === "HEADS"
              ? "rotateY(0deg)"
              : "rotateY(180deg)",
          }}
        >
          {/* HEADS FACE (GOLD) */}
          <div className="coin-face coin-face-heads">
            <div className="coin-rim" />
            <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-950/30 border-2 border-amber-600/40 flex items-center justify-center mb-2 shadow-inner">
                <Crown className="w-10 h-10 md:w-12 md:h-12 text-amber-900 drop-shadow-sm" />
              </div>
              <span className="text-2xl md:text-3xl font-extrabold tracking-widest text-amber-950 drop-shadow-sm">
                HEADS
              </span>
              <span className="text-[10px] font-bold tracking-widest text-amber-900/70 uppercase mt-0.5">
                2X PAYOUT • 50%
              </span>
            </div>
            {/* Metallic shine streak */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
          </div>

          {/* TAILS FACE (PLATINUM SILVER) */}
          <div className="coin-face coin-face-tails">
            <div className="coin-rim" />
            <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-900/20 border-2 border-slate-500/40 flex items-center justify-center mb-2 shadow-inner">
                <Shield className="w-10 h-10 md:w-12 md:h-12 text-slate-800 drop-shadow-sm" />
              </div>
              <span className="text-2xl md:text-3xl font-extrabold tracking-widest text-slate-900 drop-shadow-sm">
                TAILS
              </span>
              <span className="text-[10px] font-bold tracking-widest text-slate-700 uppercase mt-0.5">
                2X PAYOUT • 50%
              </span>
            </div>
            {/* Metallic shine streak */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Ground shadow reflection */}
      <div className="w-36 h-4 rounded-full bg-black/40 blur-md mt-2 transition-all duration-300" />
    </div>
  );
}
