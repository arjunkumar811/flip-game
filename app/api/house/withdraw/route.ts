import { NextRequest, NextResponse } from "next/server";
import { TreasuryService, TreasuryError } from "@/lib/treasury/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount } = body;

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid withdrawal amount." }, { status: 400 });
    }

    const updatedState = TreasuryService.withdraw(amount);
    return NextResponse.json(updatedState, { status: 200 });
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
