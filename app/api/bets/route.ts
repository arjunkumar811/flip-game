import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const payloadSchema = z.object({
  walletAddress: z.string().min(32),
  betAmount: z.number().positive(),
  choice: z.enum(["HEADS", "TAILS"]),
  result: z.enum(["HEADS", "TAILS"]),
  outcome: z.enum(["WIN", "LOSE"]),
  payout: z.number().nonnegative(),
  signature: z.string().min(32)
});

export async function GET() {
  const games = await db.bet.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: 15
  });

  return NextResponse.json(games);
}

export async function POST(request: Request) {
  const json = await request.json();
  const payload = payloadSchema.parse(json);

  const bet = await db.bet.create({
    data: payload
  });

  return NextResponse.json(bet, { status: 201 });
}
