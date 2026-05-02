// DELETE /api/me/delete
// GDPR Madde 17 (Right to erasure) / KVKK Madde 7 (Verilerin silinmesi).
// Body: { confirm: "DELETE" }  -> client'ın yanlışlıkla tetiklemesini engellemek için zorunlu.
//
// 1. DB'deki tüm kullanici verilerini siler (Prisma cascade).
// 2. Clerk'ten kullanici hesabini siler (isteğe bağlı — CLERK_SECRET_KEY varsa).
// 3. (Not: R2'deki object'ler yasal saklama suresi sonrasi cron ile silinir.)
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") {
    return NextResponse.json(
      { error: "Onay gerekli — body'de { confirm: \"DELETE\" } yollayın" },
      { status: 400 }
    );
  }

  try {
    // 1. Cascade ile tum verileri sil (schema'da onDelete: Cascade)
    await prisma.user.delete({ where: { id: user.id } });

    // 2. Clerk hesabını sil (varsa)
    if (process.env.CLERK_SECRET_KEY && user.clerkId) {
      try {
        await fetch(`https://api.clerk.com/v1/users/${user.clerkId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
        });
      } catch (e) {
        console.error("[me/delete] Clerk delete failed:", e);
      }
    }

    return NextResponse.json({ ok: true, deletedAt: new Date().toISOString() });
  } catch (e) {
    console.error("[me/delete]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Silme hatası" },
      { status: 500 }
    );
  }
}
