// Server-side auth helper — Clerk + Prisma User entitisini birlestirir.
// Kullanici DB'de yoksa ilk istek geldiginde otomatik olusturulur (lazy upsert).

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";

/** Mevcut kullanicinin Clerk ID'sini ve DB User satirini doner. Login degilse null. */
export async function getCurrentUser() {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    if (!userId) return null;

    // Once DB'de var mi bak
    let dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (dbUser) return dbUser;

    // Yoksa Clerk'ten profili al ve olustur
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? `${userId}@clerk.local`;
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

    dbUser = await prisma.user.upsert({
      where: { clerkId: userId },
      update: { email, name, imageUrl: clerkUser.imageUrl },
      create: {
        clerkId: userId,
        email,
        name,
        imageUrl: clerkUser.imageUrl,
      },
    });
    return dbUser;
  } catch (e) {
    console.error("[auth] getCurrentUser error:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** API rotalarinda yetkisiz erisim icin throw eden versiyonu. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}
