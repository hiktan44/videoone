// GET /api/me -> mevcut kullanicinin profil + kredi bakiyesi
// Login degilse 401

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      plan: user.plan,
      creditBalance: user.creditBalance,
      role: user.role,
      referralCode: user.referralCode,
    },
  });
}
