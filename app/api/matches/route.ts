import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createMatchSchema = z.object({
  walletAddress: z.string().min(32),
  betAmount: z.number().positive(),
  choice: z.enum(["HEADS", "TAILS"]),
});

export async function GET() {
  const matches = await db.match.findMany({
    orderBy: { createdAt: "desc" },
    take: 20
  });
  return NextResponse.json(matches);
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = createMatchSchema.parse(json);

    const feeConfig = await db.systemConfig.findUnique({ where: { key: "platform_fee" } });
    const feePercentage = feeConfig ? parseFloat(feeConfig.value) : 5;

    // Check for an open match with same bet and opposite choice
    const waitingMatch = await db.match.findFirst({
      where: {
        status: "WAITING",
        betAmount: payload.betAmount,
        player1Choice: payload.choice === "HEADS" ? "TAILS" : "HEADS",
        player1Wallet: { not: payload.walletAddress }
      }
    });

    if (waitingMatch) {
      // Join and resolve
      const totalPool = waitingMatch.betAmount * 2;
      const platformFee = (totalPool * feePercentage) / 100;
      const payout = totalPool - platformFee;
      
      const result = Math.random() < 0.5 ? "HEADS" : "TAILS";
      const winnerWallet = result === waitingMatch.player1Choice ? waitingMatch.player1Wallet : payload.walletAddress;

      const updatedMatch = await db.match.update({
        where: { id: waitingMatch.id },
        data: {
          player2Wallet: payload.walletAddress,
          player2Choice: payload.choice,
          result: result as any,
          status: "COMPLETED",
          totalPool,
          platformFee,
          payout,
          winnerWallet,
          completedAt: new Date()
        }
      });

      return NextResponse.json({ match: updatedMatch, action: "joined" }, { status: 200 });
    } else {
      // Create new waiting match
      const newMatch = await db.match.create({
        data: {
          player1Wallet: payload.walletAddress,
          betAmount: payload.betAmount,
          player1Choice: payload.choice,
          status: "WAITING"
        }
      });

      return NextResponse.json({ match: newMatch, action: "created" }, { status: 201 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
