import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  let config = await db.systemConfig.findUnique({ where: { key: "platform_fee" } });
  
  if (!config) {
    // default to 5%
    config = await db.systemConfig.create({
      data: { key: "platform_fee", value: "5" }
    });
  }

  return NextResponse.json({ feePercentage: parseFloat(config.value) });
}

export async function POST(request: Request) {
  const { feePercentage } = await request.json();
  
  if (typeof feePercentage !== "number" || feePercentage < 0 || feePercentage > 100) {
    return NextResponse.json({ error: "Invalid fee percentage" }, { status: 400 });
  }

  const config = await db.systemConfig.upsert({
    where: { key: "platform_fee" },
    update: { value: feePercentage.toString() },
    create: { key: "platform_fee", value: feePercentage.toString() }
  });

  return NextResponse.json({ feePercentage: parseFloat(config.value) });
}
