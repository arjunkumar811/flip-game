import { NextRequest, NextResponse } from "next/server";
import { TreasuryService, TreasuryError } from "@/lib/treasury/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { betAmount, choice } = body;

    if (typeof betAmount !== "number" || (choice !== "HEADS" && choice !== "TAILS")) {
      return NextResponse.json(
        { error: "Invalid bet parameters. Provide numeric betAmount and choice ('HEADS' or 'TAILS')." },
        { status: 400 }
      );
    }

    const settlement = TreasuryService.settleFlip(betAmount, choice);
    return NextResponse.json(settlement, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof TreasuryError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
