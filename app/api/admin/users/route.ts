// Admin API: kullanici listesi + kredi duzeltme
// SADECE User.role === "admin" olan kullanicilar erisebilir.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { earnCredits, chargeCredits } from "@/lib/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: "Unauthorized" as const, status: 401 };
  if (user.role !== "admin") return { error: "Forbidden" as const, status: 403 };
  return { user };
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const url = new URL(req.url);
    const search = url.searchParams.get("q") || "";
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        creditBalance: true,
        role: true,
        createdAt: true,
        _count: { select: { projects: true, jobs: true } },
      },
    });
    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sunucu hatası" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users — kredi duzeltme veya rol degisiklik
// Body: { userId, action: "addCredits"|"chargeCredits"|"setRole", amount?, role? }
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const body = await req.json().catch(() => ({}));
    const targetId = String(body.userId || "");
    const action = String(body.action || "");
    if (!targetId) return NextResponse.json({ error: "userId gerekli" }, { status: 400 });

    if (action === "addCredits") {
      const amount = Math.abs(Number(body.amount || 0));
      if (amount <= 0) return NextResponse.json({ error: "amount > 0" }, { status: 400 });
      const r = await earnCredits({
        userId: targetId,
        amount,
        reason: "admin_adjust",
        metadata: { adminId: auth.user.id, note: body.note || "" },
      });
      return NextResponse.json({ ok: true, balance: r.newBalance });
    }

    if (action === "chargeCredits") {
      const amount = Math.abs(Number(body.amount || 0));
      if (amount <= 0) return NextResponse.json({ error: "amount > 0" }, { status: 400 });
      const r = await chargeCredits({
        userId: targetId,
        amount,
        reason: "admin_adjust",
        metadata: { adminId: auth.user.id, note: body.note || "" },
      });
      return NextResponse.json({ ok: true, balance: r.newBalance });
    }

    if (action === "setRole") {
      const role = String(body.role || "");
      if (!["user", "admin"].includes(role)) {
        return NextResponse.json({ error: "geçersiz rol" }, { status: 400 });
      }
      const u = await prisma.user.update({
        where: { id: targetId },
        data: { role },
      });
      return NextResponse.json({ ok: true, role: u.role });
    }

    return NextResponse.json({ error: "Bilinmeyen action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sunucu hatası" },
      { status: 500 }
    );
  }
}
