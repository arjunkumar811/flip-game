"use client";

import useSWR from "swr";
import { ArrowDownUp, BadgeDollarSign, History, PieChart } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import type { DashboardStats } from "@/lib/types";

export function Dashboard() {
  const { data } = useSWR<DashboardStats>("/api/stats", fetcher, {
    refreshInterval: 12000
  });

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Dashboard</div>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white">Treasury and gameplay telemetry</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <MetricCard icon={History} label="Total Bets" value={String(data?.totalBets ?? 0)} />
        <MetricCard icon={ArrowDownUp} label="Total Volume" value={`${(data?.totalVolume ?? 0).toFixed(4)} SOL`} />
        <MetricCard icon={BadgeDollarSign} label="Total Payouts" value={`${(data?.totalPayouts ?? 0).toFixed(4)} SOL`} />
        <MetricCard icon={PieChart} label="Platform Profit" value={`${(data?.platformProfit ?? 0).toFixed(4)} SOL`} />
      </div>

      <div className="mt-6 rounded-[24px] border border-white/10 bg-night/70 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Win Rate</div>
            <div className="mt-2 font-display text-4xl text-white">{(((data?.winRate ?? 0) * 100) || 0).toFixed(1)}%</div>
          </div>
          <div className="h-24 w-24 rounded-full border-8 border-cyan/30 border-t-cyan" />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">Wallet</th>
              <th className="px-4 py-3 font-medium">Bet</th>
              <th className="px-4 py-3 font-medium">Choice</th>
              <th className="px-4 py-3 font-medium">Result</th>
              <th className="px-4 py-3 font-medium">Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-night/60 text-slate-200">
            {(data?.recent ?? []).map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-mono text-xs">{row.walletAddress.slice(0, 4)}...{row.walletAddress.slice(-4)}</td>
                <td className="px-4 py-3">{row.betAmount.toFixed(2)} SOL</td>
                <td className="px-4 py-3">{row.choice}</td>
                <td className="px-4 py-3">{row.result}</td>
                <td className="px-4 py-3">{row.payout.toFixed(4)} SOL</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-night/65 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
        <Icon className="h-4 w-4 text-cyan" />
      </div>
      <div className="mt-4 font-display text-2xl text-white">{value}</div>
    </div>
  );
}
