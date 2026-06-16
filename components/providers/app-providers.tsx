"use client";

import { WalletProvider } from "./wallet-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
