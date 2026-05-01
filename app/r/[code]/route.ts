// /r/[code] — referral linki. Cookie set edip /sign-up'a yonlendirir.
// Yeni kullanici signup yapinca cookie'den ref code okunur, Referral kaydi olusur.

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const safe = code.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);

  const url = new URL("/sign-up", process.env.NEXT_PUBLIC_APP_URL || "https://videoone.com.tr");
  if (safe) url.searchParams.set("ref", safe);

  const res = NextResponse.redirect(url, 302);
  if (safe) {
    res.cookies.set("vibe_ref", safe, {
      httpOnly: false, // client okuyabilsin (SignUp sonrasi POST icin)
      maxAge: 30 * 24 * 60 * 60, // 30 gun
      path: "/",
      sameSite: "lax",
    });
  }
  return res;
}
