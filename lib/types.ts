export type BetRow = {
  id: string;
  walletAddress: string;
  betAmount: number;
  choice: "HEADS" | "TAILS";
  result: "HEADS" | "TAILS";
  outcome: "WIN" | "LOSE";
  payout: number;
  signature: string;
  createdAt: string;
};

export type DashboardStats = {
  totalBets: number;
  totalVolume: number;
  totalPayouts: number;
  platformProfit: number;
  winRate: number;
  recent: BetRow[];
};
