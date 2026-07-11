import { NextResponse } from "next/server";
import { TreasuryService } from "@/lib/treasury/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = TreasuryService.getHouseState();
    return NextResponse.json(state, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
