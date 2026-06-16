"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { RefreshCw, Wallet } from "lucide-react";

export function WalletBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      const lamports = await connection.getBalance(publicKey);
      if (!cancelled) {
        setBalance(lamports / LAMPORTS_PER_SOL);
        setLoading(false);
      }
    }

    void load();
    const id = window.setInterval(() => void load(), 15000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [connection, publicKey]);

  return (
    <div className="inline-flex min-w-[200px] items-center justify-between gap-3 rounded-full border border-white/10 bg-night/80 px-4 py-3 text-sm text-slate-200">
      <div className="inline-flex items-center gap-2">
        <Wallet className="h-4 w-4 text-cyan" />
        <span>{publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : "No wallet"}</span>
      </div>
      <span className="inline-flex items-center gap-2 font-mono text-xs text-slate-300">
        {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
        {balance === null ? "--" : `${balance.toFixed(3)} SOL`}
      </span>
    </div>
  );
}
