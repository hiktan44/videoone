// GET /api/me -> mevcut kullanicinin profil + kredi bakiyesi

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sunucu hatası";
    console.error("[/api/me]", msg, e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
