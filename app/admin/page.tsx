"use client";

import { useState, useEffect } from "react";

export default function AdminPage() {
  const [fee, setFee] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => setFee(data.feePercentage));
    
    fetch("/api/matches")
      .then(res => res.json())
      .then(data => setMatches(data));
  }, []);

  const saveFee = async () => {
    if (fee === null) return;
    setSaving(true);
    await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feePercentage: fee })
    });
    setSaving(false);
  };

  const totalFeesCollected = matches.reduce((sum, m) => sum + (m.platformFee || 0), 0);

  return (
    <div className="min-h-screen bg-[var(--bg)] p-8 text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[var(--gold)]">Admin Dashboard</h1>
        
        <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--card-border)]">
          <h2 className="text-xl font-semibold mb-4">Platform Settings</h2>
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Platform Fee (%)</label>
              <input 
                type="number" 
                value={fee ?? ""} 
                onChange={(e) => setFee(parseFloat(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white w-32"
                min="0" max="100" step="0.1"
              />
            </div>
            <button 
              onClick={saveFee} 
              disabled={saving}
              className="mt-6 bg-[var(--gold)] text-black px-4 py-2 rounded font-semibold hover:bg-[var(--gold-dark)]"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--card-border)]">
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-sm text-slate-400">Total Matches</div>
              <div className="text-2xl font-bold">{matches.length}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-sm text-slate-400">Total Fees Collected (SOL)</div>
              <div className="text-2xl font-bold text-[var(--green)]">{totalFeesCollected.toFixed(4)} SOL</div>
            </div>
          </div>
        </div>
        
        <div className="bg-[var(--card)] p-6 rounded-2xl border border-[var(--card-border)]">
          <h2 className="text-xl font-semibold mb-4">Recent Match Logs</h2>
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-2">Match ID</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Pool</th>
                <th className="pb-2">Fee</th>
                <th className="pb-2">Payout</th>
              </tr>
            </thead>
            <tbody>
              {matches.map(m => (
                <tr key={m.id} className="border-t border-[var(--card-border)]">
                  <td className="py-2 text-slate-300 truncate max-w-[120px]">{m.id}</td>
                  <td className="py-2">{m.status}</td>
                  <td className="py-2">{m.totalPool?.toFixed(2) || "-"} SOL</td>
                  <td className="py-2 text-[var(--green)]">{m.platformFee?.toFixed(4) || "-"} SOL</td>
                  <td className="py-2">{m.payout?.toFixed(2) || "-"} SOL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
