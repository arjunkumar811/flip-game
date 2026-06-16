import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const match = await db.match.findUnique({ where: { id: params.id } });
    if (!match || match.status !== "WAITING") {
      return NextResponse.json({ error: "Match not found or already completed" }, { status: 400 });
    }

    const feeConfig = await db.systemConfig.findUnique({ where: { key: "platform_fee" } });
    const feePercentage = feeConfig ? parseFloat(feeConfig.value) : 5;

    const botChoice = match.player1Choice === "HEADS" ? "TAILS" : "HEADS";
    const botWallet = "Bot_Wallet_" + Math.random().toString(36).substring(7);

    const totalPool = match.betAmount * 2;
    const platformFee = (totalPool * feePercentage) / 100;
    const payout = totalPool - platformFee;

    const result = Math.random() < 0.5 ? "HEADS" : "TAILS";
    const winnerWallet = result === match.player1Choice ? match.player1Wallet : botWallet;

    const updatedMatch = await db.match.update({
      where: { id: match.id },
      data: {
        player2Wallet: botWallet,
        player2Choice: botChoice as any,
        result: result as any,
        status: "COMPLETED",
        totalPool,
        platformFee,
        payout,
        winnerWallet,
        completedAt: new Date()
      }
    });

    return NextResponse.json(updatedMatch);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
