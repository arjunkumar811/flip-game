import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [count, aggregate, wins, recent] = await Promise.all([
    db.bet.count(),
    db.bet.aggregate({
      _sum: {
        betAmount: true,
        payout: true
      }
    }),
    db.bet.count({
      where: {
        outcome: "WIN"
      }
    }),
    db.bet.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 8
    })
  ]);

  const totalVolume = aggregate._sum.betAmount ?? 0;
  const totalPayouts = aggregate._sum.payout ?? 0;
  const winRate = count === 0 ? 0 : wins / count;

  return NextResponse.json({
    totalBets: count,
    totalVolume,
    totalPayouts,
    platformProfit: totalVolume - totalPayouts,
    winRate,
    recent
  });
}
